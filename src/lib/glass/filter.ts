/**
 * Shared school-filter predicate.
 *
 * One source of truth for "does this school survive the current filters",
 * used by the GlassWall (which panes break), the 2D graph, the FilterWizard
 * and the filter panel (live counts).
 *
 * School-level filters (state, type, application route) test the school.
 * Program-level filters (subject, degree, language, semester, NC-free) must all hold
 * for the SAME program — "English + Master" means an English-taught master,
 * not an English bachelor next to a German master. Missing data never passes
 * an active filter.
 */

import { ProcessedUniversity } from '@/stores/schoolStore';
import { fold, subjectGroupOf, degreeGroupOf, taughtIn, admissionOf, programSearchMatch } from '@/lib/taxonomy';

export interface Filters {
  search: string;
  state: string | null;
  program: string | null;   // subject group (SUBJECT_GROUPS)
  type: string | null;
  semester: string | null;  // 'winter' | 'summer'
  nc: boolean | null;       // true = NC-free: admission by portfolio/aptitude test or open (taxonomy.admissionOf)
  method: 'uni-assist' | 'direct' | null;
  language: string | null;  // 'German' | 'English'
  degree: string | null;    // degree group (DEGREE_GROUPS)
  timeline: [number, number] | null;
}

type Program = NonNullable<ProcessedUniversity['programs']>[number];

function programPasses(p: Program, f: Filters, schoolType: string): boolean {
  if (p.status?.status === 'not-matched' || p.status?.status === 'discontinued') return false;
  if (f.program && subjectGroupOf(p.name) !== f.program) return false;
  if (f.nc && !admissionOf(p as any, schoolType)) return false;
  if (f.degree && degreeGroupOf(p.degree) !== f.degree) return false;
  if (f.language && !taughtIn(p.language, f.language)) return false;
  if (f.semester && !p.intakes?.some((s) => s === f.semester) && !(p.applicationDeadlines as any)?.[f.semester] && !p.otherDeadlines?.some((d) => d.kind === 'application' && d.semester === f.semester)) return false;
  return true;
}

const hasProgramFilter = (f: Filters) => !!(f.program || f.degree || f.language || f.semester || f.nc);

/** Programs of `uni` that satisfy every program-level filter. */
export function matchingPrograms(uni: ProcessedUniversity, f: Filters): Program[] {
  return (uni.programs ?? []).filter((p) => programPasses(p, f, uni.type));
}

export function passesFilters(uni: ProcessedUniversity, f: Filters): boolean {
  if (f.search && f.search.trim()) {
    const q = fold(f.search.trim());
    // A generic school description must not satisfy a specific programme search
    // when degree/language/etc. filters are active (e.g. a nonexistent MSc).
    const hay = fold([uni.name, uni.state, uni.city || '', hasProgramFilter(f) ? '' : uni.description || ''].join(' '));
    if (!hay.includes(q) && !(uni.programs ?? []).some((p) => programPasses(p, f, uni.type) && programSearchMatch(p, f.search).score > 0)) return false;
  }
  if (f.state && uni.state !== f.state) return false;
  if (f.type && uni.type !== f.type) return false;
  if (f.method != null && uni.applicationMethod !== f.method) return false;
  if (f.timeline) {
    const y = uni.founded ? parseInt(uni.founded) : NaN;
    if (isNaN(y) || y < f.timeline[0] || y > f.timeline[1]) return false;
  }
  if (hasProgramFilter(f) && !(uni.programs ?? []).some((p) => programPasses(p, f, uni.type))) return false;
  return true;
}

/** Pull the current filters out of a school-store snapshot. */
export function filtersFromState(s: {
  searchQuery: string;
  activeStateFilter: string | null;
  activeProgramFilter: string | null;
  activeTypeFilter: string | null;
  activeSemesterFilter: string | null;
  activeNcFilter: boolean | null;
  activeApplicationMethodFilter: 'uni-assist' | 'direct' | null;
  activeCourseLanguageFilter: string | null;
  activeDegreeFilter: string | null;
  timelineFilter: [number, number] | null;
}): Filters {
  return {
    search: s.searchQuery,
    state: s.activeStateFilter,
    program: s.activeProgramFilter,
    type: s.activeTypeFilter,
    semester: s.activeSemesterFilter,
    nc: s.activeNcFilter,
    method: s.activeApplicationMethodFilter,
    language: s.activeCourseLanguageFilter,
    degree: s.activeDegreeFilter,
    timeline: s.timelineFilter,
  };
}

export function countMatches(unis: ProcessedUniversity[], f: Filters): number {
  let n = 0;
  for (const u of unis) if (passesFilters(u, f)) n++;
  return n;
}

/** How many schools would remain if `key` were set to each value (other filters kept). */
export function optionCounts<K extends keyof Filters>(
  unis: ProcessedUniversity[],
  f: Filters,
  key: K,
  values: readonly Filters[K][]
): Map<Filters[K], number> {
  return new Map(values.map((v) => [v, countMatches(unis, { ...f, [key]: v })]));
}
