import { describe, expect, it } from 'vitest';
import app from '../src/index';
import graphJson from '../data/graph.json';

const HFBK_BFA = 'hochschule-fur-bildende-kunste-hamburg--fine-arts--bachelor-of-fine-arts';
const SUMMARY_KEYS = ['program_id', 'name', 'degree', 'degree_level', 'school_id', 'school_name'];

describe('GET /v1/programs/{id}/similar', () => {
  it('returns neighbors as program summaries with weights, sorted desc', async () => {
    const res = await app.request(`/v1/programs/${HFBK_BFA}/similar`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.program_id).toBe(HFBK_BFA);
    expect(body.similar.length).toBeGreaterThan(0);
    expect(body.similar.length).toBeLessThanOrEqual(10); // default limit
    for (const entry of body.similar) {
      expect(Object.keys(entry).sort()).toEqual(['program', 'weight']);
      expect(Object.keys(entry.program).sort()).toEqual([...SUMMARY_KEYS].sort());
      expect(typeof entry.weight).toBe('number');
    }
    const weights = body.similar.map((s: any) => s.weight);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  });

  it('matches the adjacency in graph.json', async () => {
    const res = await app.request(`/v1/programs/${HFBK_BFA}/similar?limit=3`);
    const body = await res.json() as any;
    const expected = (graphJson as any)[HFBK_BFA].slice(0, 3);
    expect(body.similar.map((s: any) => s.program.program_id)).toEqual(
      expected.map((n: any) => n.id),
    );
    expect(body.similar.map((s: any) => s.weight)).toEqual(
      expected.map((n: any) => n.weight),
    );
  });

  it('respects limit', async () => {
    const res = await app.request(`/v1/programs/${HFBK_BFA}/similar?limit=2`);
    const body = await res.json() as any;
    expect(body.similar).toHaveLength(2);
  });

  it('respects min_weight', async () => {
    const res = await app.request(`/v1/programs/${HFBK_BFA}/similar?min_weight=0.95&limit=200`);
    const body = await res.json() as any;
    expect(body.similar.length).toBeGreaterThan(0);
    for (const s of body.similar) expect(s.weight).toBeGreaterThanOrEqual(0.95);
    const all = (graphJson as any)[HFBK_BFA].filter((n: any) => n.weight >= 0.95);
    expect(body.similar).toHaveLength(all.length);
  });

  it('min_weight=1 yields an empty list (200, not 404)', async () => {
    const res = await app.request(`/v1/programs/${HFBK_BFA}/similar?min_weight=1`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.similar).toEqual([]);
  });

  it('404s for an unknown program id', async () => {
    const res = await app.request('/v1/programs/not-a-program/similar');
    expect(res.status).toBe(404);
    expect(await res.json() as any).toEqual({
      error: { code: 'not_found', message: expect.any(String) },
    });
  });

  it('rejects invalid query params', async () => {
    expect((await app.request(`/v1/programs/${HFBK_BFA}/similar?limit=0`)).status).toBe(400);
    expect((await app.request(`/v1/programs/${HFBK_BFA}/similar?min_weight=2`)).status).toBe(400);
    expect((await app.request(`/v1/programs/${HFBK_BFA}/similar?min_weight=abc`)).status).toBe(400);
  });
});
