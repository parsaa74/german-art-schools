import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index';
import graphJson from '../data/graph.json';
import metaJson from '../data/meta.json';
import { SearchUnavailableError, semanticSearch } from '../src/services/search';

vi.mock('../src/services/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/services/search')>();
  return { ...actual, semanticSearch: vi.fn(actual.semanticSearch) };
});

const mockedSearch = vi.mocked(semanticSearch);

const HFBK = 'hochschule-fur-bildende-kunste-hamburg';
const HFBK_BFA =
  'hochschule-fur-bildende-kunste-hamburg--fine-arts--bachelor-of-fine-arts';

const TOOL_NAMES = [
  'list_schools',
  'get_school',
  'get_program',
  'list_open_deadlines',
  'find_similar_programs',
  'search_programs',
];

let nextId = 1;

async function post(body: string, env?: Record<string, unknown>) {
  return app.request(
    '/mcp',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body,
    },
    env,
  );
}

async function rpc(method: string, params?: unknown, env?: Record<string, unknown>) {
  const res = await post(
    JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params }),
    env,
  );
  expect(res.status).toBe(200);
  const body = (await res.json()) as any;
  expect(body.jsonrpc).toBe('2.0');
  expect(body.error, JSON.stringify(body.error)).toBeUndefined();
  return body.result;
}

async function callTool(name: string, args: Record<string, unknown> = {}, env?: Record<string, unknown>) {
  return rpc('tools/call', { name, arguments: args }, env);
}

function payloadOf(result: any): any {
  expect(result.content).toHaveLength(1);
  expect(result.content[0].type).toBe('text');
  return JSON.parse(result.content[0].text);
}

beforeEach(() => {
  mockedSearch.mockClear();
});

describe('POST /mcp — protocol', () => {
  it('answers the initialize handshake with the server identity', async () => {
    const result = await rpc('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'vitest', version: '0.0.0' },
    });
    expect(result.serverInfo.name).toBe('german-art-schools');
    expect(result.serverInfo.version).toBe(metaJson.snapshot_date);
    expect(result.protocolVersion).toBeDefined();
    expect(result.instructions).toContain(metaJson.snapshot_date);
    expect(result.capabilities.tools).toBeDefined();
  });

  it('responds to ping', async () => {
    const result = await rpc('ping');
    expect(result).toEqual({});
  });

  it('returns a JSON-RPC parse error for a malformed body', async () => {
    const res = await post('this is not json {');
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.jsonrpc).toBe('2.0');
    expect(body.error.code).toBe(-32700);
  });

  it('rejects GET with a 405 JSON-RPC-style error', async () => {
    const res = await app.request('/mcp');
    expect(res.status).toBe(405);
    const body = (await res.json()) as any;
    expect(body.jsonrpc).toBe('2.0');
    expect(body.error.code).toBe(-32000);
    expect(body.error.message).toMatch(/method not allowed/i);
  });

  it('rejects DELETE with a 405 JSON-RPC-style error', async () => {
    const res = await app.request('/mcp', { method: 'DELETE' });
    expect(res.status).toBe(405);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe(-32000);
  });
});

describe('tools/list', () => {
  it('lists exactly the 6 contract tools with descriptions and schemas', async () => {
    const result = await rpc('tools/list');
    expect(result.tools).toHaveLength(6);
    expect(result.tools.map((t: any) => t.name).sort()).toEqual(
      [...TOOL_NAMES].sort(),
    );
    for (const tool of result.tools) {
      expect(tool.description, tool.name).toBeTruthy();
      expect(tool.description.length, tool.name).toBeGreaterThan(0);
      expect(tool.inputSchema, tool.name).toBeDefined();
      expect(tool.inputSchema.type, tool.name).toBe('object');
    }
  });
});

describe('tools/call — list_schools', () => {
  it('filters by state: Hamburg has exactly 2 schools', async () => {
    const payload = payloadOf(await callTool('list_schools', { state: 'Hamburg' }));
    expect(payload.total).toBe(2);
    expect(payload.schools).toHaveLength(2);
    expect(payload.schools.map((s: any) => s.id)).toContain(HFBK);
    for (const s of payload.schools) {
      expect(Object.keys(s).sort()).toEqual(
        ['city', 'id', 'name', 'program_count', 'state', 'type'].sort(),
      );
      expect(s.state).toBe('Hamburg');
      expect(s.program_count).toBeGreaterThan(0);
    }
  });
});

