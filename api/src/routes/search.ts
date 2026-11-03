/**
 * /v1/search — semantic search over program embeddings.
 *
 * OWNED BY THE SEMANTIC SEARCH AGENT. index.ts mounts this router at
 * /v1/search; the OpenAPIHono sub-router pattern (see routes/programs.ts)
 * makes the endpoint appear in /openapi.json automatically.
 *
 * Error mapping:
 * - missing/invalid query params  → 400 validation_error (router defaultHook)
 * - AI binding not configured     → 503 search_unavailable
 * - Workers AI failure            → 200 with mode "keyword" (word-overlap fallback)
 * - anything else                 → 502 upstream_error
 *
 * Caching note: search responses get `Cache-Control: public, max-age=300`
 * (set both here and via the /v1/search carve-out in the shared
 * src/middleware/cache.ts) — shorter than the 3600s on the static-data
 * endpoints because search involves a live query-embedding call, and a
 * keyword-fallback answer should not outlive a brief Workers AI outage.
 */
import { createRoute, z } from '@hono/zod-openapi';
import {
  DegreeLevelSchema,
  ErrorSchema,
  ProgramSummarySchema,
} from '../schemas';
import { createRouter, errorBody } from '../router';
import {
  searchPrograms,
  SearchUnavailableError,
  type SearchEnv,
} from '../services/search';

export const SearchQuerySchema = z.object({
  q: z
    .string()
    .min(1)
    .max(500)
    .openapi({
      description: 'Natural-language query (1–500 chars).',
      example: 'experimental sound art and installation',
    }),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  min_score: z.coerce
    .number()
    .min(-1)
    .max(1)
    .optional()
    .openapi({ description: 'Minimum approximate cosine score in [-1, 1].' }),
  degree_level: DegreeLevelSchema.optional(),
  language: z.string().optional().openapi({
    description: 'Case-insensitive substring match (values look like "German/English").',
    example: 'english',
  }),
});

export const SearchResponseSchema = z
  .object({
    query: z.string(),
    mode: z.enum(['semantic', 'keyword']).openapi({ description: 'keyword when the embedding model was unavailable and word overlap ranked the hits.' }),
    count: z.number(),
    hits: z.array(
      z.object({
        program: ProgramSummarySchema,
        score: z.number().openapi({
          description: 'semantic: approximate cosine similarity (int8 quantization deflates it ~0.01). keyword: fraction of query words found.',
        }),
      }),
    ),
  })
  .openapi('SearchResults');

const router = createRouter();

router.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['search'],
    summary: 'Semantic search over programs (Workers AI bge-m3 query embedding + bundled vectors)',
    request: { query: SearchQuerySchema },
    responses: {
      200: {
        description: 'Hits sorted by score desc',
        content: { 'application/json': { schema: SearchResponseSchema } },
      },
      400: {
        description: 'Validation error (e.g. missing q)',
        content: { 'application/json': { schema: ErrorSchema } },
      },
      502: {
        description: 'Unexpected search failure',
        content: { 'application/json': { schema: ErrorSchema } },
      },
      503: {
        description: 'Search unavailable (Workers AI binding not configured)',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  async (c) => {
    const { q, limit, min_score, degree_level, language } = c.req.valid('query');
    try {
      const { mode, hits } = await searchPrograms(
        q,
        { limit, minScore: min_score, degreeLevel: degree_level, language },
        (c.env ?? {}) as SearchEnv,
      );
      c.header('Cache-Control', 'public, max-age=300');
      return c.json({ query: q, mode, count: hits.length, hits }, 200);
    } catch (err) {
      if (err instanceof SearchUnavailableError) {
        return c.json(errorBody('search_unavailable', err.message), 503);
      }
      console.error('search upstream failure:', err);
      return c.json(
        errorBody('upstream_error', 'embedding the query failed upstream'),
        502,
      );
    }
  },
);

export default router;
