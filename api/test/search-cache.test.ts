/**
 * Direct tests for the embedding cache wrapper (src/services/search-cache.ts).
 *
 * vitest runs in node where the Workers `caches` global does not exist, so
 * the wrapper is exercised with an explicit Map-backed stub, plus the
 * "no cache available" fallback paths.
 */
import { describe, expect, it } from 'vitest';
import {
  EMBED_CACHE_TTL_SECONDS,
  defaultEmbedCache,
  embeddingCacheUrl,
  getCachedEmbedding,
  normalizeQuery,
  putCachedEmbedding,
  type CacheLike,
} from '../src/services/search-cache';

function stubCache() {
  const store = new Map<string, { body: string; headers: Headers }>();
  const cache: CacheLike = {
    match: async (req) => {
      const url = typeof req === 'string' ? req : req.url;
      const hit = store.get(url);
      return hit ? new Response(hit.body, { headers: hit.headers }) : undefined;
    },
    put: async (req, res) => {
      const url = typeof req === 'string' ? req : req.url;
      store.set(url, { body: await res.text(), headers: res.headers });
    },
  };
  return { cache, store };
}

describe('normalizeQuery', () => {
  it('trims, collapses whitespace and lowercases', () => {
    expect(normalizeQuery('  Sound   ART \n design ')).toBe('sound art design');
    expect(normalizeQuery('sound art design')).toBe('sound art design');
  });
});

describe('embeddingCacheUrl', () => {
  it('is deterministic and whitespace/case-insensitive', async () => {
    const a = await embeddingCacheUrl('Sound Art', 'm', 3072);
    const b = await embeddingCacheUrl(' sound   art ', 'm', 3072);
    expect(a).toBe(b);
    expect(() => new URL(a)).not.toThrow();
  });

  it('varies with query, model and dim', async () => {
    const base = await embeddingCacheUrl('sound art', 'm', 3072);
    expect(await embeddingCacheUrl('film directing', 'm', 3072)).not.toBe(base);
    expect(await embeddingCacheUrl('sound art', 'other-model', 3072)).not.toBe(base);
    expect(await embeddingCacheUrl('sound art', 'm', 768)).not.toBe(base);
  });
});

describe('get/putCachedEmbedding', () => {
  it('round-trips a Float32Array through the cache', async () => {
    const { cache } = stubCache();
    const url = await embeddingCacheUrl('q', 'm', 4);
    const vec = Float32Array.from([0.5, -0.5, 0.25, 0]);
    await putCachedEmbedding(url, vec, cache);
    const back = await getCachedEmbedding(url, cache);
    expect(back).toBeInstanceOf(Float32Array);
    expect(Array.from(back!)).toEqual(Array.from(vec));
  });

  it('stores responses with the ~1h TTL Cache-Control header', async () => {
    const { cache, store } = stubCache();
    await putCachedEmbedding('https://x.internal/k', Float32Array.from([1]), cache);
    const stored = [...store.values()][0];
    expect(EMBED_CACHE_TTL_SECONDS).toBe(3600);
    expect(stored.headers.get('Cache-Control')).toBe(
      `public, max-age=${EMBED_CACHE_TTL_SECONDS}`,
    );
  });

  it('misses cleanly on unknown keys', async () => {
    const { cache } = stubCache();
    expect(await getCachedEmbedding('https://x.internal/nope', cache)).toBeNull();
  });

  it('returns null on corrupt cached payloads instead of throwing', async () => {
    const { cache } = stubCache();
    await cache.put('https://x.internal/bad', new Response('not json'));
    expect(await getCachedEmbedding('https://x.internal/bad', cache)).toBeNull();
    await cache.put('https://x.internal/empty', new Response('[]'));
    expect(await getCachedEmbedding('https://x.internal/empty', cache)).toBeNull();
  });

  it('is a no-op when no cache is available (vitest/node)', async () => {
    expect(defaultEmbedCache()).toBeNull();
    // both must resolve without throwing when cache is null
    await putCachedEmbedding('https://x.internal/k', Float32Array.from([1]), null);
    expect(await getCachedEmbedding('https://x.internal/k', null)).toBeNull();
  });

  it('swallows cache backend errors (best-effort)', async () => {
    const broken: CacheLike = {
      match: async () => {
        throw new Error('cache down');
      },
      put: async () => {
        throw new Error('cache down');
      },
    };
    await putCachedEmbedding('https://x.internal/k', Float32Array.from([1]), broken);
    expect(await getCachedEmbedding('https://x.internal/k', broken)).toBeNull();
  });
});
