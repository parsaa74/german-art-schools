/**
 * Semantic search service.
 *
 * OWNED BY THE SEMANTIC SEARCH AGENT. The exported names/shapes below are a
 * frozen contract: the MCP server (src/mcp/) imports
 * { semanticSearch, SearchUnavailableError } from this module and is
 * developed in parallel against exactly this interface.
 *
 * Deliberately NOT re-exported from the services barrel (index.ts) so the
 * two parallel agents never edit the same file. Import directly:
 *   import { semanticSearch } from '../services/search';
 *
 * How it works:
 * 1. The query is embedded with the SAME Gemini model/taskType/dim used to
 *    build api/data/vectors.bin (see scripts/build-program-embeddings.ts:
 *    gemini-embedding-2-preview, SEMANTIC_SIMILARITY, 3072 dims), so query
 *    vectors live in the same space as the stored document vectors.
 *    Query embeddings are cached best-effort via the Workers Cache API.
 * 2. The stored rows are L2-normalized vectors quantized to int8 as
 *    round(v * 127), concatenated in vectors.meta.json `ids` order. We
 *    L2-normalize the query (floats) and score each row as
 *    dot(int8Row, queryFloat) / 127 ≈ cosine similarity.
 * 3. Filters (degreeLevel exact, language case-insensitive substring —
 *    same semantics as services/programs.ts) are applied, then hits are
 *    sorted by score desc and truncated to `limit`.
 */
import vectorsBin from '../../data/vectors.bin';
import vectorsMeta from '../../data/vectors.meta.json';
import { getProgram, toProgramSummary } from '../services';
import type { ProgramSummary } from '../types';
import {
  embeddingCacheUrl,
  getCachedEmbedding,
  putCachedEmbedding,
} from './search-cache';

export interface SemanticSearchOptions {
  /** Max hits to return. Default 10, max 50. */
  limit?: number;
  /** Minimum approximate cosine score in [-1, 1]. Default: no threshold. */
  minScore?: number;
  /** Filter hits by degree_level (exact, e.g. "master"). */
  degreeLevel?: string;
  /** Filter hits by language (case-insensitive substring, e.g. "english"). */
  language?: string;
}

export interface SemanticSearchHit {
  program: ProgramSummary;
  /** Approximate cosine similarity (int8-quantized vectors deflate it ~0.01). */
  score: number;
}

/**
 * Thrown when search cannot run at all (e.g. GEMINI_API_KEY is not
 * configured). Routes map this to 503; MCP tools map it to an isError result.
 */
export class SearchUnavailableError extends Error {
  constructor(message = 'semantic search is not available') {
    super(message);
    this.name = 'SearchUnavailableError';
  }
}

export interface SearchEnv {
  GEMINI_API_KEY?: string;
}

// ---------- embedding (must mirror scripts/build-program-embeddings.ts) ----------

const MODEL = 'gemini-embedding-2-preview';
const DIM = 3072;
const TASK_TYPE = 'SEMANTIC_SIMILARITY';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`;

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/** L2-normalize in place. Throws on a zero vector (cosine is undefined). */
function l2Normalize(v: Float32Array): Float32Array {
  let sumSq = 0;
  for (let i = 0; i < v.length; i++) sumSq += v[i] * v[i];
  const norm = Math.sqrt(sumSq);
  if (norm === 0) throw new Error('embedding has zero norm');
  for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

/** Calls the Gemini REST API; returns the raw (un-normalized) embedding. */
async function fetchQueryEmbedding(query: string, apiKey: string): Promise<Float32Array> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: `models/${MODEL}`,
      content: { parts: [{ text: query }] },
      taskType: TASK_TYPE,
      outputDimensionality: DIM,
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini embedContent failed: HTTP ${res.status}`);
  }
  const json = (await res.json()) as { embedding?: { values?: unknown } };
  const values = json.embedding?.values;
  if (!Array.isArray(values) || values.length !== DIM) {
    throw new Error(
      `Gemini embedContent returned an unexpected shape (expected ${DIM} values)`,
    );
  }
  return Float32Array.from(values as number[]);
}

/** Embed `query`, using the best-effort Cache API wrapper around Gemini. */
async function embedQuery(query: string, apiKey: string): Promise<Float32Array> {
  const cacheUrl = await embeddingCacheUrl(query, MODEL, DIM);
  const cached = await getCachedEmbedding(cacheUrl);
  if (cached && cached.length === DIM) return cached;

  const vector = l2Normalize(await fetchQueryEmbedding(query, apiKey));
  await putCachedEmbedding(cacheUrl, vector);
  return vector;
}

// ---------- ranking over the bundled int8 matrix ----------

const ids: string[] = vectorsMeta.ids;
const scale: number = vectorsMeta.scale;

let matrix: Int8Array | null = null;

/** Lazily-initialized Int8Array view over the bundled vector matrix. */
function getMatrix(): Int8Array {
  if (matrix === null) {
    matrix = new Int8Array(vectorsBin);
    if (matrix.length !== ids.length * DIM) {
      throw new Error(
        `vectors.bin size mismatch: got ${matrix.length} bytes, expected ${ids.length * DIM}`,
      );
    }
  }
  return matrix;
}

/**
 * Embed `query` and rank all programs by cosine similarity against the
 * bundled int8 vector matrix, applying filters, then return the top hits.
 */
export async function semanticSearch(
  query: string,
  opts: SemanticSearchOptions,
  env: SearchEnv,
): Promise<SemanticSearchHit[]> {
  if (!env.GEMINI_API_KEY) {
    throw new SearchUnavailableError(
      'semantic search is not available: GEMINI_API_KEY is not configured',
    );
  }

  const queryVec = await embedQuery(query, env.GEMINI_API_KEY);

  const limit = Math.min(Math.max(Math.floor(opts.limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
  const language = opts.language?.toLowerCase();
  const rows = getMatrix();

  const scored: SemanticSearchHit[] = [];
  for (let i = 0; i < ids.length; i++) {
    const program = getProgram(ids[i]);
    if (!program) continue;
    // Filters first — same semantics as services/programs.ts listPrograms().
    if (opts.degreeLevel !== undefined && program.degree_level !== opts.degreeLevel) continue;
    if (language !== undefined && !(program.language ?? '').toLowerCase().includes(language)) {
      continue;
    }

    let dot = 0;
    const offset = i * DIM;
    for (let j = 0; j < DIM; j++) dot += rows[offset + j] * queryVec[j];
    const score = dot / scale;

    if (opts.minScore !== undefined && score < opts.minScore) continue;
    scored.push({ program: toProgramSummary(program), score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
