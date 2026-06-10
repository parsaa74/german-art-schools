/**
 * Pure school services. No Hono imports — the MCP server calls these directly.
 */
import { schools } from '../data';
import type { School } from '../types';

export interface SchoolFilters {
  /** Exact match, case-insensitive. */
  state?: string;
  /** Exact match, case-insensitive. */
  city?: string;
  /** Exact match, case-insensitive. */
  type?: string;
}

const eqCI = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

export function listSchools(filters: SchoolFilters = {}): School[] {
  let result = Object.values(schools);
  if (filters.state !== undefined) {
    result = result.filter((s) => eqCI(s.state, filters.state!));
  }
  if (filters.city !== undefined) {
    result = result.filter((s) => eqCI(s.city, filters.city!));
  }
  if (filters.type !== undefined) {
    result = result.filter((s) => eqCI(s.type, filters.type!));
  }
  return result;
}

export function getSchool(id: string): School | null {
  return schools[id] ?? null;
}
