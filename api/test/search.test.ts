/**
 * Semantic search — service + route tests.
 *
 * Workers AI is NEVER called for real: the AI binding is a stub. The correctness
 * anchor: feeding semanticSearch the EXACT stored embedding of a known
 * program (its int8 row dequantized back to floats) must rank that program
 * first with score ≈ 1.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index';
import searchRouter from '../src/routes/search';
import {
  searchPrograms,
  semanticSearch,
  SearchUnavailableError,
  type SearchEnv,
} from '../src/services/search';
import vectorsBin from '../data/vectors.bin';
import vectorsMeta from '../data/vectors.meta.json';
import programsJson from '../data/programs.json';

const ids = vectorsMeta.ids as string[];
const DIM = vectorsMeta.dim as number;
const programs = programsJson as Record<
  string,
  { degree_level: string; language: string | null }
>;

// Workers AI is NEVER called for real: tests install a stub AI binding on ENV.
const ENV: SearchEnv = {};

/** Dequantize a stored int8 row back to the floats bge-m3 "would" return. */
function dequantizedRow(programId: string): number[] {
  const i = ids.indexOf(programId);
  expect(i).toBeGreaterThanOrEqual(0);
  const row = new Int8Array(vectorsBin, i * DIM, DIM);
  return Array.from(row, (v) => v / vectorsMeta.scale);
}

function mockModel(values: number[]) {
  const fn = vi.fn(async (_model: string, _input: { text: string[] }) => ({ shape: [1, values.length], data: [values] }));
  ENV.AI = { run: fn };
  return fn;
}

function mockModelFailure(message: string) {
  const fn = vi.fn(async () => { throw new Error(message); });
  ENV.AI = { run: fn };
  return fn;
}

afterEach(() => {
  delete ENV.AI;
  vi.unstubAllGlobals();
});

// Known anchors (verified against api/data at test-write time, but looked up
// dynamically so a data refresh keeps tests honest).
const MASTER_ENGLISH = ids.find(
  (id) =>
    programs[id]?.degree_level === 'master' &&
    (programs[id]?.language ?? '').toLowerCase().includes('english'),
)!;
const BACHELOR = ids.find((id) => programs[id]?.degree_level === 'bachelor')!;

