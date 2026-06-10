/**
 * Pure meta service. No Hono imports — the MCP server calls these directly.
 */
import { meta } from '../data';
import type { Meta } from '../types';

export interface MetaResponse extends Meta {
  api_version: 'v1';
}

export function getMeta(): MetaResponse {
  return { ...meta, api_version: 'v1' };
}
