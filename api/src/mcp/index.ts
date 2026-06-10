/**
 * /mcp — Model Context Protocol server (streamable HTTP, stateless).
 *
 * POST /mcp carries JSON-RPC; each request gets a fresh McpServer wired to a
 * @hono/mcp StreamableHTTPTransport with no sessions and plain JSON responses
 * (no SSE) — every tool is a fast, read-only lookup over the bundled data.
 * GET/DELETE (and anything else) return a 405 JSON-RPC-style error.
 *
 * Mounted at /mcp by src/index.ts (do not edit that file).
 */
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { StreamableHTTPTransport } from '@hono/mcp';
import { buildMcpServer } from './server';

type Bindings = { GEMINI_API_KEY?: string };

const mcp = new Hono<{ Bindings: Bindings }>();

mcp.post('/', async (c) => {
  const server = buildMcpServer({ GEMINI_API_KEY: c.env?.GEMINI_API_KEY });
  const transport = new StreamableHTTPTransport({
    sessionIdGenerator: undefined, // stateless: no sessions to negotiate
    enableJsonResponse: true, // plain application/json bodies, no SSE
  });
  await server.connect(transport);
  try {
    const res = await transport.handleRequest(c);
    // handleRequest always produces a Response for POST; the fallback is for type-safety.
    return res ?? c.body(null, 204);
  } catch (err) {
    // The transport signals malformed JSON-RPC (parse errors, bad Accept
    // headers, …) as HTTPExceptions carrying a ready-made JSON-RPC error
    // response. Return it here instead of letting the app-level onError
    // flatten it into a generic 500.
    if (err instanceof HTTPException) return err.getResponse();
    throw err;
  }
});

// Stateless server: no SSE stream to GET, no session to DELETE.
mcp.all('/', (c) =>
  c.json(
    {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message:
          'Method not allowed. This MCP server is stateless: send JSON-RPC requests via POST /mcp.',
      },
      id: null,
    },
    405,
    { Allow: 'POST' },
  ),
);

export default mcp;
