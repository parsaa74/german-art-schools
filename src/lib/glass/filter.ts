/**
 * Shared school-filter predicate.
 *
 * One source of truth for "does this school survive the current filters",
 * used by both the GlassWall (which panes break) and the FilterWizard (live
 * remaining count).
 */

import { ProcessedUniversity } from '@/stores/schoolStore';

export interface Filters {
  search: string;
  state: string | null;
  program: string | null;
  type: string | null;
  semester: string | null;
  nc: boolean | null;
  method: 'uni-assist' | 'direct' | null;
  language: string | null;
  degree: string | null;
  timeline: [number, number] | null;
}

export function passesFilters(uni: ProcessedUniversity, f: Filters): boolean {
  if (f.search && f.search.trim()) {
    const q = f.search.toLowerCase();
    const hay = [uni.name, uni.state, uni.city || '', uni.description || '', ...(uni.programTypes || [])]
      .join(' ').toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (f.state && uni.state !== f.state) return false;
  if (f.program && !uni.programTypes.includes(f.program)) return false;
  if (f.type && uni.type !== f.type) return false;
  const progs = (uni as any).programs || [];
  if (f.semester && !progs.some((p: any) => p.applicationDeadlines && p.applicationDeadlines[f.semester!])) return false;
  if (f.nc != null && (uni as any).ncFrei !== undefined && (uni as any).ncFrei !== f.nc) return false;
  if (f.method != null && (uni as any).applicationMethod !== undefined && (uni as any).applicationMethod !== f.method) return false;
  if (f.language != null && !progs.some((p: any) => p.language === f.language)) return false;
  if (f.degree != null && !progs.some((p: any) => p.degree === f.degree)) return false;
  if (f.timeline) {
    const y = uni.founded ? parseInt(uni.founded) : NaN;
    if (isNaN(y) || y < f.timeline[0] || y > f.timeline[1]) return false;
  }
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