describe('semanticSearch (service)', () => {
  it('ranks the program whose exact stored embedding the query returns as the top hit', async () => {
    mockModel(dequantizedRow(MASTER_ENGLISH));
    const hits = await semanticSearch('human computer interaction', {}, ENV);
    expect(hits[0].program.program_id).toBe(MASTER_ENGLISH);
    expect(hits[0].score).toBeGreaterThanOrEqual(0.95);
    // quantization noise can push the self-similarity score slightly past 1
    expect(hits[0].score).toBeLessThanOrEqual(1.02);
    // default limit is 10
    expect(hits).toHaveLength(10);
    // sorted desc
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i].score).toBeLessThanOrEqual(hits[i - 1].score);
    }
  });

  it('embeds the query with the same model and dimensionality as the stored vectors', async () => {
    const fn = mockModel(dequantizedRow(MASTER_ENGLISH));
    await semanticSearch('test query', {}, ENV);
    expect(fn).toHaveBeenCalledExactlyOnceWith('@cf/baai/bge-m3', { text: ['test query'] });
    expect(vectorsMeta.model).toBe('@cf/baai/bge-m3');
    expect(DIM).toBe(1024);
  });

  it('degreeLevel filter constrains hits (and excludes the otherwise-top hit)', async () => {
    mockModel(dequantizedRow(MASTER_ENGLISH)); // a master program
    const hits = await semanticSearch('x', { degreeLevel: 'bachelor', limit: 50 }, ENV);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) expect(h.program.degree_level).toBe('bachelor');
    expect(hits.map((h) => h.program.program_id)).not.toContain(MASTER_ENGLISH);
  });

  it('language filter is a case-insensitive substring match', async () => {
    mockModel(dequantizedRow(MASTER_ENGLISH));
    const hits = await semanticSearch('x', { language: 'ENGLISH', limit: 50 }, ENV);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      const lang = programs[h.program.program_id]?.language ?? '';
      expect(lang.toLowerCase()).toContain('english');
    }
    expect(hits.map((h) => h.program.program_id)).toContain(MASTER_ENGLISH);
  });

  it('respects limit and caps it at 50', async () => {
    mockModel(dequantizedRow(BACHELOR));
    expect(await semanticSearch('x', { limit: 3 }, ENV)).toHaveLength(3);
    expect(await semanticSearch('x', { limit: 999 }, ENV)).toHaveLength(50);
  });

  it('minScore drops low-similarity hits but keeps the exact match', async () => {
    mockModel(dequantizedRow(BACHELOR));
    const all = await semanticSearch('x', { limit: 50 }, ENV);
    const filtered = await semanticSearch('x', { minScore: 0.95, limit: 50 }, ENV);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(all.length);
    for (const h of filtered) expect(h.score).toBeGreaterThanOrEqual(0.95);
    expect(filtered.map((h) => h.program.program_id)).toContain(BACHELOR);
  });

  it('throws SearchUnavailableError without the AI binding (and never calls the model)', async () => {
    const fn = mockModel(dequantizedRow(BACHELOR));
    await expect(semanticSearch('x', {}, {})).rejects.toBeInstanceOf(SearchUnavailableError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('propagates a plain Error when Workers AI fails', async () => {
    mockModelFailure('3036: daily free allocation exceeded');
    const err = await semanticSearch('x', {}, ENV).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(SearchUnavailableError);
    expect((err as Error).message).toContain('3036');
  });

  it('rejects an unexpected model response shape', async () => {
    mockModel([0.1, 0.2]); // wrong dimensionality
    await expect(semanticSearch('x', {}, ENV)).rejects.toThrow(/unexpected shape/);
  });

  it('caches query embeddings: an identical (normalized) query does not re-run the model', async () => {
    // vitest/node has no Workers `caches`; stub one backed by a Map so the
    // real cache wrapper code path runs end-to-end.
    const store = new Map<string, string>();
    vi.stubGlobal('caches', {
      default: {
        match: async (req: Request | string) => {
          const url = typeof req === 'string' ? req : req.url;
          const body = store.get(url);
          return body === undefined ? undefined : new Response(body);
        },
        put: async (req: Request | string, res: Response) => {
          const url = typeof req === 'string' ? req : req.url;
          store.set(url, await res.text());
        },
      },
    });
    const fn = mockModel(dequantizedRow(MASTER_ENGLISH));
    const first = await semanticSearch('Sound Art', {}, ENV);
    // different casing/whitespace must normalize to the same cache key
    const second = await semanticSearch('  sound   ART ', {}, ENV);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(store.size).toBe(1);
    expect(second[0].program.program_id).toBe(first[0].program.program_id);
  });
});

describe('searchPrograms (keyword fallback)', () => {
  it('is semantic when the model answers', async () => {
    mockModel(dequantizedRow(MASTER_ENGLISH));
    const { mode, hits } = await searchPrograms('x', {}, ENV);
    expect(mode).toBe('semantic');
    expect(hits[0].program.program_id).toBe(MASTER_ENGLISH);
  });

  it('falls back to word overlap when Workers AI fails, keeping filters and listed programs only', async () => {
    mockModelFailure('3036: daily free allocation exceeded');
    const { mode, hits } = await searchPrograms('documentary film', { degreeLevel: 'master', limit: 50 }, ENV);
    expect(mode).toBe('keyword');
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      expect(h.program.degree_level).toBe('master');
      expect(h.score).toBeGreaterThan(0);
      expect(h.score).toBeLessThanOrEqual(1);
      expect((programsJson as any)[h.program.program_id].status?.status ?? '').not.toMatch(/not-matched|discontinued/);
    }
    for (let i = 1; i < hits.length; i++) expect(hits[i].score).toBeLessThanOrEqual(hits[i - 1].score);
    expect(hits[0].score).toBe(1); // a program mentioning both words outranks one with only "film"
  });

  it('still reports a missing binding instead of silently degrading', async () => {
    await expect(searchPrograms('x', {}, {})).rejects.toBeInstanceOf(SearchUnavailableError);
  });
});

