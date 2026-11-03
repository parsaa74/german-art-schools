import { describe, expect, it } from 'vitest';
import app from '../src/index';
import programsJson from '../data/programs.json';
import schoolsJson from '../data/schools.json';

type AnyProgram = (typeof programsJson)[keyof typeof programsJson];
// Listings exclude warned records (not-matched / discontinued); those stay fetchable by id.
const records = Object.values(programsJson) as AnyProgram[];
const allPrograms = records.filter((p) => !['not-matched', 'discontinued'].includes((p as any).status?.status ?? ''));
const programCount = allPrograms.length;

const HFBK = 'hochschule-fur-bildende-kunste-hamburg';
const HFBK_BFA = 'hochschule-fur-bildende-kunste-hamburg--fine-arts--bachelor-of-fine-arts';

async function fetchJson(path: string) {
  const res = await app.request(path);
  return { res, body: await res.json() as any };
}

describe('warned records', () => {
  const warned = records.filter((p) => !allPrograms.includes(p));

  it('stay fetchable by id with their status, but are not listed or counted as a school program', async () => {
    expect(warned).toHaveLength(23);
    const { body } = await fetchJson('/v1/programs?limit=200&offset=0');
    const listedIds = new Set<string>();
    for (let offset = 0; offset < body.total; offset += 200) {
      for (const p of (await fetchJson(`/v1/programs?limit=200&offset=${offset}`)).body.items) listedIds.add(p.program_id);
    }
    for (const p of warned) {
      expect(listedIds.has(p.program_id)).toBe(false);
      expect((schoolsJson as any)[p.school_id].program_ids).not.toContain(p.program_id);
      const { res, body: one } = await fetchJson(`/v1/programs/${p.program_id}`);
      expect(res.status).toBe(200);
      expect(['not-matched', 'discontinued']).toContain(one.status.status);
    }
  });
});

describe('GET /v1/programs?subject', () => {
  it("matches a program's primary subject or an officially sourced study focus", async () => {
    const { body } = await fetchJson(`/v1/programs?subject=film-television&school=${HFBK}`);
    // HFBK has no film degree; Film is a sourced focus inside Fine Arts
    expect(body.items.map((p: any) => p.program_id)).toContain(HFBK_BFA);
    for (const p of body.items) expect(p.subjects).toContain('film-television');
    const { body: fine } = await fetchJson(`/v1/programs?subject=fine-art&school=${HFBK}`);
    expect(fine.items.map((p: any) => p.program_id)).toContain(HFBK_BFA);
  });

  it('400s on an unknown subject slug', async () => {
    const { res, body } = await fetchJson('/v1/programs?subject=Fine%20Art');
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('validation_error');
  });

  it('gives every program at least one subject and never an empty-string language', () => {
    for (const p of records) {
      expect(p.subjects.length, p.program_id).toBeGreaterThan(0);
      expect(p.language, p.program_id).not.toBe('');
    }
  });

  it('exposes scoped portfolio / guest deadlines separately from the general window', async () => {
    const withOther = records.find((p) => p.other_deadlines.some((d: any) => d.kind === 'portfolio'))!;
    const { body } = await fetchJson(`/v1/programs/${withOther.program_id}`);
    const d = body.other_deadlines.find((x: any) => x.kind === 'portfolio');
    expect(d.end).toMatchObject({ month: expect.any(Number), day: expect.any(Number) });
    expect(d).toHaveProperty('scope');
  });
});

