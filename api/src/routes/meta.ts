import { createRoute } from '@hono/zod-openapi';
import { MetaSchema } from '../schemas';
import { createRouter } from '../router';
import { getMeta } from '../services';

const router = createRouter();

router.openapi(
  createRoute({
    method: 'get',
    path: '/meta',
    tags: ['meta'],
    summary: 'Data snapshot metadata',
    responses: {
      200: {
        description: 'Snapshot metadata plus api_version',
        content: { 'application/json': { schema: MetaSchema } },
      },
    },
  }),
  (c) => c.json(getMeta(), 200),
);

export default router;
