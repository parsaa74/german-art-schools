import { describe, expect, it } from 'vitest';
import app from '../src/index';
import { getProgram, listPrograms, similarPrograms } from '../src/services';

const SCHOOL = 'hochschule-fur-bildende-kunste-hamburg';
const BFA = `${SCHOOL}--fine-arts--bachelor-of-fine-arts`;
const MFA = `${SCHOOL}--fine-arts--master-of-fine-arts`;
const LEGACY = `${SCHOOL}--film--unspecified`;
const FILM = 'https://hfbk-hamburg.de/de/studium/studienschwerpunkte/film';

describe('HFBK Film focus and applicant information', () => {
  it('finds Film inside the real Fine Arts BFA/MFA without fabricating film degrees', () => {
    expect(listPrograms({ school: SCHOOL, q: 'Film', degree_level: 'master' }).items.map(p => p.program_id)).toEqual([MFA]);
    expect(listPrograms({ school: SCHOOL, q: 'Autorenfilm', degree_level: 'bachelor' }).items.map(p => p.program_id)).toEqual([BFA]);
    for (const id of [BFA, MFA]) {
      const p = getProgram(id)!;
      expect(p.name).toBe('Fine Arts');
      expect(p.teaching_areas?.find(a => a.name === 'Film')).toEqual({ name: 'Film', kind: 'study focus (not a separate degree)', source: FILM });
      expect(p.application_methods).toEqual(['direct']);
      expect(p.application_route?.notes).toContain('5 March 2027 at 16:00');
      expect(p.deadlines[0].end).toEqual({ month: 3, day: 5, year: 2027 });
    }
  });

  it('exposes only sourced film-department faculty, not every scraper roster', async () => {
    const response = await app.request(`/v1/programs/${MFA}`);
    expect(response.status).toBe(200);
    const p = await response.json() as any;
    expect(p.faculty.map((f: any) => f.name)).toEqual(['Robert Bramkamp', 'Omer Fast', 'Adina Pintilie', 'Angela Schanelec', 'Dane Komljen']);
    expect(p.faculty.every((f: any) => f.source === FILM && f.title.startsWith('Film department'))).toBe(true);
    const other = getProgram('ifs-internationale-filmschule-koln--film--bachelor-of-arts')!;
    expect(other.faculty).toEqual([]);
  });

  it('retains applicant-specific film work and lower-ECTS master possibilities', () => {
    expect(getProgram(BFA)!.requirements?.some(r => r.text.includes('complete films rather than trailers'))).toBe(true);
    expect(getProgram(MFA)!.requirements?.some(r => r.text.includes('three-to-five-page'))).toBe(true);
    expect(getProgram(MFA)!.requirements?.some(r => r.text.includes('180-ECTS') && r.text.includes('not automatic'))).toBe(true);
    expect(getProgram(MFA)!.joint_with).toEqual([]);
    expect(getProgram(MFA)!.description).toContain('a separate programme');
  });

  it('does not confuse no tuition with no semester costs, or copy it to HMS', () => {
    for (const id of [BFA, MFA]) {
      const p = getProgram(id)!;
      expect(p.tuition_eur_per_semester).toBe(0);
      expect(p.fees?.find(f => f.kind === 'semester-contribution')?.euros).toBeNull();
      expect(p.fees?.find(f => f.kind === 'tuition')?.appliesTo).toContain('HMS cooperative master not covered');
    }
  });

  it('retains the generic Film ID with a warning and no false degree alternatives', () => {
    expect(getProgram(LEGACY)!.status?.status).toBe('not-matched');
    expect(similarPrograms(LEGACY)!.similar).toEqual([]);
  });

  it('returns the sourced faculty through MCP as well as REST', async () => {
    const r = await app.request('/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_program', arguments: { program_id: MFA } } }),
    });
    expect(r.status).toBe(200);
    const b = await r.json() as any;
    expect(b.result.isError).not.toBe(true);
    expect(JSON.parse(b.result.content[0].text).faculty).toHaveLength(5);
  });
});
