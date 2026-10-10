import { describe, expect, it } from 'vitest';
import app from '../src/index';
import { getProgram, similarPrograms } from '../src/services';
import { ProgramSchema } from '../src/schemas';
import programsJson from '../data/programs.json';
import vectorsMeta from '../data/vectors.meta.json';

const UDK_DC = 'universitat-der-kunste-berlin--design-and-computation--master-of-arts';
const TU_DC = 'technische-universitat-berlin--design-and-computation--master-of-science';
const HFK_MASTER = 'hochschule-fur-kunste-bremen--digitale-medien--master-of-arts';
const UNI_MASTER = 'universitat-bremen--digitale-medien--master-of-arts';
const HDA_EXPANDED = 'hochschule-darmstadt--expanded-media--master-of-arts';
const HDA_OLD = 'hochschule-darmstadt--digital-media--master-of-science';
const UDK_VK = 'universitat-der-kunste-berlin--visual-communication--unspecified';

async function query(q: string) {
  return await (await app.request(`/v1/programs?q=${encodeURIComponent(q)}&limit=200`)).json() as any;
}

describe('official catalogue follow-up', () => {
  it('exports joint partners and distinct Bremen master awards without changing IDs', () => {
    const hfk = getProgram(HFK_MASTER)!;
    const uni = getProgram(UNI_MASTER)!;
    expect(hfk.degree).toBe('Master of Arts');
    expect(uni.degree).toBe('Master of Science');
    expect(uni.joint_profile).toContain('Informatics');
    expect(hfk.joint_with).toContain(uni.school_id);
    expect(uni.joint_with).toContain(hfk.school_id);
    expect(hfk.joint_program_id).toBe(uni.joint_program_id);
  });

  it('does not suggest another listing of the same joint programme as an independent alternative', () => {
    for (const [a, b] of [[UDK_DC, TU_DC], [HFK_MASTER, UNI_MASTER]]) {
      expect(similarPrograms(a)!.similar.map((s) => s.program.program_id)).not.toContain(b);
      expect(similarPrograms(b)!.similar.map((s) => s.program.program_id)).not.toContain(a);
    }
  });

  it('exports the passed D&C window with its exact published year', () => {
    expect(getProgram(UDK_DC)!.language).toBe('German');
    expect(getProgram(UDK_DC)!.deadlines).toEqual([
      { semester: 'winter', start: { month: 4, day: 1, year: 2026 }, end: { month: 5, day: 15, year: 2026 } },
    ]);
  });

  it('class-name searches return actual parent degrees with teaching-area metadata', async () => {
    const udk = await query('Digitale Klasse');
    expect(udk.items.map((p: any) => p.program_id)).toContain(UDK_VK);
    for (const p of udk.items) {
      expect(p.name).toBe('Visual Communication');
      expect(p.teaching_areas[0].kind).toBe('class');
    }
    const khm = await query('Experimentelle Informatik');
    expect(khm.items.some((p: any) => p.school_id === 'kunsthochschule-fur-medien-koln' && p.degree === 'Diploma')).toBe(true);
  });

  it('keeps the unverified h_da MSc visible as a warned record without fake application dates or alternatives', () => {
    const p = getProgram(HDA_OLD)!;
    expect(p.status?.status).toBe('not-matched');
    expect(p.deadlines).toEqual([]);
    expect(similarPrograms(HDA_OLD)!.similar).toEqual([]);
  });

  it('exports Expanded Media and its real study tracks, not a new Expanded Realities MA', () => {
    const p = getProgram(HDA_EXPANDED)!;
    expect(p.degree).toBe('Master of Arts');
    expect(p.specializations).toContain('Expanded Realities');
    expect(p.intakes).toEqual(['winter', 'summer']);
    expect(p.deadlines).toEqual([]); // different applicant scopes, not a universal window
  });

  it('recognises the official former Interactive Media Design name', async () => {
    const body = await query('Interactive Media Design');
    expect(body.items.some((p: any) => p.school_id === 'hochschule-darmstadt' && p.name === 'User Experience Design')).toBe(true);
  });

  it('documents the one exact vector reuse and leaves unrelated new programmes unembedded', () => {
    expect(vectorsMeta.reused_embeddings[UDK_DC].sourceProgramId).toBe(TU_DC);
    expect(vectorsMeta.ids).not.toContain(HDA_EXPANDED);
  });

  it('every exported program satisfies the additive response schema', () => {
    for (const p of Object.values(programsJson)) expect(ProgramSchema.safeParse(p).success, p.program_id).toBe(true);
  });
});
