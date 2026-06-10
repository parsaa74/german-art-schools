import { describe, expect, it } from 'vitest';
import app from '../src/index';
import schoolsJson from '../data/schools.json';

const schoolCount = Object.keys(schoolsJson).length;
const HFBK = 'hochschule-fur-bildende-kunste-hamburg';

describe('GET /v1/schools', () => {
  it('returns all schools without filters', async () => {
    const res = await app.request('/v1/schools');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(schoolCount);
    expect(schoolCount).toBe(82);
  });

  it('filters by state (case-insensitive exact)', async () => {
    const res = await app.request('/v1/schools?state=hamburg');
    const body = await res.json() as any;
    expect(body.length).toBeGreaterThan(0);
    for (const s of body) expect(s.state).toBe('Hamburg');
    expect(body.map((s: { id: string }) => s.id)).toContain(HFBK);
  });

  it('filters by city', async () => {
    const res = await app.request('/v1/schools?city=Berlin');
    const body = await res.json() as any;
    expect(body.length).toBeGreaterThan(0);
    for (const s of body) expect(s.city).toBe('Berlin');
  });

  it('filters by type (case-insensitive)', async () => {
    const res = await app.request('/v1/schools?type=KUNSTHOCHSCHULE');
    const body = await res.json() as any;
    expect(body.length).toBeGreaterThan(0);
    for (const s of body) expect(s.type).toBe('kunsthochschule');
  });

  it('combines filters (AND)', async () => {
    const res = await app.request('/v1/schools?state=Hamburg&type=kunsthochschule');
    const body = await res.json() as any;
    expect(body.length).toBeGreaterThan(0);
    for (const s of body) {
      expect(s.state).toBe('Hamburg');
      expect(s.type).toBe('kunsthochschule');
    }
  });

  it('returns an empty array for a non-matching filter', async () => {
    const res = await app.request('/v1/schools?state=Atlantis');
    expect(res.status).toBe(200);
    expect(await res.json() as any).toEqual([]);
  });
});

describe('GET /v1/schools/{id}', () => {
  it('returns a known school with its programs', async () => {
    const res = await app.request(`/v1/schools/${HFBK}`);
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.id).toBe(HFBK);
    expect(body.name).toBe('Hochschule für bildende Künste Hamburg');
    expect(body.state).toBe('Hamburg');
    expect(body.program_ids.length).toBeGreaterThan(0);
  });

  it('404s with the standard error shape for an unknown id', async () => {
    const res = await app.request('/v1/schools/not-a-school');
    expect(res.status).toBe(404);
    expect(await res.json() as any).toEqual({
      error: { code: 'not_found', message: expect.stringContaining('not-a-school') },
    });
  });
});
