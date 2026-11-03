/**
 * Semantic search service.
 *
 * The exported semanticSearch / SearchUnavailableError shapes are what the MCP server (src/mcp/) and the
 * /v1/search route build on; searchPrograms() wraps semanticSearch with a keyword fallback.
 *
 * How it works:
 * 1. The query is embedded with Workers AI @cf/baai/bge-m3 (the AI binding, free daily allocation), the
 *    SAME model scratch/build-search-embeddings.ts used for api/data/vectors.bin, so query and document
 *    vectors share one space. Query embeddings are cached best-effort via the Workers Cache API.
 * 2. The stored rows are L2-normalized vectors quantized to int8 as
 *    round(v * 127), concatenated in vectors.meta.json `ids` order. We
 *    L2-normalize the query (floats) and score each row as
 *    dot(int8Row, queryFloat) / 127 ≈ cosine similarity.
 * 3. Filters (degreeLevel exact, language case-insensitive substring —
 *    same semantics as services/programs.ts) are applied, then hits are
 *    sorted by score desc and truncated to `limit`. Warned records never appear.
 */
import vectorsBin from '../../data/vectors.bin';
import vectorsMeta from '../../data/vectors.meta.json';
import { getProgram, isListed, listPrograms, programText, toProgramSummary } from '../services';
import type { DegreeLevel, ProgramSummary } from '../types';
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
 * Thrown when search cannot run at all (the Workers AI binding is not configured).
 * Routes map this to 503; MCP tools map it to an isError result.
 */
export class SearchUnavailableError extends Error {
  constructor(message = 'semantic search is not available') {
    super(message);
    this.name = 'SearchUnavailableError';
  }
}

/** Workers AI binding (wrangler.toml [ai]), typed minimally so tests can pass a stub. */
export interface SearchEnv {
  AI?: { run(model: string, input: { text: string[] }): Promise<unknown> };
}

// ---------- embedding (must mirror the stored document vectors) ----------

const MODEL = '@cf/baai/bge-m3';
const DIM = 1024;

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

/** Runs bge-m3 on Workers AI; returns the raw (un-normalized) embedding. */
async function fetchQueryEmbedding(query: string, ai: NonNullable<SearchEnv['AI']>): Promise<Float32Array> {
  const out = (await ai.run(MODEL, { text: [query] })) as { data?: unknown } | null;
  const values = Array.isArray(out?.data) ? out.data[0] : undefined;
  if (!Array.isArray(values) || values.length !== DIM) {
    throw new Error(`Workers AI ${MODEL} returned an unexpected shape (expected ${DIM} values)`);
  }
  return Float32Array.from(values as number[]);
}

/** Embed `query`, using the best-effort Cache API wrapper around Workers AI. */
async function embedQuery(query: string, ai: NonNullable<SearchEnv['AI']>): Promise<Float32Array> {
  const cacheUrl = await embeddingCacheUrl(query, MODEL, DIM);
  const cached = await getCachedEmbedding(cacheUrl);
  if (cached && cached.length === DIM) return cached;

  const vector = l2Normalize(await fetchQueryEmbedding(query, ai));
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
  if (!env.AI) {
    throw new SearchUnavailableError(
      'semantic search is not available: the Workers AI binding is not configured',
    );
  }

  const queryVec = await embedQuery(query, env.AI);

  const limit = Math.min(Math.max(Math.floor(opts.limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
  const language = opts.language?.toLowerCase();
  const rows = getMatrix();

  const scored: SemanticSearchHit[] = [];
  for (let i = 0; i < ids.length; i++) {
    const program = getProgram(ids[i]);
    if (!program || !isListed(program)) continue;
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

export interface SearchResult {
  /** 'keyword' when Workers AI failed (e.g. the free daily allocation is used up) and word overlap ranked the hits. */
  mode: 'semantic' | 'keyword';
  hits: SemanticSearchHit[];
}

/** semanticSearch, falling back to keyword overlap when the model call fails. Only a missing binding is an error. */
export async function searchPrograms(query: string, opts: SemanticSearchOptions, env: SearchEnv): Promise<SearchResult> {
  try {
    return { mode: 'semantic', hits: await semanticSearch(query, opts, env) };
  } catch (err) {
    if (err instanceof SearchUnavailableError) throw err;
    console.error('semantic search failed, using keyword fallback:', err);
    return { mode: 'keyword', hits: keywordSearch(query, opts) };
  }
}

const STOPWORDS = new Set(['and', 'the', 'for', 'with', 'of', 'in', 'und', 'der', 'die', 'das', 'mit', 'für', 'von', 'im']);

/** Ranks listed programs by the fraction of query words found in their text (same text as ?q=). */
function keywordSearch(query: string, opts: SemanticSearchOptions): SemanticSearchHit[] {
  const words = [...new Set(query.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1 && !STOPWORDS.has(w)))];
  if (words.length === 0) return [];
  const limit = Math.min(Math.max(Math.floor(opts.limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT);
  const { items } = listPrograms(
    { degree_level: opts.degreeLevel as DegreeLevel | undefined, language: opts.language },
    { limit: Infinity, offset: 0 },
  );
  return items
    .map((p) => {
      const text = programText(p);
      return { program: toProgramSummary(p), score: words.filter((w) => text.includes(w)).length / words.length };
    })
    .filter((h) => h.score > 0 && (opts.minScore === undefined || h.score >= opts.minScore))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
