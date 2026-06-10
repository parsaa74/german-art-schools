/**
 * OpenAPIHono router factory + shared error helpers.
 *
 * Every router (including future ones) should be created via createRouter()
 * so zod validation failures consistently map to a 400 with the standard
 * { error: { code, message } } shape.
 */
import { OpenAPIHono } from '@hono/zod-openapi';
import type { ApiError } from './types';

export function errorBody(code: string, message: string): ApiError {
  return { error: { code, message } };
}

export function createRouter(): OpenAPIHono {
  return new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        const message = result.error.issues
          .map((i) => `${i.path.join('.') || '(request)'}: ${i.message}`)
          .join('; ');
        return c.json(errorBody('validation_error', message), 400);
      }
    },
  });
}
