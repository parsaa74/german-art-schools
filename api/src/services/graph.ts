/**
 * Pure graph services. No Hono imports — the MCP server calls these directly.
 */
import { graph } from '../data';
import type { GraphEdge } from '../types';

export interface GraphSummary {
  node_count: number;
  edge_count: number;
  edges: GraphEdge[];
}

let cached: GraphSummary | null = null;

/**
 * Derives the unique undirected edge list from the (symmetric) adjacency.
 * Each undirected pair appears once, with src < dst lexicographically.
 */
export function getGraph(): GraphSummary {
  if (cached) return cached;
  const edges: GraphEdge[] = [];
  for (const [src, neighbors] of Object.entries(graph)) {
    for (const { id: dst, weight } of neighbors) {
      if (src < dst) edges.push({ src, dst, weight });
    }
  }
  cached = {
    node_count: Object.keys(graph).length,
    edge_count: edges.length,
    edges,
  };
  return cached;
}
