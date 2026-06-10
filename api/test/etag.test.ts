import { describe, expect, it } from 'vitest';
import app from '../src/index';

describe('ETag / conditional requests', () => {
  it('returns 304 with no body when If-None-Match matches', async () => {
    const first = await app.request('/v1/meta');
    const etag = first.headers.get('ETag')!;
    expect(etag).toBeTruthy();

    const second = await app.request('/v1/meta', {
      headers: { 'If-None-Match': etag },
    });
    expect(second.status).toBe(304);
    expect(second.headers.get('ETag')).toBe(etag);
    expect(await second.text()).toBe('');
  });

  it('returns 200 when If-None-Match does not match', async () => {
    const res = await app.request('/v1/meta', {
      headers: { 'If-None-Match': '"something-else"' },
    });
    expect(res.status).toBe(200);
  });

  it('the ETag depends on path and query', async () => {
    const a = (await app.request('/v1/schools')).headers.get('ETag');
    const b = (await app.request('/v1/schools?state=Hamburg')).headers.get('ETag');
    const c = (await app.request('/v1/programs')).headers.get('ETag');
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });

  it('the ETag is stable across requests', async () => {
    const a = (await app.request('/v1/programs?limit=5')).headers.get('ETag');
    const b = (await app.request('/v1/programs?limit=5')).headers.get('ETag');
    expect(a).toBe(b);
  });

  it('handles weak validators and If-None-Match: *', async () => {
    const etag = (await app.request('/v1/meta')).headers.get('ETag')!;
    const weak = await app.request('/v1/meta', {
      headers: { 'If-None-Match': `W/${etag}` },
    });
    expect(weak.status).toBe(304);
    const star = await app.request('/v1/meta', {
      headers: { 'If-None-Match': '*' },
    });
    expect(star.status).toBe(304);
  });

  it('every /v1 endpoint carries ETag and Cache-Control', async () => {
    const paths = [
      '/v1/meta',
      '/v1/schools',
      '/v1/schools/hochschule-fur-bildende-kunste-hamburg',
      '/v1/programs?limit=1',
      '/v1/graph',
    ];
    for (const path of paths) {
      const res = await app.request(path);
      expect(res.headers.get('ETag'), path).toMatch(/^".+"$/);
      expect(res.headers.get('Cache-Control'), path).toBe('public, max-age=3600');
    }
  });
});
