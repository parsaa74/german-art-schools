/**
 * ETag + Cache-Control middleware for /v1/*.
 *
 * The whole API is a pure function of the data snapshot, so a strong ETag
 * can be derived WITHOUT running the handler: data_hash (from meta.json)
 * + request path + query. If the client sends a matching If-None-Match we
 * short-circuit with 304.
 */
import type { MiddlewareHandler } from 'hono';
import { meta } from '../data';

/** FNV-1a 32-bit — tiny, stable, good enough for cache keys. */
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function computeEtag(pathname: string, search: string): string {
  return `"${meta.data_hash}-${fnv1a(pathname + search)}"`;
}

function etagMatches(ifNoneMatch: string, etag: string): boolean {
  if (ifNoneMatch.trim() === '*') return true;
  return ifNoneMatch
    .split(',')
    .map((v) => v.trim().replace(/^W\//, ''))
    .includes(etag);
}

/**
 * /v1/search hits a live upstream (query embedding) and is the only
 * endpoint that isn't a pure function of the snapshot alone, so it gets a
 * shorter TTL than the static-data endpoints.
 */
function cacheControlFor(pathname: string): string {
  return pathname.startsWith('/v1/search')
    ? 'public, max-age=300'
    : 'public, max-age=3600';
}

export const cacheMiddleware: MiddlewareHandler = async (c, next) => {
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    return next();
  }
  const url = new URL(c.req.url);
  const etag = computeEtag(url.pathname, url.search);
  const cacheControl = cacheControlFor(url.pathname);
  const headers = {
    ETag: etag,
    'Cache-Control': cacheControl,
  };
  const ifNoneMatch = c.req.header('If-None-Match');
  if (ifNoneMatch !== undefined && etagMatches(ifNoneMatch, etag)) {
    return c.body(null, 304, headers);
  }
  await next();
  c.header('ETag', etag);
  c.header('Cache-Control', cacheControl);
};
