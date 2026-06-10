import { createRoute } from '@hono/zod-openapi';
import {
  ErrorSchema,
  IdParamSchema,
  SchoolSchema,
  SchoolsQuerySchema,
} from '../schemas';
import { createRouter, errorBody } from '../router';
import { getSchool, listSchools } from '../services';

const router = createRouter();

router.openapi(
  createRoute({
    method: 'get',
    path: '/schools',
    tags: ['schools'],
    summary: 'List schools',
    request: { query: SchoolsQuerySchema },
    responses: {
      200: {
        description: 'Array of schools (all filters are exact, case-insensitive)',
        content: { 'application/json': { schema: SchoolSchema.array() } },
      },
      400: {
        description: 'Validation error',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  (c) => {
    const { state, city, type } = c.req.valid('query');
    return c.json(listSchools({ state, city, type }), 200);
  },
);

router.openapi(
  createRoute({
    method: 'get',
    path: '/schools/{id}',
    tags: ['schools'],
    summary: 'Get one school by id',
    request: { params: IdParamSchema },
    responses: {
      200: {
        description: 'School record',
        content: { 'application/json': { schema: SchoolSchema } },
      },
      404: {
        description: 'Unknown school id',
        content: { 'application/json': { schema: ErrorSchema } },
      },
    },
  }),
  (c) => {
    const { id } = c.req.valid('param');
    const school = getSchool(id);
    if (!school) {
      return c.json(errorBody('not_found', `school '${id}' not found`), 404);
    }
    return c.json(school, 200);
  },
);

export default router;
