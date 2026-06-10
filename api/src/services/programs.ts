/**
 * Pure program services. No Hono imports — the MCP server calls these directly.
 */
import { graph, programs, schools } from '../data';
import type {
  DeadlineWindow,
  DegreeLevel,
  Paginated,
  Program,
  ProgramSummary,
} from '../types';

export interface MonthDay {
  month: number;
  day: number;
}

export interface ProgramFilters {
  /** Exact match on degree_level. */
  degree_level?: DegreeLevel;
  /**
   * Case-insensitive substring match, because stored values look like
   * "German", "German/English", "German/French/English". Programs with a
   * null/empty language never match a language filter.
   */
  language?: string;
  /** Exact school_id match. */
  school?: string;
  portfolio_required?: boolean;
  /** Case-insensitive exact match on the school's state (resolved via school_id). */
  state?: string;
  /**
   * Case-insensitive keyword search over name + description + specializations.
   * The query is split on whitespace; every token must appear somewhere in
   * the combined text (AND semantics).
   */
  q?: string;
  /**
   * Year-agnostic month/day point. A program matches when ANY of its deadline
   * windows contains it. Windows where start > end wrap around the year
   * boundary (e.g. Nov 1 -> Jan 15 contains Dec 24 and Jan 2). Deadline
   * entries with a null start (or null end) are NOT matchable by open_on —
   * an open-ended window has no well-defined containment. Boundary days are
   * inclusive on both ends.
   */
  open_on?: MonthDay;
}

export interface Pagination {
  limit: number;
  offset: number;
}

/** Inclusive containment check on a year-agnostic month/day window. */
export function windowContains(w: DeadlineWindow, d: MonthDay): boolean {
  if (w.start === null || w.end === null) return false;
  const s = w.start.month * 100 + w.start.day;
  const e = w.end.month * 100 + w.end.day;
  const x = d.month * 100 + d.day;
  // start <= end: plain window. start > end: wraps the year boundary.
  return s <= e ? x >= s && x <= e : x >= s || x <= e;
}

function programText(p: Program): string {
  return [p.name, p.description ?? '', ...p.specializations].join(' ').toLowerCase();
}

export function listPrograms(
  filters: ProgramFilters = {},
  pagination: Pagination = { limit: 50, offset: 0 },
): Paginated<Program> {
  let result = Object.values(programs);

  if (filters.degree_level !== undefined) {
    result = result.filter((p) => p.degree_level === filters.degree_level);
  }
  if (filters.language !== undefined) {
    const needle = filters.language.toLowerCase();
    result = result.filter((p) => (p.language ?? '').toLowerCase().includes(needle));
  }
  if (filters.school !== undefined) {
    result = result.filter((p) => p.school_id === filters.school);
  }
  if (filters.portfolio_required !== undefined) {
    result = result.filter((p) => p.portfolio_required === filters.portfolio_required);
  }
  if (filters.state !== undefined) {
    const state = filters.state.toLowerCase();
    result = result.filter(
      (p) => schools[p.school_id]?.state.toLowerCase() === state,
    );
  }
  if (filters.q !== undefined) {
    const tokens = filters.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      result = result.filter((p) => {
        const text = programText(p);
        return tokens.every((t) => text.includes(t));
      });
    }
  }
  if (filters.open_on !== undefined) {
    const d = filters.open_on;
    result = result.filter((p) => p.deadlines.some((w) => windowContains(w, d)));
  }

  const { limit, offset } = pagination;
  return {
    total: result.length,
    limit,
    offset,
    items: result.slice(offset, offset + limit),
  };
}

export function getProgram(id: string): Program | null {
  return programs[id] ?? null;
}

export function toProgramSummary(p: Program): ProgramSummary {
  return {
    program_id: p.program_id,
    name: p.name,
    degree: p.degree,
    degree_level: p.degree_level,
    school_id: p.school_id,
    school_name: p.school_name,
  };
}

export interface SimilarOptions {
  minWeight?: number;
  limit?: number;
}

export interface SimilarResult {
  program_id: string;
  similar: Array<{ program: ProgramSummary; weight: number }>;
}

/** Returns null when the program id is unknown. */
export function similarPrograms(
  id: string,
  { minWeight = 0, limit = 10 }: SimilarOptions = {},
): SimilarResult | null {
  if (!programs[id]) return null;
  const neighbors = graph[id] ?? []; // already sorted by weight desc
  const similar: SimilarResult['similar'] = [];
  for (const n of neighbors) {
    if (similar.length >= limit) break;
    if (n.weight < minWeight) continue;
    const p = programs[n.id];
    if (!p) continue;
    similar.push({ program: toProgramSummary(p), weight: n.weight });
  }
  return { program_id: id, similar };
}
