import { createRoute } from '@hono/zod-openapi';
import {
  ErrorSchema,
  IdParamSchema,
  PaginatedProgramsSchema,
  ProgramSchema,
  ProgramsQuerySchema,
  SimilarQuerySchema,
  SimilarResponseSchema,
} from '../schemas';
import { createRouter, errorBody } from '../router';
import { getProgram, listPrograms, similarPrograms } from '../services';
import type { MonthDay } from '../services';

/** open_on is validated as YYYY-MM-DD upstream; windows are year-agnostic so only month/day matter. */
function toMonthDay(iso: string): MonthDay {
  return { month: Number(iso.slice(5, 7)), day: Number(iso.slice(8, 10)) };
}

const router = createRouter();

router.openapi(
  createRoute({
    method: 'get',
    path: '/programs',
    tags: ['programs'],
    summary: 'List programs (filterable, paginated)',
    request: { query: ProgramsQuerySchema },
    responses: {
      200: {
        description: 'Paginated programs',
        content: { 'application/json': { schema: PaginatedProgramsSchema } },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  (c) => {
    const q = c.req.valid('query');
    const result = listPrograms(
      {
        degree_level: q.degree_level,
        language: q.language,
        school: q.school,
        portfolio_required:
          q.portfolio_required === undefined ? undefined : q.portfolio_required === 'true',
        state: q.state,
        q: q.q,
        open_on: q.open_on === undefined ? undefined : toMonthDay(q.open_on),
      },
      { limit: q.limit, offset: q.offset },
    );
    return c.json(result, 200);
  },
);

router.openapi(
  createRoute({
    method: 'get',
    path: '/programs/{id}',
    tags: ['programs'],
    summary: 'Get one program by id (full record incl. deadlines_raw)',
    request: { params: IdParamSchema },
    responses: {
      200: {
        description: 'Program record',
        content: { 'application/json': { schema: ProgramSchema } },
      },
      404: {
        description: 'Unknown program id',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  (c) => {
    const { id } = c.req.valid('param');
    const program = getProgram(id);
    if (!program) {
      return c.json(errorBody('not_found', `program '${id}' not found`), 404);
    }
    return c.json(program, 200);
  },
);

router.openapi(
  createRoute({
    method: 'get',
    path: '/programs/{id}/similar',
    tags: ['programs'],
    summary: 'Programs similar to this one (precomputed embedding graph)',
    request: { params: IdParamSchema, query: SimilarQuerySchema },
    responses: {
      200: {
        description: 'Similar programs sorted by weight desc',
        content: { 'application/json': { schema: SimilarResponseSchema } },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorSchema } },
      },
      404: {
        description: 'Unknown program id',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  (c) => {
    const { id } = c.req.valid('param');
    const { limit, min_weight } = c.req.valid('query');
    const result = similarPrograms(id, { limit, minWeight: min_weight });
    if (!result) {
      return c.json(errorBody('not_found', `program '${id}' not found`), 404);
    }
    return c.json(result, 200);
  },
);

export default router;
