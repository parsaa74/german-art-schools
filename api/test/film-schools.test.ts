import { describe, expect, it } from 'vitest';
import app from '../src/index';
import { getProgram, similarPrograms } from '../src/services';
import vectorsMeta from '../data/vectors.meta.json';
import programsJson from '../data/programs.json';

const DFFB = 'deutsche-film-und-fernsehakademie-berlin';
const IFS = 'ifs-internationale-filmschule-koln';
const FILM = `${IFS}--film--bachelor-of-arts`;
const SERIAL = `${IFS}--serial-storytelling--master-of-arts`;
const THREE_D = `${IFS}--3d-animation-for-film-games--master-of-arts`;
const DIGITAL = `${IFS}--digital-narratives--master-of-arts`;
const ENTERTAINMENT = `${IFS}--entertainment-producing--master-of-arts`;
const newPrograms = Object.values(programsJson).filter((p) => [DFFB, IFS].includes(p.school_id));

async function json(path: string) {
  const res = await app.request(path);
  expect(res.status).toBe(200);
  return await res.json() as any;
}

async function mcp(name: string, args: Record<string, unknown>) {
  const res = await app.request('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }),
  });
  expect(res.status).toBe(200);
  const body = await res.json() as any;
  expect(body.error).toBeUndefined();
  expect(body.result.isError).not.toBe(true);
  return JSON.parse(body.result.content[0].text);
}

