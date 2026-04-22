import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const EMB_PATH = resolve(process.cwd(), 'data/program_embeddings.json');
const OUT_PATH = resolve(process.cwd(), 'src/data/program_graph.json');
const K = 6;
const THRESHOLD = 0.55;

interface EmbeddingsFile {
  model: string;
  dim: number;
  embeddings: Record<string, number[]>;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function main() {
  const file = JSON.parse(readFileSync(EMB_PATH, 'utf8')) as EmbeddingsFile;
  const ids = Object.keys(file.embeddings);
  const vecs = ids.map(id => file.embeddings[id]);
  const n = ids.length;
  console.log(`computing kNN over ${n} programs (k=${K}, threshold=${THRESHOLD})`);

  const edges: Array<{ src: string; dst: string; weight: number }> = [];
  const edgeKeys = new Set<string>();

  for (let i = 0; i < n; i++) {
    const sims: Array<{ j: number; sim: number }> = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      sims.push({ j, sim: cosine(vecs[i], vecs[j]) });
    }
    sims.sort((a, b) => b.sim - a.sim);
    for (const { j, sim } of sims.slice(0, K)) {
      if (sim < THRESHOLD) continue;
      const [a, b] = i < j ? [ids[i], ids[j]] : [ids[j], ids[i]];
      const key = `${a}|${b}`;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);
      edges.push({ src: a, dst: b, weight: Number(sim.toFixed(4)) });
    }
    if (i % 50 === 0) console.log(`  ${i}/${n}`);
  }

  edges.sort((a, b) => b.weight - a.weight);

  const payload = {
    createdAt: new Date().toISOString(),
    model: file.model,
    k: K,
    threshold: THRESHOLD,
    nodeCount: n,
    edgeCount: edges.length,
    edges,
  };
  writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`wrote ${edges.length} edges -> ${OUT_PATH}`);
}

main();
