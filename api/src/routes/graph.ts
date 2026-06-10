import { createRoute } from '@hono/zod-openapi';
import { GraphSchema } from '../schemas';
import { createRouter } from '../router';
import { getGraph } from '../services';

const router = createRouter();

router.openapi(
  createRoute({
    method: 'get',
    path: '/graph',
    tags: ['graph'],
    summary: 'Full program-similarity graph (unique undirected edges)',
    responses: {
      200: {
        description: 'Graph summary',
        content: { 'application/json': { schema: GraphSchema } },
      },
    },
  }),
  (c) => c.json(getGraph(), 200),
);

export default router;
