import { describe, expect, it } from 'vitest';
import app from '../src/index';
import graphJson from '../data/graph.json';
import metaJson from '../data/meta.json';

describe('GET /v1/graph', () => {
  it('returns node_count, edge_count and unique undirected edges', async () => {
    const res = await app.request('/v1/graph');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.node_count).toBe(Object.keys(graphJson).length);
    expect(body.edge_count).toBe(body.edges.length);
    expect(body.edge_count).toBe(metaJson.counts.edges);
  });

  it('every edge appears once, src < dst, and exists in the adjacency', async () => {
    const body = await (await app.request('/v1/graph')).json() as any;
    const seen = new Set<string>();
    for (const e of body.edges) {
      expect(e.src < e.dst).toBe(true);
      const key = `${e.src}|${e.dst}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      const neighbor = (graphJson as any)[e.src].find((n: any) => n.id === e.dst);
      expect(neighbor).toBeDefined();
      expect(neighbor.weight).toBe(e.weight);
    }
  });
});