describe('semanticSearch (warned records)', () => {
  it('never returns a not-matched record, even for its own exact embedding', async () => {
    const warned = ids.find((id) => (programsJson as any)[id]?.status?.status === 'not-matched')!;
    mockModel(dequantizedRow(warned));
    const hits = await semanticSearch('anything', { limit: 50 }, ENV);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.map((h) => h.program.program_id)).not.toContain(warned);
  });
});

describe('GET /v1/search (route)', () => {
  it('returns { query, mode, count, hits } with ProgramSummary hits', async () => {
    mockModel(dequantizedRow(MASTER_ENGLISH));
    const res = await app.request('/v1/search?q=human+computer+interaction', {}, ENV);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.query).toBe('human computer interaction');
    expect(body.mode).toBe('semantic');
    expect(body.count).toBe(body.hits.length);
    expect(body.hits).toHaveLength(10);
    expect(body.hits[0].program.program_id).toBe(MASTER_ENGLISH);
    expect(body.hits[0].score).toBeGreaterThanOrEqual(0.95);
    expect(Object.keys(body.hits[0].program).sort()).toEqual([
      'degree',
      'degree_level',
      'name',
      'program_id',
      'school_id',
      'school_name',
    ]);
  });

  it('passes limit / degree_level / language / min_score through', async () => {
    mockModel(dequantizedRow(MASTER_ENGLISH));
    const res = await app.request(
      '/v1/search?q=x&limit=5&degree_level=master&language=english&min_score=-1',
      {},
      ENV,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.hits.length).toBeLessThanOrEqual(5);
    for (const h of body.hits) expect(h.program.degree_level).toBe('master');
  });

  it('400s on missing q', async () => {
    const res = await app.request('/v1/search', {}, ENV);
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe('validation_error');
    expect(body.error.message).toContain('q');
  });

  it('400s on empty q, q > 500 chars, and limit > 50', async () => {
    for (const qs of ['q=', `q=${'a'.repeat(501)}`, 'q=ok&limit=51']) {
      const res = await app.request(`/v1/search?${qs}`, {}, ENV);
      expect(res.status, qs).toBe(400);
      const body = (await res.json()) as any;
      expect(body.error.code).toBe('validation_error');
    }
  });

  it('503s with search_unavailable when the AI binding is missing', async () => {
    const res = await app.request('/v1/search?q=test', {}, {});
    expect(res.status).toBe(503);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe('search_unavailable');
  });

  it('answers with keyword hits (200, mode keyword) when Workers AI fails', async () => {
    mockModelFailure('3036: daily free allocation exceeded');
    const res = await app.request('/v1/search?q=documentary+film', {}, ENV);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.mode).toBe('keyword');
    expect(body.count).toBeGreaterThan(0);
  });

  it('sets Cache-Control max-age=300 (route and assembled app agree)', async () => {
    mockModel(dequantizedRow(BACHELOR));
    const direct = await searchRouter.request('/?q=test', {}, ENV);
    expect(direct.status).toBe(200);
    expect(direct.headers.get('Cache-Control')).toBe('public, max-age=300');
    // the shared cache middleware carves out /v1/search with the same TTL
    const viaApp = await app.request('/v1/search?q=test', {}, ENV);
    expect(viaApp.status).toBe(200);
    expect(viaApp.headers.get('Cache-Control')).toBe('public, max-age=300');
  });

  it('appears in /openapi.json', async () => {
    const res = await app.request('/openapi.json');
    const spec = (await res.json()) as any;
    expect(Object.keys(spec.paths)).toContain('/v1/search');
  });
});
