/**
 * Cross-school relationships for the website: "where else can I study
 * something like this?" — program ↔ program and school ↔ school.
 *
 * Why not plain cosine (the old program_graph.json): every embedded text carries its school's name,
 * location and overview, so raw cosine mostly says "same school" (79% of its
 * edges). Here each program vector has its school's mean vector removed first
 * (schools with < 3 programs: the global mean), which cancels the shared
 * school text and leaves what the program itself is about. Then:
 *   - two programs at different schools are similar if the residual cosine is
 *     ≥ SAME_GROUP_MIN and they share a subject group, or ≥ CROSS_GROUP_MIN;
 *   - two schools are related by a one-to-one matching of their similar
 *     programs; the tier comes from how many pairs match and how much of the
 *     smaller school's program list that covers.
 * Thresholds were calibrated by reading sampled pairs per similarity band.
 *
 * Output (src/data/relations.json) indexes programs by position in `ids`
 * to stay small. Run: npm run build:relations
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { subjectGroupOf } from '../src/lib/taxonomy';

const EMB_PATH = resolve(process.cwd(), 'data/program_embeddings.json');
const DATA_PATH = resolve(process.cwd(), 'src/data/enhanced_german_art_schools.json');
const OUT_PATH = resolve(process.cwd(), 'src/data/relations.json');

const SAME_GROUP_MIN = 0.33;
const CROSS_GROUP_MIN = 0.55;
const PROGRAM_K = 6;
const SCHOOL_K = 10;
const PAIRS_KEPT = 4;

const emb = JSON.parse(readFileSync(EMB_PATH, 'utf8')).embeddings as Record<string, number[]>;
const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));

const ids: string[] = [];
const schoolOf: string[] = [];
const group: string[] = [];
for (const school of Object.values<any>(data.universities)) {
  for (const p of school.programs ?? []) {
    if (!emb[p.program_id]) continue;
    ids.push(p.program_id);
    schoolOf.push(school.id);
    group.push(subjectGroupOf(p.name));
  }
}
const n = ids.length;
const dim = emb[ids[0]].length;

// unit vectors
const V = ids.map((id) => {
  const v = Float64Array.from(emb[id]);
  const norm = Math.hypot(...v) || 1;
  return v.map((x) => x / norm);
});

// remove the shared school component
const members = new Map<string, number[]>();
schoolOf.forEach((s, i) => (members.get(s) ?? members.set(s, []).get(s)!).push(i));
const mean = (rows: number[]) => {
  const m = new Float64Array(dim);
  for (const r of rows) for (let k = 0; k < dim; k++) m[k] += V[r][k] / rows.length;
  return m;
};
const globalMean = mean(ids.map((_, i) => i));
const R = V.map((v) => Float64Array.from(v));
for (const rows of members.values()) {
  const m = rows.length >= 3 ? mean(rows) : globalMean;
  for (const r of rows) {
    for (let k = 0; k < dim; k++) R[r][k] -= m[k];
    let norm = 0;
    for (let k = 0; k < dim; k++) norm += R[r][k] * R[r][k];
    norm = Math.sqrt(norm) || 1;
    for (let k = 0; k < dim; k++) R[r][k] /= norm;
  }
}

const sim = new Float32Array(n * n);
for (let i = 0; i < n; i++) {
  for (let j = i + 1; j < n; j++) {
    let d = 0;
    const a = R[i], b = R[j];
    for (let k = 0; k < dim; k++) d += a[k] * b[k];
    sim[i * n + j] = sim[j * n + i] = d;
  }
}
const S = (i: number, j: number) => sim[i * n + j];
const similar = (i: number, j: number) =>
  schoolOf[i] !== schoolOf[j] &&
  ((group[i] === group[j] && group[i] !== 'Other' && S(i, j) >= SAME_GROUP_MIN) || S(i, j) >= CROSS_GROUP_MIN);

// program → top-K similar programs at other schools
const programs: Array<Array<[number, number]>> = ids.map((_, i) => {
  const hits: Array<[number, number]> = [];
  for (let j = 0; j < n; j++) if (similar(i, j)) hits.push([j, +S(i, j).toFixed(2)]);
  return hits.sort((a, b) => b[1] - a[1]).slice(0, PROGRAM_K);
});

// school ↔ school via greedy one-to-one matching of similar programs
type Relation = { s: string; t: 1 | 2 | 3; p: Array<[number, number]> };
const schoolIds = [...members.keys()];
const schools: Record<string, Relation[]> = Object.fromEntries(schoolIds.map((s) => [s, []]));
for (let x = 0; x < schoolIds.length; x++) {
  for (let y = x + 1; y < schoolIds.length; y++) {
    const A = members.get(schoolIds[x])!, B = members.get(schoolIds[y])!;
    const cands: Array<[number, number, number]> = [];
    for (const a of A) for (const b of B) if (similar(a, b)) cands.push([S(a, b), a, b]);
    cands.sort((p, q) => q[0] - p[0]);
    const usedA = new Set<number>(), usedB = new Set<number>();
    const pairs: Array<[number, number]> = [];
    for (const [, a, b] of cands) {
      if (usedA.has(a) || usedB.has(b)) continue;
      usedA.add(a); usedB.add(b); pairs.push([a, b]);
    }
    if (!pairs.length) continue;
    const coverage = pairs.length / Math.min(A.length, B.length);
    const t: 1 | 2 | 3 =
      pairs.length >= 3 && coverage >= 0.6 ? 3 : (pairs.length >= 2 && coverage >= 0.5) || pairs.length >= 4 ? 2 : 1;
    schools[schoolIds[x]].push({ s: schoolIds[y], t, p: pairs });
    schools[schoolIds[y]].push({ s: schoolIds[x], t, p: pairs.map(([a, b]) => [b, a]) });
  }
}
for (const id of schoolIds) {
  schools[id] = schools[id]
    .sort((a, b) => b.t - a.t || b.p.length - a.p.length)
    .slice(0, SCHOOL_K)
    .map((r) => ({ ...r, total: r.p.length, p: r.p.slice(0, PAIRS_KEPT) }));
}

writeFileSync(
  OUT_PATH,
  JSON.stringify({
    createdAt: new Date().toISOString(),
    method: `school-mean-removed cosine; similar if same subject group & >= ${SAME_GROUP_MIN}, or >= ${CROSS_GROUP_MIN}`,
    ids,
    programs,
    schools,
  }) + '\n'
);

// self-check: known pairs must hold, the old same-school bias must be gone
// any degree variant of `a` similar to any variant of `b`
const anySimilar = (a: string, b: string) => {
  const A = ids.flatMap((id, i) => (id.includes(a) ? [i] : []));
  const B = ids.flatMap((id, i) => (id.includes(b) ? [i] : []));
  if (!A.length || !B.length) throw new Error(`self-check ids not found: ${a} / ${b}`);
  return A.some((x) => B.some((y) => similar(x, y)));
};
const assert = (ok: boolean, msg: string) => { if (!ok) { console.error('FAIL:', msg); process.exit(1); } };
assert(anySimilar('karlsruhe--fine-arts', 'kunstakademie-dusseldorf--fine-arts'), 'Fine Arts Karlsruhe ↔ Düsseldorf should be similar');
assert(!anySimilar('koln--schlagzeug--master', 'saar--kunstlerisches-profil-kammermusik'), 'Schlagzeug ↔ Kammermusik should not be similar');
const filmuni = schools['filmuniversitat-babelsberg-konrad-wolf'].map((r) => r.s);
assert(filmuni.includes('hochschule-fur-fernsehen-und-film-munchen'), 'Filmuni should relate to HFF München');
const linked = programs.filter((h) => h.length > 0).length;
console.log(`programs with cross-school matches: ${linked}/${n}; wrote ${OUT_PATH}`);
