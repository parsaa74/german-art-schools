import { describe, expect, it } from 'vitest';
import app from '../src/index';
import { windowContains } from '../src/services';

// Real fixtures from api/data/programs.json:
// - HFBK_BFA has a plain winter window 03-01 .. 04-15
// - KHM_DIPLOMA has a wrap-around winter window 12-01 .. 01-15
// - DRESDEN_DIPLOMA has a single window with start=null, end=03-15
const HFBK_BFA = 'hochschule-fur-bildende-kunste-hamburg--fine-arts--bachelor-of-fine-arts';
const KHM_DIPLOMA = 'kunsthochschule-fur-medien-koln--media-arts--diploma';
const DRESDEN_DIPLOMA = 'hfbk-dresden--fine-arts--diploma';

async function idsOpenOn(date: string): Promise<string[]> {
  const res = await app.request(`/v1/programs?open_on=${date}&limit=200&offset=0`);
  expect(res.status).toBe(200);
  const body = await res.json() as any;
  // collect across pages
  const ids: string[] = body.items.map((p: any) => p.program_id);
  for (let offset = 200; offset < body.total; offset += 200) {
    const page = await (await app.request(`/v1/programs?open_on=${date}&limit=200&offset=${offset}`)).json() as any;
    ids.push(...page.items.map((p: any) => p.program_id));
  }
  return ids;
}

describe('open_on filter', () => {
  it('matches a date inside a plain window', async () => {
    expect(await idsOpenOn('2026-03-15')).toContain(HFBK_BFA);
  });

  it('does not match a date outside the window', async () => {
    expect(await idsOpenOn('2026-07-04')).not.toContain(HFBK_BFA);
  });

  it('boundary days are inclusive (start and end)', async () => {
    expect(await idsOpenOn('2026-03-01')).toContain(HFBK_BFA);
    expect(await idsOpenOn('2026-04-15')).toContain(HFBK_BFA);
    expect(await idsOpenOn('2026-04-16')).not.toContain(HFBK_BFA);
    expect(await idsOpenOn('2026-02-28')).not.toContain(HFBK_BFA);
  });

  it('handles wrap-around windows (Dec 1 -> Jan 15)', async () => {
    expect(await idsOpenOn('2026-12-24')).toContain(KHM_DIPLOMA); // after start, pre-wrap
    expect(await idsOpenOn('2026-01-02')).toContain(KHM_DIPLOMA); // post-wrap
    expect(await idsOpenOn('2026-12-01')).toContain(KHM_DIPLOMA); // start boundary
    expect(await idsOpenOn('2026-01-15')).toContain(KHM_DIPLOMA); // end boundary
    expect(await idsOpenOn('2026-06-15')).not.toContain(KHM_DIPLOMA); // middle of the gap
    expect(await idsOpenOn('2026-01-16')).not.toContain(KHM_DIPLOMA); // just past end
    expect(await idsOpenOn('2026-11-30')).not.toContain(KHM_DIPLOMA); // just before start
  });

  it('null-start windows are never matched, even on their end date', async () => {
    expect(await idsOpenOn('2026-03-15')).not.toContain(DRESDEN_DIPLOMA);
    expect(await idsOpenOn('2026-03-01')).not.toContain(DRESDEN_DIPLOMA);
  });

  it('the year component is ignored (windows are year-agnostic)', async () => {
    const a = await idsOpenOn('2024-03-15');
    const b = await idsOpenOn('2031-03-15');
    expect(a).toEqual(b);
  });

  it('rejects malformed and impossible dates', async () => {
    for (const bad of ['junk', '2026-3-1', '2026-13-01', '2026-02-30', '2026-00-10']) {
      const res = await app.request(`/v1/programs?open_on=${bad}`);
      expect(res.status, `open_on=${bad}`).toBe(400);
      const body = await res.json() as any;
      expect(body.error.code).toBe('validation_error');
    }
  });

  it('accepts Feb 29 (leap-day deadlines are representable)', async () => {
    const res = await app.request('/v1/programs?open_on=2028-02-29');
    expect(res.status).toBe(200);
  });

  it('combines with other filters', async () => {
    const res = await app.request('/v1/programs?open_on=2026-03-15&degree_level=bachelor&limit=200');
    const body = await res.json() as any;
    for (const p of body.items) expect(p.degree_level).toBe('bachelor');
    expect(body.items.map((p: any) => p.program_id)).toContain(HFBK_BFA);
  });
});

describe('windowContains (unit)', () => {
  const md = (month: number, day: number) => ({ month, day });

  it('plain window, inclusive boundaries', () => {
    const w = { semester: 'winter', start: md(3, 1), end: md(4, 15) };
    expect(windowContains(w, md(3, 1))).toBe(true);
    expect(windowContains(w, md(4, 15))).toBe(true);
    expect(windowContains(w, md(3, 20))).toBe(true);
    expect(windowContains(w, md(2, 28))).toBe(false);
    expect(windowContains(w, md(4, 16))).toBe(false);
  });

  it('wrap-around window', () => {
    const w = { semester: 'winter', start: md(11, 1), end: md(1, 15) };
    expect(windowContains(w, md(12, 25))).toBe(true);
    expect(windowContains(w, md(1, 1))).toBe(true);
    expect(windowContains(w, md(11, 1))).toBe(true);
    expect(windowContains(w, md(1, 15))).toBe(true);
    expect(windowContains(w, md(6, 1))).toBe(false);
    expect(windowContains(w, md(10, 31))).toBe(false);
    expect(windowContains(w, md(1, 16))).toBe(false);
  });

  it('null start or end never matches', () => {
    expect(windowContains({ semester: 'w', start: null, end: md(3, 15) }, md(3, 15))).toBe(false);
    expect(windowContains({ semester: 'w', start: md(3, 1), end: null }, md(3, 1))).toBe(false);
    expect(windowContains({ semester: 'w', start: null, end: null }, md(3, 1))).toBe(false);
  });
});
