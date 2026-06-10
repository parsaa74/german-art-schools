/**
 * Shared types for the german-art-schools API.
 *
 * Versioning stance: /v1 is ADDITIVE-ONLY. Fields may be added to response
 * shapes, but existing fields must never be removed or change type/meaning.
 * Breaking changes require a new /v2 prefix.
 *
 * This file is shared between routes, services, the search agent
 * (src/routes/search.ts) and the MCP agent (src/mcp/). Add here, don't break.
 */

// ---------- data artifact types (mirror api/data/*.json) ----------

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SchoolStats {
  students: number | null;
  student_staff_ratio: number | null;
  founded: number | null;
}

export interface School {
  id: string;
  name: string;
  city: string;
  state: string;
  type: string;
  coordinates: Coordinates;
  stats: SchoolStats;
  program_ids: string[];
}

export type DegreeLevel = 'bachelor' | 'master' | 'diploma' | 'phd' | 'other';

export interface DeadlineMonthDay {
  month: number;
  day: number;
}

export interface DeadlineWindow {
  semester: string;
  start: DeadlineMonthDay | null;
  end: DeadlineMonthDay | null;
}

export interface Program {
  program_id: string;
  school_id: string;
  school_name: string;
  name: string;
  degree: string | null;
  degree_level: DegreeLevel;
  language: string | null;
  duration: string | null;
  description: string | null;
  specializations: string[];
  portfolio_required: boolean | null;
  tuition_eur_per_semester: number | null;
  application_url: string | null;
  program_url: string | null;
  source_url: string | null;
  extracted_at: string | null;
  deadlines: DeadlineWindow[];
  deadlines_raw: unknown;
}

/** Compact program representation used in /similar responses. */
export interface ProgramSummary {
  program_id: string;
  name: string;
  degree: string | null;
  degree_level: DegreeLevel;
  school_id: string;
  school_name: string;
}

export interface GraphNeighbor {
  id: string;
  weight: number;
}

/** Adjacency list keyed by program_id, neighbors sorted by weight desc. */
export type Graph = Record<string, GraphNeighbor[]>;

export interface GraphEdge {
  src: string;
  dst: string;
  weight: number;
}

export interface Meta {
  snapshot_date: string;
  generated_at: string;
  counts: Record<string, number>;
  data_hash: string;
  embedding_model: string;
  license: string;
}

// ---------- API response envelope types ----------

export interface Paginated<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

/** Consistent error shape for every non-2xx response (400/404/422/500/501). */
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
