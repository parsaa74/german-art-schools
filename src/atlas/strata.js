// Plate VI, Strata: a space-time cube (after Hägerstrand). Germany today is the top plane; every school
// hangs a root down to its founding year, so depth is time. Drag (or arrow keys) to turn it.
import geo from './germany.json';
import { short, dominant } from './kinship.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const NOW = new Date().getFullYear(), BRK = 1650, D = 1000;
// Same broken scale as the Chronology: 1400–1650 holds two schools, so it gets a short stretch below a gap.
const depth = (y) => (y >= BRK ? ((NOW - y) / (NOW - BRK)) * D : D + 40 + ((BRK - y) / (BRK - 1400)) * 110);
const FRAMES = [[1990, 'Reunification'], [1945, '1945'], [1871, 'Empire'], [1800, ''], [1700, '']];
const TICKS = [2000, 1950, 1900, 1850, 1800, 1750, 1700, 1650, 1400];
const VIEWS = { oblique: [-0.55, 0.62], above: [0, 1.5], side: [0, 0.07] };

// Map geometry, centred. States are absolute "M x,y L x,y … Z" paths.
const P0 = geo.projection, CX = geo.width / 2, CY = geo.height / 2;
const proj = ({ lat, lng }) => [(lng - P0.lng0) * P0.k * P0.scale + P0.pad - CX, (P0.latMax - lat) * P0.scale + P0.pad - CY];
const rings = geo.states.flatMap((s) => s.d.split('M').filter(Boolean).map((r) => r.replace(/Z/g, '').split('L').map((p) => p.split(',').map(Number))));
// Outer border = segments only one state uses (neighbours share exact vertices).
const segCount = new Map();
for (const r of rings) for (let i = 0; i < r.length; i++) { const k = [r[i], r[(i + 1) % r.length]].map(String).sort().join('|'); segCount.set(k, (segCount.get(k) ?? 0) + 1); }
const border = [...segCount].filter(([, n]) => n === 1).map(([k]) => k.split('|').map((p) => { const [x, y] = p.split(',').map(Number); return [x - CX, y - CY]; }));
const pts = rings.flat().map(([x, y]) => [x - CX, y - CY]);
const R = Math.max(...pts.map(([x, y]) => Math.hypot(x, y)));
const BB = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
const centred = rings.map((r) => r.map(([x, y]) => [x - CX, y - CY]));

let cam = { yaw: VIEWS.oblique[0], pitch: VIEWS.oblique[1] }, M = null, intro = true, frame = 0;

