/**
 * Semantic search — service + route tests.
 *
 * Gemini is NEVER called for real: global fetch is mocked. The correctness
 * anchor: feeding semanticSearch the EXACT stored embedding of a known
 * program (its int8 row dequantized back to floats) must rank that program
 * first with score ≈ 1.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index';
import searchRouter from '../src/routes/search';
import {
  semanticSearch,
  SearchUnavailableError,
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

const ENV = { GEMINI_API_KEY: 'test-key' };

/** Dequantize a stored int8 row back to the floats Gemini "would" return. */
function dequantizedRow(programId: string): number[] {
  const i = ids.indexOf(programId);
  expect(i).toBeGreaterThanOrEqual(0);
  const row = new Int8Array(vectorsBin, i * DIM, DIM);
  return Array.from(row, (v) => v / vectorsMeta.scale);
}

function mockGemini(values: number[]) {
  const fn = vi.fn(
    async () =>
      new Response(JSON.stringify({ embedding: { values } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  vi.stubGlobal('fetch', fn);
  return fn;
}

function mockGeminiFailure(status: number) {
  const fn = vi.fn(async () => new Response('boom', { status }));
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
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
    mockGemini(dequantizedRow(MASTER_ENGLISH));
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

  it('calls Gemini with the same model, taskType and dimensionality as the build script', async () => {
    const fn = mockGemini(dequantizedRow(MASTER_ENGLISH));
    await semanticSearch('test query', {}, ENV);
    expect(fn).toHaveBeenCalledTimes(1);
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('models/gemini-embedding-2-preview:embedContent');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
    const body = JSON.parse(init.body as string);
    expect(body.taskType).toBe('SEMANTIC_SIMILARITY');
    expect(body.outputDimensionality).toBe(3072);
    expect(body.content.parts[0].text).toBe('test query');
  });

  it('degreeLevel filter constrains hits (and excludes the otherwise-top hit)', async () => {
    mockGemini(dequantizedRow(MASTER_ENGLISH)); // a master program
    const hits = await semanticSearch('x', { degreeLevel: 'bachelor', limit: 50 }, ENV);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) expect(h.program.degree_level).toBe('bachelor');
    expect(hits.map((h) => h.program.program_id)).not.toContain(MASTER_ENGLISH);
  });

  it('language filter is a case-insensitive substring match', async () => {
    mockGemini(dequantizedRow(MASTER_ENGLISH));
    const hits = await semanticSearch('x', { language: 'ENGLISH', limit: 50 }, ENV);
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      const lang = programs[h.program.program_id]?.language ?? '';
      expect(lang.toLowerCase()).toContain('english');
    }
    expect(hits.map((h) => h.program.program_id)).toContain(MASTER_ENGLISH);
  });

  it('respects limit and caps it at 50', async () => {
    mockGemini(dequantizedRow(BACHELOR));
    expect(await semanticSearch('x', { limit: 3 }, ENV)).toHaveLength(3);
    expect(await semanticSearch('x', { limit: 999 }, ENV)).toHaveLength(50);
  });

  it('minScore drops low-similarity hits but keeps the exact match', async () => {
    mockGemini(dequantizedRow(BACHELOR));
    const all = await semanticSearch('x', { limit: 50 }, ENV);
    const filtered = await semanticSearch('x', { minScore: 0.95, limit: 50 }, ENV);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(all.length);
    for (const h of filtered) expect(h.score).toBeGreaterThanOrEqual(0.95);
    expect(filtered.map((h) => h.program.program_id)).toContain(BACHELOR);
  });

  it('throws SearchUnavailableError without GEMINI_API_KEY (and never calls fetch)', async () => {
    const fn = mockGemini(dequantizedRow(BACHELOR));
    await expect(semanticSearch('x', {}, {})).rejects.toBeInstanceOf(SearchUnavailableError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('propagates a plain Error on Gemini HTTP failure', async () => {
    mockGeminiFailure(500);
    const err = await semanticSearch('x', {}, ENV).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(SearchUnavailableError);
    expect((err as Error).message).toContain('500');
  });

  it('rejects an unexpected Gemini response shape', async () => {
    mockGemini([0.1, 0.2]); // wrong dimensionality
    await expect(semanticSearch('x', {}, ENV)).rejects.toThrow(/unexpected shape/);
  });

  it('caches query embeddings: an identical (normalized) query does not re-hit Gemini', async () => {
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
    const fn = mockGemini(dequantizedRow(MASTER_ENGLISH));
    const first = await semanticSearch('Sound Art', {}, ENV);
    // different casing/whitespace must normalize to the same cache key
    const second = await semanticSearch('  sound   ART ', {}, ENV);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(store.size).toBe(1);
    expect(second[0].program.program_id).toBe(first[0].program.program_id);
  });
});

describe('GET /v1/search (route)', () => {
  it('returns { query, count, hits } with ProgramSummary hits', async () => {
    mockGemini(dequantizedRow(MASTER_ENGLISH));
    const res = await app.request('/v1/search?q=human+computer+interaction', {}, ENV);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.query).toBe('human computer interaction');
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
    mockGemini(dequantizedRow(MASTER_ENGLISH));
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

  it('503s with search_unavailable when GEMINI_API_KEY is missing', async () => {
    const res = await app.request('/v1/search?q=test', {}, {});
    expect(res.status).toBe(503);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe('search_unavailable');
  });

  it('502s with upstream_error when Gemini fails', async () => {
    mockGeminiFailure(500);
    const res = await app.request('/v1/search?q=test', {}, ENV);
    expect(res.status).toBe(502);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe('upstream_error');
  });

  it('sets Cache-Control max-age=300 (route and assembled app agree)', async () => {
    mockGemini(dequantizedRow(BACHELOR));
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