describe('tools/call — get_school', () => {
  it('returns the full record plus program summaries for a known id', async () => {
    const result = await callTool('get_school', { school_id: HFBK });
    expect(result.isError).toBeFalsy();
    const payload = payloadOf(result);
    expect(payload.id).toBe(HFBK);
    expect(payload.name).toBe('Hochschule für bildende Künste Hamburg');
    expect(payload.state).toBe('Hamburg');
    expect(payload.programs.length).toBeGreaterThan(0);
    expect(payload.programs.length).toBe(payload.program_ids.length);
    for (const p of payload.programs) {
      expect(Object.keys(p).sort()).toEqual(
        ['degree', 'degree_level', 'name', 'program_id'].sort(),
      );
    }
    expect(payload.programs.map((p: any) => p.program_id)).toContain(HFBK_BFA);
  });

  it('returns an isError result (not a protocol error) naming an unknown id', async () => {
    const result = await callTool('get_school', { school_id: 'not-a-school' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not-a-school');
  });
});

describe('tools/call — get_program', () => {
  it('returns the full program record with deadlines and provenance', async () => {
    const result = await callTool('get_program', { program_id: HFBK_BFA });
    expect(result.isError).toBeFalsy();
    const payload = payloadOf(result);
    expect(payload.program_id).toBe(HFBK_BFA);
    expect(payload.school_id).toBe(HFBK);
    expect(Array.isArray(payload.deadlines)).toBe(true);
    expect(payload.deadlines.length).toBeGreaterThan(0);
    for (const key of ['application_url', 'source_url', 'extracted_at', 'degree', 'language']) {
      expect(payload, key).toHaveProperty(key);
    }
    expect(payload.deadline_windows_readable.length).toBe(payload.deadlines.length);
  });

  it('returns isError for an unknown id', async () => {
    const result = await callTool('get_program', { program_id: 'nope' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('nope');
  });
});

describe('tools/call — list_open_deadlines', () => {
  it('finds the 22 english master programs open on 2026-06-10', async () => {
    const payload = payloadOf(
      await callTool('list_open_deadlines', {
        on_date: '2026-06-10',
        degree_level: 'master',
        language: 'english',
      }),
    );
    expect(payload.on_date).toBe('2026-06-10');
    expect(payload.total_open).toBe(22);
    expect(payload.returned).toBe(22); // fits inside the default limit of 25
    expect(payload.programs).toHaveLength(22);
    for (const p of payload.programs) {
      expect(p.degree_level).toBe('master');
      expect(p.language.toLowerCase()).toContain('english');
      expect(p).toHaveProperty('application_url');
      expect(p).toHaveProperty('extracted_at');
      expect(p).toHaveProperty('city');
      expect(p).toHaveProperty('state');
      expect(p.deadline_windows.length).toBeGreaterThan(0);
    }
    // human-readable window strings like "1 March – 15 April (winter)"
    const allWindows = payload.programs.flatMap((p: any) => p.deadline_windows);
    expect(
      allWindows.some((w: string) => /\d{1,2} [A-Z][a-z]+ – \d{1,2} [A-Z][a-z]+/.test(w)),
    ).toBe(true);
  });

  it('respects limit', async () => {
    const payload = payloadOf(
      await callTool('list_open_deadlines', { on_date: '2026-06-10', limit: 5 }),
    );
    expect(payload.returned).toBe(5);
    expect(payload.programs).toHaveLength(5);
    expect(payload.total_open).toBeGreaterThan(5);
  });

  it('rejects a malformed on_date with an isError result', async () => {
    const result = await callTool('list_open_deadlines', { on_date: '2026-13-01' });
    expect(result.isError).toBe(true);
  });
});

describe('tools/call — find_similar_programs', () => {
  it('matches the adjacency in graph.json', async () => {
    const payload = payloadOf(
      await callTool('find_similar_programs', { program_id: HFBK_BFA, limit: 3 }),
    );
    expect(payload.program_id).toBe(HFBK_BFA);
    const expected = (graphJson as any)[HFBK_BFA].slice(0, 3);
    expect(payload.similar.map((s: any) => s.program.program_id)).toEqual(
      expected.map((n: any) => n.id),
    );
    expect(payload.similar.map((s: any) => s.weight)).toEqual(
      expected.map((n: any) => n.weight),
    );
  });

  it('defaults to 10 neighbors', async () => {
    const payload = payloadOf(
      await callTool('find_similar_programs', { program_id: HFBK_BFA }),
    );
    expect(payload.similar).toHaveLength(
      Math.min(10, (graphJson as any)[HFBK_BFA].length),
    );
  });

  it('returns isError for an unknown id', async () => {
    const result = await callTool('find_similar_programs', { program_id: 'nope' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('nope');
  });
});

describe('tools/call — search_programs', () => {
  const HIT = {
    program: {
      program_id: HFBK_BFA,
      name: 'Fine Arts',
      degree: 'Bachelor of Fine Arts',
      degree_level: 'bachelor',
      school_id: HFBK,
      school_name: 'Hochschule für bildende Künste Hamburg',
    },
    score: 0.91,
  };

  it('returns scored hits and forwards args + env to semanticSearch', async () => {
    mockedSearch.mockResolvedValueOnce([HIT as any]);
    const result = await callTool(
      'search_programs',
      { query: 'experimental sound art', degree_level: 'bachelor', limit: 5 },
      { GEMINI_API_KEY: 'test-key' },
    );
    expect(result.isError).toBeFalsy();
    const payload = payloadOf(result);
    expect(payload.query).toBe('experimental sound art');
    expect(payload.results).toHaveLength(1);
    expect(payload.results[0].program_id).toBe(HFBK_BFA);
    expect(payload.results[0].score).toBe(0.91);
    expect(mockedSearch).toHaveBeenCalledExactlyOnceWith(
      'experimental sound art',
      { limit: 5, degreeLevel: 'bachelor', language: undefined },
      { GEMINI_API_KEY: 'test-key' },
    );
  });

  it('maps SearchUnavailableError to an isError result with guidance', async () => {
    mockedSearch.mockRejectedValueOnce(new SearchUnavailableError());
    const result = await callTool('search_programs', { query: 'sound art' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toBe(
      'Semantic search is currently unavailable on this server. ' +
        'Use list_open_deadlines or get_school/list_schools with filters instead.',
    );
  });
});
