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
  /** Listed programs only; warned (not-matched / discontinued) records stay fetchable by id. */
  program_ids: string[];
  website: string | null;
  description: string | null;
  address: { street: string; postal_code: string; city: string } | null;
  /** Institution-wide handling route for foreign qualifications; a program's application_methods overrides it. */
  application_method: 'direct' | 'uni-assist' | null;
  application_method_source: { url: string; checked: string } | null;
  application_route: { method: string; notes: string; url?: string; scope?: string } | null;
  fees: Fee[];
  /** Published non-EU tuition text (may be a range); null means none recorded, not "free". */
  non_eu_tuition: { per_semester: string | null; source: string; checked: string } | null;
  contact: Record<string, string> | null;
  sources: Record<string, string>;
  researched: string | null;
}

export interface Fee { kind: string; euros: number | null; period: string; appliesTo: string; notes?: string; cycle?: string | null; approximate?: boolean }

/** Slugs of the website's subject groups (src/lib/taxonomy.ts SUBJECT_GROUPS + other). */
export const SUBJECTS = [
  'fine-art', 'communication-graphic-design', 'interaction-digital-media', 'product-industrial-design',
  'fashion-textile-jewellery', 'architecture-interior-stage-design', 'film-television', 'animation-games-vfx',
  'photography', 'media-art-sound', 'theatre-acting-dance', 'music-performance', 'composition-conducting-theory',
  'church-music', 'art-music-education', 'theory-curating-management', 'other',
] as const;
export type Subject = (typeof SUBJECTS)[number];

/** A scoped date that is not the general application window: portfolio, aptitude-test registration, guest/transfer rounds. */
export interface OtherDeadline {
  kind: string;
  semester: string | null;
  start: DeadlineMonthDay | null;
  end: DeadlineMonthDay | null;
  scope: string | null;
  cycle: string | null;
  source: string | null;
}

export type DegreeLevel = 'bachelor' | 'master' | 'diploma' | 'phd' | 'other';

export interface DeadlineMonthDay {
  month: number;
  day: number;
  year?: number; // set only for a date published for one round (never annual)
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
  search_aliases?: string[];
  teaching_areas?: Array<{ name: string; kind: string; source: string }>;
  faculty?: Array<{ name: string; title?: string; profile_url?: string; source: string }>; // only officially sourced rosters
  joint_with?: string[];
  joint_program_id?: string | null;
  joint_profile?: string | null;
  intakes?: string[];
  application_methods?: Array<'direct' | 'uni-assist'>; // sourced handling routes for foreign qualifications
  application_route?: { method: string; notes: string; url?: string; scope?: string } | null;
  fees?: Fee[];
  requirements?: Array<{ label: string; text: string }>;
  sources?: Record<string, string>;
  researched?: string | null;
  status?: { status: string; notes?: string } | null;
  portfolio_required: boolean | null;
  tuition_eur_per_semester: number | null;
  application_url: string | null;
  program_url: string | null;
  source_url: string | null;
  extracted_at: string | null;
  deadlines: DeadlineWindow[];
  deadlines_raw: unknown;
  /** Primary subject first, then subjects of officially sourced study focuses. */
  subjects: Subject[];
  /** Sourced admission route ('aptitude', 'restricted', 'open', …); null means unresearched, never derived. */
  admission: string | null;
  admission_source: string | null;
  other_deadlines: OtherDeadline[];
  language_requirements: string | null;
  language_notes: string[];
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