describe('GET /v1/programs', () => {
  it('returns the paginated envelope with defaults (limit=50, offset=0)', async () => {
    const { res, body } = await fetchJson('/v1/programs');
    expect(res.status).toBe(200);
    expect(body.total).toBe(programCount);
    expect(records.length).toBe(790); // + five DFFB routes and five ifs degrees
    expect(programCount).toBe(767); // what the website lists
    expect(body.limit).toBe(50);
    expect(body.offset).toBe(0);
    expect(body.items).toHaveLength(50);
  });

  it('filters by degree_level', async () => {
    const { body } = await fetchJson('/v1/programs?degree_level=master&limit=200');
    const expected = allPrograms.filter((p) => p.degree_level === 'master').length;
    expect(body.total).toBe(expected);
    for (const p of body.items) expect(p.degree_level).toBe('master');
  });

  it('filters by language as case-insensitive substring', async () => {
    const { body } = await fetchJson('/v1/programs?language=english&limit=200');
    const expected = allPrograms.filter((p) =>
      (p.language ?? '').toLowerCase().includes('english'),
    ).length;
    expect(body.total).toBe(expected);
    expect(body.total).toBeGreaterThan(0);
    for (const p of body.items) expect(p.language!.toLowerCase()).toContain('english');
  });

  it('never matches null/empty language against a language filter', async () => {
    const { body } = await fetchJson('/v1/programs?language=english&limit=200');
    for (const p of body.items) expect(p.language).toBeTruthy();
  });

  it('filters by school (exact school_id)', async () => {
    const { body } = await fetchJson(`/v1/programs?school=${HFBK}`);
    expect(body.total).toBe((schoolsJson as any)[HFBK].program_ids.length);
    for (const p of body.items) expect(p.school_id).toBe(HFBK);
  });

  it('filters by portfolio_required=true', async () => {
    const { body } = await fetchJson('/v1/programs?portfolio_required=true&limit=200');
    const expected = allPrograms.filter((p) => p.portfolio_required === true).length;
    expect(body.total).toBe(expected);
    for (const p of body.items) expect(p.portfolio_required).toBe(true);
  });

  it('filters by portfolio_required=false without matching nulls', async () => {
    const { body } = await fetchJson('/v1/programs?portfolio_required=false&limit=200');
    const expected = allPrograms.filter((p) => p.portfolio_required === false).length;
    expect(body.total).toBe(expected);
    for (const p of body.items) expect(p.portfolio_required).toBe(false);
  });

  it('filters by state via the school', async () => {
    const { body } = await fetchJson('/v1/programs?state=Hamburg&limit=200');
    expect(body.total).toBeGreaterThan(0);
    for (const p of body.items) {
      expect((schoolsJson as any)[p.school_id].state).toBe('Hamburg');
    }
  });

  it('q does keyword search over name + description + specializations', async () => {
    const { body } = await fetchJson('/v1/programs?q=photography&limit=200');
    expect(body.total).toBeGreaterThan(0);
    for (const p of body.items) {
      const text = [p.name, p.description ?? '', ...p.specializations]
        .join(' ')
        .toLowerCase();
      expect(text).toContain('photography');
    }
  });

  it('q requires ALL tokens (AND semantics)', async () => {
    const single = (await fetchJson('/v1/programs?q=photography')).body.total;
    const double = (await fetchJson('/v1/programs?q=photography+sculpture')).body.total;
    expect(double).toBeLessThanOrEqual(single);
  });

  it('combines filters', async () => {
    const { body } = await fetchJson(
      '/v1/programs?degree_level=master&language=english&state=Berlin&limit=200',
    );
    for (const p of body.items) {
      expect(p.degree_level).toBe('master');
      expect(p.language!.toLowerCase()).toContain('english');
      expect((schoolsJson as any)[p.school_id].state).toBe('Berlin');
    }
  });

  describe('pagination', () => {
    it('respects limit and offset and they tile without overlap', async () => {
      const a = (await fetchJson('/v1/programs?limit=10&offset=0')).body;
      const b = (await fetchJson('/v1/programs?limit=10&offset=10')).body;
      expect(a.items).toHaveLength(10);
      expect(b.items).toHaveLength(10);
      const idsA = a.items.map((p: any) => p.program_id);
      const idsB = b.items.map((p: any) => p.program_id);
      expect(idsA.filter((id: string) => idsB.includes(id))).toHaveLength(0);
    });

    it('caps at max limit 200', async () => {
      const { res, body } = await fetchJson('/v1/programs?limit=200');
      expect(res.status).toBe(200);
      expect(body.items).toHaveLength(200);
    });

    it('rejects limit above 200', async () => {
      const { res, body } = await fetchJson('/v1/programs?limit=201');
      expect(res.status).toBe(400);
      expect(body.error.code).toBe('validation_error');
    });

    it('rejects limit 0 and negative offset', async () => {
      expect((await app.request('/v1/programs?limit=0')).status).toBe(400);
      expect((await app.request('/v1/programs?offset=-1')).status).toBe(400);
    });

    it('returns empty items past the end, with correct total', async () => {
      const { res, body } = await fetchJson('/v1/programs?offset=100000');
      expect(res.status).toBe(200);
      expect(body.items).toEqual([]);
      expect(body.total).toBe(programCount);
    });

    it('last page is partial', async () => {
      const offset = programCount - 3;
      const { body } = await fetchJson(`/v1/programs?limit=50&offset=${offset}`);
      expect(body.items).toHaveLength(3);
    });
  });

  describe('validation errors', () => {
    it('rejects an unknown degree_level', async () => {
      const { res, body } = await fetchJson('/v1/programs?degree_level=doctorate');
      expect(res.status).toBe(400);
      expect(body).toEqual({
        error: { code: 'validation_error', message: expect.any(String) },
      });
    });

    it('rejects a non-boolean portfolio_required', async () => {
      const { res } = await fetchJson('/v1/programs?portfolio_required=maybe');
      expect(res.status).toBe(400);
    });

    it('rejects a non-numeric limit', async () => {
      const { res } = await fetchJson('/v1/programs?limit=abc');
      expect(res.status).toBe(400);
    });
  });
});

describe('GET /v1/programs/{id}', () => {
  it('returns the full record incl. deadlines and deadlines_raw', async () => {
    const { res, body } = await fetchJson(`/v1/programs/${HFBK_BFA}`);
    expect(res.status).toBe(200);
    expect(body.program_id).toBe(HFBK_BFA);
    expect(body.school_id).toBe(HFBK);
    expect(body.degree_level).toBe('bachelor');
    expect(body.deadlines.length).toBeGreaterThan(0);
    expect(body.deadlines_raw).toBeDefined();
  });

  it('404s with the standard error shape for an unknown id', async () => {
    const { res, body } = await fetchJson('/v1/programs/not-a-program');
    expect(res.status).toBe(404);
    expect(body).toEqual({
      error: { code: 'not_found', message: expect.stringContaining('not-a-program') },
    });
  });
});