describe('official DFFB and ifs additions', () => {
  it('makes both schools and five records each available without invented statistics', async () => {
    for (const [id, founded] of [[DFFB, 1966], [IFS, 2000]] as const) {
      const school = await json(`/v1/schools/${id}`);
      expect(school.program_ids).toHaveLength(5);
      expect(school.stats.founded).toBe(founded);
      expect(school.stats.students).toBeNull();
      expect(school.stats.student_staff_ratio).toBeNull();
    }
  });

  it('does not classify DFFB’s institutional diplomas as academic degrees', async () => {
    const body = await json(`/v1/programs?school=${DFFB}`);
    expect(body.total).toBe(5);
    for (const p of body.items) {
      expect(p.degree).toBe('DFFB diploma (non-state qualification)');
      expect(p.degree_level).toBe('other');
      expect(p.application_methods).toEqual(['direct']);
    }
    expect((await json(`/v1/programs?school=${DFFB}&degree_level=diploma`)).total).toBe(0);
  });

  it('exports DFFB’s mandatory registration as the earlier application cutoff', async () => {
    const body = await json(`/v1/programs?school=${DFFB}&open_on=2026-11-20`);
    expect(body.total).toBe(5);
    for (const p of body.items) {
      expect(p.deadlines[0]).toEqual({
        semester: 'winter', start: { month: 9, day: 23, year: 2026 }, end: { month: 11, day: 24, year: 2026 },
      });
      expect(p.application_route.notes).toContain('8 December 2026');
      expect(p.application_route.notes).toContain('18:00');
    }
    expect((await json(`/v1/programs?school=${DFFB}&open_on=2026-12-01`)).total).toBe(0);
    expect((await json(`/v1/programs?school=${DFFB}&open_on=2027-11-20`)).total).toBe(0);
  });

  it('exposes DFFB annual enrolment/equipment and semester ticket costs without fabricating tuition', () => {
    for (const p of newPrograms.filter((p) => p.school_id === DFFB)) {
      expect(p.fees.map((f) => [f.kind, f.euros, f.period])).toEqual([
        ['enrolment-equipment', 225, 'year'], ['semester-ticket', null, 'semester'],
      ]);
      expect(p.fees[1].notes).toContain('€226.80');
      expect(p.fees[1].notes).toContain('€208.80');
      expect(p.fees[1].appliesTo).toContain('need confirmation');
      expect(p.tuition_eur_per_semester).toBeNull();
    }
  });

  it('keeps ifs Film’s seven specialisations inside its one Bachelor degree', () => {
    const film = getProgram(FILM)!;
    expect(film.degree_level).toBe('bachelor');
    expect(film.duration).toBe('7 semesters');
    expect(film.language).toBe('German');
    expect(film.specializations).toHaveLength(7);
    expect(film.teaching_areas).toHaveLength(7);
    expect(newPrograms.filter((p) => p.school_id === IFS && p.degree_level === 'bachelor')).toHaveLength(1);
  });

  it('returns the parent BA when searching a specialisation', async () => {
    const body = await json(`/v1/programs?school=${IFS}&q=Production%20Design`);
    expect(body.items.map((p: any) => p.program_id)).toEqual([FILM]);
  });

  it('keeps dated biennial ifs windows, never inferred annual ones', async () => {
    expect(getProgram(FILM)!.deadlines[0].end).toEqual({ month: 3, day: 8, year: 2027 });
    expect(getProgram(SERIAL)!.deadlines[0].end).toEqual({ month: 1, day: 13, year: 2027 });
    for (const id of [THREE_D, DIGITAL, ENTERTAINMENT]) expect(getProgram(id)!.deadlines).toEqual([]);
    expect((await json(`/v1/programs?school=${IFS}&open_on=2028-01-05`)).total).toBe(0);
  });

  it('exports citizenship-specific MA tuition instead of one misleading scalar', () => {
    for (const [id, amounts] of [[SERIAL, [2750, 3750]], [DIGITAL, [2750, 3750]], [ENTERTAINMENT, [2750, 3750]], [THREE_D, [1500, 2500]]] as const) {
      const p = getProgram(id)!;
      expect(p.tuition_eur_per_semester).toBeNull();
      expect(p.fees!.filter((f) => f.kind === 'tuition').map((f) => f.euros)).toEqual(amounts);
      expect(p.fees!.filter((f) => f.kind === 'tuition').map((f) => f.appliesTo)).toEqual(['EU citizens', 'non-EU citizens']);
      expect(p.fees!.find((f) => f.kind === 'semester-contribution')!.approximate).toBe(true);
      expect(p.sources!.fees).toMatch(/^https:\/\/www\.filmschule\.de\//);
    }
  });

  it('retains the 3D programme’s foreign-degree uni-assist validation requirement', () => {
    const p = getProgram(THREE_D)!;
    expect(p.application_methods).toEqual(['uni-assist']);
    expect(p.application_route!.method).toBe('mixed');
    expect(p.application_route!.scope).toContain('non-German first degrees');
    expect(p.application_route!.notes).toContain('Cologne Game Lab');
    expect(p.application_route!.notes).toContain('uni-assist');
    expect(getProgram(FILM)!.application_methods).toEqual(['direct']);
  });

  it('does not turn exceptional non-degree training participants into another MA route', () => {
    for (const id of [SERIAL, DIGITAL, ENTERTAINMENT]) {
      expect(getProgram(id)!.requirements!.some((r) => r.label === 'non-degree-exception' && r.text.includes('not a separate M.A.'))).toBe(true);
    }
  });

  it('leaves every new programme unembedded rather than fabricating alternatives', () => {
    expect(newPrograms).toHaveLength(10);
    for (const p of newPrograms) {
      expect(vectorsMeta.ids).not.toContain(p.program_id);
      expect(similarPrograms(p.program_id)!.similar).toEqual([]);
      expect(p.researched).toBe('2026-10-11');
    }
  });

  it('serves the new school and scoped programme data through MCP too', async () => {
    const school = await mcp('get_school', { school_id: DFFB });
    expect(school.program_ids).toHaveLength(5);
    const program = await mcp('get_program', { program_id: THREE_D });
    expect(program.application_methods).toEqual(['uni-assist']);
    expect(program.fees.filter((f: any) => f.kind === 'tuition').map((f: any) => f.euros)).toEqual([1500, 2500]);
  });
});