function scene() {
  const { roots, cities, W, H, deep, city } = M;
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const narrow = W < 600, s = Math.min((W - (narrow ? 70 : 170)) / (2 * R), (H - 36) / (2 * R * sp + deep * cp)), ox = W / 2 + (narrow ? 22 : 40), oy = 18 + R * sp * s;
  const P = (X, Y, Z) => { const x = X * cy - Y * sy, y = X * sy + Y * cy; return [+(ox + x * s).toFixed(1), +(oy + (y * sp - Z * cp) * s).toFixed(1), y * cp + Z * sp]; };
  const poly = (ps, Z) => ps.map(([X, Y], i) => `${i ? 'L' : 'M'}${P(X, Y, Z).slice(0, 2).join(',')}`).join('') + 'Z';
  const corners = [[BB[0], BB[1]], [BB[2], BB[1]], [BB[2], BB[3]], [BB[0], BB[3]]];
  const left = corners.reduce((a, c) => (P(...c, 0)[0] < P(...a, 0)[0] ? c : a));

  const floor = `<path class="floor" d="${border.map(([a, b]) => `M${P(...a, -deep).slice(0, 2)}L${P(...b, -deep).slice(0, 2)}`).join('')}"/>`;
  // Seen from straight above the time axis collapses to a point, seen from the side the map does: drop what can't be read.
  const timeVisible = cp > 0.2, mapVisible = sp > 0.3;
  const frames = FRAMES.filter(([y]) => depth(y) < deep).map(([y, label]) => { const [lx, ly] = P(...left, -depth(y)); return `<path class="frame" d="${poly(corners, -depth(y))}"/>${label && timeVisible ? `<text class="frame-l" x="${lx + 4}" y="${ly - 3}">${label}</text>` : ''}`; }).join('');
  const [ax, ay] = P(...left, 0), [, by] = P(...left, -deep);
  const axis = !timeVisible ? '' : `<line class="axis" x1="${ax}" y1="${ay}" x2="${ax}" y2="${by}"/>` + TICKS.filter((y) => depth(y) <= deep).map((y) => { const [tx, ty] = P(...left, -depth(y)); return `<line class="axis" x1="${tx - 4}" y1="${ty}" x2="${tx}" y2="${ty}"/><text class="tick-l" x="${tx - 7}" y="${ty + 3.5}">${y}</text>`; }).join('') + `<text class="tick-l" x="${ax - 7}" y="${ay + 3.5}">today</text>`;

  const placed = [], labels = [];
  const lines = roots.map((r) => ({ r, top: P(r.X, r.Y, 0), tip: P(r.X, r.Y, -depth(r.f)), mid: r.re ? P(r.X, r.Y, -depth(r.re)) : null }))
    .sort((a, b) => a.top[2] - b.top[2]).map(({ r, top, tip, mid }) => {
      const sw = (0.9 + Math.sqrt(r.k) * 0.55).toFixed(1), ln = mid
        ? `<line class="ln" x1="${top[0]}" y1="${top[1]}" x2="${mid[0]}" y2="${mid[1]}" stroke-width="${sw}"/><line class="gap" x1="${mid[0]}" y1="${mid[1]}" x2="${tip[0]}" y2="${tip[1]}"/>`
        : `<line class="ln" x1="${top[0]}" y1="${top[1]}" x2="${tip[0]}" y2="${tip[1]}" stroke-width="${sw}"/>`;
      return `<g class="root${r.u.city === city ? ' city' : ''}" style="--fc:var(--c-${r.ink})" data-school-query="${esc(r.u.name)}" data-hover-city="${esc(r.u.city)}" data-tip="${esc(`${r.u.name}, ${r.u.city}: founded ${r.f}${r.re ? `, re-established ${r.re}` : ''}. ${r.k} program${r.k > 1 ? 's' : ''} shown.`)}"><line class="hit" x1="${top[0]}" y1="${top[1]}" x2="${tip[0]}" y2="${tip[1]}"/>${ln}<circle cx="${tip[0]}" cy="${tip[1]}" r="2.6"/></g>`;
    }).join('');
  // Name the selected city's schools, the old ones and the big ones, wherever a label fits.
  // ponytail: greedy label placement, fine for ~90 roots
  for (const r of [...roots].sort((a, b) => (b.u.city === city) - (a.u.city === city) || (b.f < 1800) - (a.f < 1800) || b.k - a.k)) {
    if (labels.length >= 24) break;
    const [x, y] = P(r.X, r.Y, -depth(r.f)), t = `${short(r.u)} ${r.f}`, w = t.length * 5.9, box = [x + 5, y - 7, x + 5 + w, y + 6];
    if (box[2] > W || placed.some((q) => box[0] < q[2] && q[0] < box[2] && box[1] < q[3] && q[1] < box[3])) continue;
    placed.push(box); labels.push(`<text class="rl" x="${x + 5}" y="${y + 3.5}" style="fill:var(--c-${r.ink})">${esc(t)}</text>`);
  }
  const plane = `<g class="plane">${centred.map((r) => `<path d="${poly(r, 0)}"/>`).join('')}</g>`;
  const dots = cities.map((c, i) => { const [x, y] = P(c.X, c.Y, 0); return `<circle class="cdot" cx="${x}" cy="${y}" r="1.8"/>${i < 9 && mapVisible ? `<text class="cl" x="${x + 4}" y="${y - 3}">${esc(c.name)}</text>` : ''}`; }).join('');
  return floor + frames + axis + lines + plane + dots + labels.join('');
}

