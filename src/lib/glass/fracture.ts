/**
 * Shattered-window fracture.
 *
 * Generates ONE impact-crack Voronoi pattern and returns `count` shard cells cut
 * from it. Two consumers:
 *   - buildFractureGeometries: normalized (radius ≈ 1) shards for scattered nodes
 *   - buildFractureWindow: shards PLUS their pane position/size, so they can be
 *     reassembled into a single glass wall facing the user
 *
 * Deterministic for a given (count, seed, depth, bevel) and memoized.
 */

import * as THREE from 'three';
import { Delaunay } from 'd3-delaunay';

const PANE_W = 4.4;
const PANE_H = 5.4;

export interface FractureCell {
  geometry: THREE.BufferGeometry; // normalized so its radius ≈ 1
  poly: [number, number][]; // normalized outline (radius ≈ 1, centered on centroid)
  cx: number; // centroid x in centered pane coords
  cy: number; // centroid y
  r: number;  // cell radius (half-size) in pane coords
}

/** A second-level fracture facet cut INSIDE a parent cell (one per program). */
export interface FacetCell {
  poly: [number, number][]; // outline in the PARENT's normalized space
  cx: number; // facet centroid in parent-normalized coords
  cy: number;
  r: number;  // facet radius in parent-normalized coords
}

export interface FractureWindow {
  paneW: number;
  paneH: number;
  cells: FractureCell[];
}

export interface FractureOptions {
  seed?: number;
  depth?: number;
  bevel?: number;
}

const cellCache = new Map<string, FractureCell[]>();

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildCells(count: number, seed: number, depth: number, bevel: number): FractureCell[] {
  const key = `${count}|${seed}|${depth}|${bevel}`;
  const cached = cellCache.get(key);
  if (cached) return cached;

  const rnd = mulberry32(seed);

  // Impact-clustered seed points → small shards near the break, big at the edges.
  const impact: [number, number] = [(rnd() - 0.5) * PANE_W * 0.45, (rnd() - 0.5) * PANE_H * 0.45];
  const pts: [number, number][] = [impact.slice() as [number, number]];
  const target = Math.max(count + 6, Math.ceil(count * 1.3));
  for (let i = 0; i < target; i++) {
    let x: number, y: number;
    if (rnd() < 0.55) {
      const r = Math.pow(rnd(), 2) * Math.min(PANE_W, PANE_H) * 0.65;
      const a = rnd() * Math.PI * 2;
      x = impact[0] + Math.cos(a) * r;
      y = impact[1] + Math.sin(a) * r;
    } else {
      x = (rnd() - 0.5) * PANE_W;
      y = (rnd() - 0.5) * PANE_H;
    }
    x = Math.max(-PANE_W / 2 + 0.02, Math.min(PANE_W / 2 - 0.02, x));
    y = Math.max(-PANE_H / 2 + 0.02, Math.min(PANE_H / 2 - 0.02, y));
    pts.push([x, y]);
  }

  const delaunay = Delaunay.from(pts);
  const voronoi = delaunay.voronoi([-PANE_W / 2, -PANE_H / 2, PANE_W / 2, PANE_H / 2]);

  const cells: FractureCell[] = [];
  for (let i = 0; i < pts.length && cells.length < count; i++) {
    const poly = voronoi.cellPolygon(i) as number[][] | null;
    if (!poly || poly.length < 4) continue;
    const pp = poly.slice(0, -1); // drop duplicate closing vertex

    let cx = 0, cy = 0;
    pp.forEach((p) => { cx += p[0]; cy += p[1]; });
    cx /= pp.length; cy /= pp.length;
    let cellR = 0;
    pp.forEach((p) => { cellR = Math.max(cellR, Math.hypot(p[0] - cx, p[1] - cy)); });
    if (cellR < 1e-3) continue;
    const inv = 1 / cellR; // normalize so each shard has radius ≈ 1

    const normPoly: [number, number][] = pp.map((p) => [(p[0] - cx) * inv, (p[1] - cy) * inv]);
    const shape = new THREE.Shape();
    normPoly.forEach(([x, y], k) => {
      if (k === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    });
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0.001, // bevel 0 → flat edges that tile seamlessly
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 1,
      steps: 1,
    });
    geo.translate(0, 0, -depth / 2);
    geo.computeVertexNormals();

    cells.push({ geometry: geo, poly: normPoly, cx, cy, r: cellR });
  }

  while (cells.length < count && cells.length > 0) {
    cells.push(cells[cells.length % cells.length]);
  }

  cellCache.set(key, cells);
  return cells;
}

