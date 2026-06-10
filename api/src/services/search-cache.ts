/**
 * Best-effort query-embedding cache on the Workers Cache API.
 *
 * OWNED BY THE SEMANTIC SEARCH AGENT — used ONLY by src/services/search.ts.
 *
 * Embeddings are stored as JSON float arrays under a synthetic URL derived
 * from a SHA-256 hash of the normalized query (+ model + dim), with a ~1h
 * TTL via Cache-Control. Everything here is best-effort: in environments
 * without `caches` (vitest/node) or on any cache error we silently fall
 * through and the caller re-embeds.
 */

/** TTL for cached query embeddings (seconds). */
export const EMBED_CACHE_TTL_SECONDS = 3600;

/** Minimal structural type for `caches.default` (also easy to stub in tests). */
export interface CacheLike {
  match(request: Request | string): Promise<Response | undefined>;
  put(request: Request | string, response: Response): Promise<void>;
}

/** Collapse whitespace + lowercase so trivially-different queries share a key. */
export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase();
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Synthetic, deterministic cache URL for a query embedding. */
export async function embeddingCacheUrl(
  query: string,
  model: string,
  dim: number,
): Promise<string> {
  const hash = await sha256Hex(`${model}:${dim}:${normalizeQuery(query)}`);
  return `https://embed-cache.german-art-schools.internal/${hash}`;
}

/** `caches.default` when running on Workers; null elsewhere (vitest/node). */
export function defaultEmbedCache(): CacheLike | null {
  try {
    const caches = (globalThis as { caches?: { default?: CacheLike } }).caches;
    return caches?.default ?? null;
  } catch {
    return null;
  }
}

/** Returns the cached embedding for `url`, or null on miss/error/no cache. */
export async function getCachedEmbedding(
  url: string,
  cache: CacheLike | null = defaultEmbedCache(),
): Promise<Float32Array | null> {
  if (!cache) return null;
  try {
    const res = await cache.match(url);
    if (!res) return null;
    const values = (await res.json()) as unknown;
    if (!Array.isArray(values) || values.length === 0) return null;
    return Float32Array.from(values as number[]);
  } catch {
    return null;
  }
}

/** Stores an embedding under `url` with the standard TTL. Best-effort. */
export async function putCachedEmbedding(
  url: string,
  vector: Float32Array,
  cache: CacheLike | null = defaultEmbedCache(),
): Promise<void> {
  if (!cache) return;
  try {
    await cache.put(
      url,
      new Response(JSON.stringify(Array.from(vector)), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${EMBED_CACHE_TTL_SECONDS}`,
        },
      }),
    );
  } catch {
    // best-effort — a failed put just means we re-embed next time
  }
}
