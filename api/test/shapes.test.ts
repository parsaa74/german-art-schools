/**
 * Snapshot tests of response SHAPES (key paths, not values).
 *
 * These guard the additive-only /v1 contract: a key disappearing or moving
 * fails the snapshot. New keys also fail the snapshot — that is intentional;
 * adding a field is allowed but must be a conscious snapshot update.
 */
import { describe, expect, it } from 'vitest';
import app from '../src/index';

const HFBK = 'hochschule-fur-bildende-kunste-hamburg';
const HFBK_BFA = 'hochschule-fur-bildende-kunste-hamburg--fine-arts--bachelor-of-fine-arts';

/** Collects sorted key paths; arrays contribute the shape of their first element as `[]`. */
function keyPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.length > 0 ? keyPaths(value[0], `${prefix}[]`) : [`${prefix}[]`];
  }
  if (value !== null && typeof value === 'object') {
    const paths: string[] = [];
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const child = (value as Record<string, unknown>)[key];
      if (child !== null && typeof child === 'object') {
        paths.push(...keyPaths(child, path));
      } else {
        paths.push(path);
      }
    }
    return paths.sort();
  }
  return [prefix];
}

describe('response shape snapshots (additive-only contract)', () => {
  it('/v1/schools/{id} shape', async () => {
    const body = await (await app.request(`/v1/schools/${HFBK}`)).json() as any;
    expect(keyPaths(body)).toMatchSnapshot();
  });

  it('/v1/programs/{id} shape', async () => {
    const body = await (await app.request(`/v1/programs/${HFBK_BFA}`)).json() as any;
    expect(keyPaths(body)).toMatchSnapshot();
  });
});