/** Normalized shard geometries only (radius ≈ 1), for scattered/3D node use. */
export function buildFractureGeometries(count: number, opts: FractureOptions = {}): THREE.BufferGeometry[] {
  const cells = buildCells(count, opts.seed ?? 7, opts.depth ?? 0.32, opts.bevel ?? 0.06);
  return cells.map((c) => c.geometry);
}

/** Shards + their pane layout, to reassemble a single glass wall facing the user. */
export function buildFractureWindow(count: number, opts: FractureOptions = {}): FractureWindow {
  const cells = buildCells(count, opts.seed ?? 7, opts.depth ?? 0.18, opts.bevel ?? 0.035);
  return { paneW: PANE_W, paneH: PANE_H, cells };
}

// ---------------------------------------------------------------------------
// Second-level fracture: cut a parent cell into program facets.
// ---------------------------------------------------------------------------

type Pt = [number, number];

function signedArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function lineIntersect(p: Pt, q: Pt, a: Pt, b: Pt): Pt {
  const a1 = q[1] - p[1], b1 = p[0] - q[0], c1 = a1 * p[0] + b1 * p[1];
  const a2 = b[1] - a[1], b2 = a[0] - b[0], c2 = a2 * a[0] + b2 * a[1];
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-12) return [q[0], q[1]];
  return [(b2 * c1 - b1 * c2) / det, (a1 * c2 - a2 * c1) / det];
}

/** Sutherland–Hodgman: clip `subject` against a CONVEX `clip` polygon (Voronoi cells are convex). */
function clipPolygon(subject: Pt[], clip: Pt[]): Pt[] {
  const sign = signedArea(clip) >= 0 ? 1 : -1;
  let output = subject;
  for (let i = 0; i < clip.length && output.length > 0; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const ex = b[0] - a[0], ey = b[1] - a[1];
    const inside = (p: Pt) => sign * (ex * (p[1] - a[1]) - ey * (p[0] - a[0])) >= -1e-9;
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const cur = input[j];
      const prev = input[(j + input.length - 1) % input.length];
      const curIn = inside(cur), prevIn = inside(prev);
      if (curIn) {
        if (!prevIn) output.push(lineIntersect(prev, cur, a, b));
        output.push(cur);
      } else if (prevIn) {
        output.push(lineIntersect(prev, cur, a, b));
      }
    }
  }
  return output;
}

function pointInConvex(p: Pt, poly: Pt[], sign: number): boolean {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    if (sign * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) < 0) return false;
  }
  return true;
}

function facetFromPoly(poly: Pt[]): FacetCell | null {
  if (poly.length < 3) return null;
  let cx = 0, cy = 0;
  poly.forEach((p) => { cx += p[0]; cy += p[1]; });
  cx /= poly.length; cy /= poly.length;
  let r = 0;
  poly.forEach((p) => { r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cy)); });
  if (r < 1e-4) return null;
  return { poly, cx, cy, r };
}

/**
 * Cut `count` facets inside a parent cell outline (parent-normalized coords).
 * Deterministic for a given (poly, count, seed). Returns [] for count <= 0,
 * the whole parent as a single facet for count === 1.
 */
export function subdivideCell(parentPoly: Pt[], count: number, seed: number): FacetCell[] {
  if (count <= 0 || parentPoly.length < 3) return [];
  const whole = facetFromPoly(parentPoly);
  if (!whole) return [];
  if (count === 1) return [whole];

  const rnd = mulberry32(seed);
  const sign = signedArea(parentPoly) >= 0 ? 1 : -1;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  parentPoly.forEach((p) => {
    x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]);
    x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
  });

  const pts: Pt[] = [];
  let guard = 0;
  while (pts.length < count && guard++ < count * 80) {
    const p: Pt = [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)];
    if (pointInConvex(p, parentPoly, sign)) pts.push(p);
  }
  if (pts.length < 2) return [whole];

  const voronoi = Delaunay.from(pts).voronoi([x0 - 0.1, y0 - 0.1, x1 + 0.1, y1 + 0.1]);
  const facets: FacetCell[] = [];
  for (let i = 0; i < pts.length; i++) {
    const cell = voronoi.cellPolygon(i) as Pt[] | null;
    if (!cell || cell.length < 4) continue;
    const clipped = clipPolygon(cell.slice(0, -1), parentPoly);
    const f = facetFromPoly(clipped);
    if (f) facets.push(f);
  }
  return facets.length > 0 ? facets : [whole];
}

/** Extruded glass geometry for one facet, centered on the facet's own centroid. */
export function buildFacetGeometry(facet: FacetCell, depth: number, bevel: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  facet.poly.forEach(([x, y], k) => {
    if (k === 0) shape.moveTo(x - facet.cx, y - facet.cy);
    else shape.lineTo(x - facet.cx, y - facet.cy);
  });
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0.001,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    steps: 1,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}
