import { describe, expect, it } from 'vitest';
import app from '../src/index';

describe('extension stubs', () => {
  // /v1/search is implemented now (see search.test.ts); without q it 400s.
  it('GET /v1/search without q returns 400 validation_error', async () => {
    const res = await app.request('/v1/search');
    expect(res.status).toBe(400);
    expect((await res.json() as any).error.code).toBe('validation_error');
  });

  // /mcp is implemented now (see mcp.test.ts); the stateless MCP server
  // only accepts POST, so GET gets a 405 JSON-RPC-style error.
  it('GET /mcp returns 405', async () => {
    const res = await app.request('/mcp');
    expect(res.status).toBe(405);
  });

  it('CORS preflight on /mcp allows POST', async () => {
    const res = await app.request('/mcp', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'POST',
      },
    });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('CORS on /v1 is GET-only', async () => {
    const res = await app.request('/v1/meta', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'GET',
      },
    });
    const allowed = res.headers.get('Access-Control-Allow-Methods') ?? '';
    expect(allowed).toContain('GET');
    expect(allowed).not.toContain('POST');
  });
});

describe('docs', () => {
  it('/openapi.json lists all /v1 paths', async () => {
    const res = await app.request('/openapi.json');
    expect(res.status).toBe(200);
    const spec = await res.json() as any;
    expect(spec.openapi).toBeDefined();
    const paths = Object.keys(spec.paths);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/v1/meta',
        '/v1/schools',
        '/v1/schools/{id}',
        '/v1/programs',
        '/v1/programs/{id}',
        '/v1/programs/{id}/similar',
        '/v1/graph',
      ]),
    );
  });

  it('/ serves an HTML docs page linking the spec', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('/openapi.json');
    expect(html).toContain('/v1/programs');
  });
});
