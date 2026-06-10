import { describe, expect, it } from 'vitest';
import app from '../src/index';
import metaJson from '../data/meta.json';

describe('GET /v1/meta', () => {
  it('returns meta.json contents plus api_version', async () => {
    const res = await app.request('/v1/meta');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toEqual({ ...metaJson, api_version: 'v1' });
  });

  it('sets ETag and Cache-Control', async () => {
    const res = await app.request('/v1/meta');
    expect(res.headers.get('ETag')).toMatch(/^".+"$/);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('allows all origins via CORS', async () => {
    const res = await app.request('/v1/meta', {
      headers: { Origin: 'https://example.com' },
    });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('unknown routes', () => {
  it('returns the standard error shape on 404', async () => {
    const res = await app.request('/v1/nope');
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body).toEqual({
      error: { code: 'not_found', message: expect.any(String) },
    });
  });
});