export function strataView({ base, famOf, city, W }) {
  const sch = new Map();
  for (const n of base) {
    const s = sch.get(n.u.id) ?? sch.set(n.u.id, { u: n.u, k: 0, fam: {} }).get(n.u.id);
    s.k++; s.fam[famOf(n)] = (s.fam[famOf(n)] ?? 0) + 1;
  }
  const roots = [...sch.values()].filter((s) => s.u.stats?.founded).map((s) => {
    const [X, Y] = proj(s.u.coordinates);
    return { ...s, X, Y, f: s.u.stats.founded, re: s.u.stats.re_established, ink: dominant(s.fam) };
  });
  if (!roots.length) return `<p style="padding:20px 14px;color:var(--dim)">No schools match the current filters.</p>`;
  const cities = [...Map.groupBy(roots, (r) => r.u.city)].map(([name, rs]) => ({ name, n: rs.length, X: rs[0].X, Y: rs[0].Y })).sort((a, b) => b.n - a.n);
  M = { roots, cities, W, H: W < 600 ? Math.round(W * 1.35) : Math.max(520, Math.min(860, innerHeight - 150)), deep: depth(Math.min(1700, ...roots.map((r) => r.f))), city };
  if (intro && !matchMedia('(prefers-reduced-motion: reduce)').matches) { intro = false; const [y, p] = VIEWS.oblique; cam.yaw = y - 0.9; requestAnimationFrame(() => tween(y, p, 1400)); }
  const btn = (id, label) => `<button type="button" data-strata-view="${id}">${label}</button>`;
  return `<div class="strata-wrap"><p class="key"><span>Germany today on top; each school hangs a line down to its founding year, so depth is time. Thickness = programs shown, color = main field. Drag to turn it; click a line to list the school's programs.</span><span class="kin-order">View ${btn('oblique', 'oblique')} ${btn('above', 'from above')} ${btn('side', 'from the side')}</span></p>
    <svg class="strata" tabindex="0" width="${W}" height="${M.H}" viewBox="0 0 ${W} ${M.H}" role="img" aria-label="Space-time cube: ${roots.length} schools as lines from the map of Germany down to their founding years">${scene()}</svg></div>`;
}

const redraw = () => { if (frame) return; frame = requestAnimationFrame(() => { frame = 0; const svg = document.querySelector('svg.strata'); if (svg && M) svg.innerHTML = scene(); }); };
const turn = (dy, dp) => { cam.yaw += dy; cam.pitch = Math.min(1.5, Math.max(0.07, cam.pitch + dp)); redraw(); };
function tween(yaw, pitch, ms = 500) {
  const a = { ...cam }, t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - (1 - k) ** 3; cam.yaw = a.yaw + (yaw - a.yaw) * e; cam.pitch = a.pitch + (pitch - a.pitch) * e; redraw(); if (k < 1 && !drag) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

let drag = null, dragged = false;
document.addEventListener('pointerdown', (e) => { if (e.button === 0 && e.target.closest?.('svg.strata')) { drag = { x: e.clientX, y: e.clientY }; dragged = false; } });
addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!dragged && Math.hypot(dx, dy) < 4) return;
  dragged = true; drag = { x: e.clientX, y: e.clientY }; turn(dx * 0.008, dy * 0.006);
});
addEventListener('pointerup', () => { drag = null; });
// A drag that ends on a line must not also count as a click on it.
document.addEventListener('click', (e) => {
  if (dragged && e.target.closest?.('svg.strata')) { e.stopPropagation(); dragged = false; return; }
  const v = e.target.closest?.('[data-strata-view]'); if (v) tween(...VIEWS[v.dataset.strataView]);
}, true);
document.addEventListener('keydown', (e) => {
  if (!e.target.closest?.('svg.strata')) return;
  const k = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08] }[e.key];
  if (k) { e.preventDefault(); turn(...k); }
});
