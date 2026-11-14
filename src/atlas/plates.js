// Plates IV and V. Distribution: one small map per field (where is each discipline taught).
// Chronology: every school as a line from its founding year to today, thickness = programs shown.
import { short, dominant } from './kinship.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function distributionView({ base, groups, famVar, cities, geo, city, filterable }) {
  const byGroup = Map.groupBy(base, (n) => n.group), counts = new Map();
  let max = 1;
  for (const [g, ns] of byGroup) {
    const m = new Map();
    for (const n of ns) m.set(n.u.city, (m.get(n.u.city) ?? 0) + 1);
    counts.set(g, m); max = Math.max(max, ...m.values());
  }
  // One radius scale for all plates so Berlin's Fine Art dot and Detmold's Music dot are comparable.
  const U = geo.width / 175, r = (k) => +((1.6 + 7.5 * Math.sqrt(k / max)) * U).toFixed(1);
  const plates = groups.map((g) => {
    const m = counts.get(g) ?? new Map(), total = byGroup.get(g)?.length ?? 0;
    const here = cities.filter((c) => m.get(c.name)).sort((a, b) => m.get(b.name) - m.get(a.name));
    const dots = here.map((c) => `<circle class="pdot${c.name === city ? ' on' : ''}" data-city="${esc(c.name)}" data-hover-city="${esc(c.name)}" data-tip="${esc(`${c.name}: ${m.get(c.name)} ${g} program${m.get(c.name) > 1 ? 's' : ''}`)}" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r(m.get(c.name))}"/>`).join('');
    const title = filterable.includes(g) ? `<button type="button" data-field="${esc(g)}" title="Show these programs in the index">${esc(g)}</button>` : esc(g);
    return `<figure class="plate${total ? '' : ' empty'}" style="--fc:${famVar(g)}"><figcaption>${title}<span>${total || 'none'}</span></figcaption>
      <svg viewBox="0 0 ${geo.width} ${geo.height}" role="img" aria-label="${esc(`${g}: ${total} programs in ${here.length} cities`)}"><use href="#de-states"/>${dots}</svg>
      <p>${here.slice(0, 3).map((c) => `${esc(c.name)} ${m.get(c.name)}`).join(', ')}${here.length > 3 ? `, ${here.length - 3} more` : ''}</p></figure>`;
  }).join('');
  return `<div class="spread-wrap"><p class="key"><span>Where each field is taught: dot area = programs in that city, on one scale across all plates. Click a dot to mark a city everywhere, or a title to list its programs.</span></p>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><g id="de-states">${geo.states.map((s) => `<path d="${s.d}"/>`).join('')}</g></defs></svg>
    <div class="plates">${plates}</div></div>`;
}

const ERAS = [[1871, 1918, 'German Empire'], [1918, 1933, 'Weimar'], [1933, 1945, 'Nazi era'], [1949, 1990, 'FRG and GDR'], [1990, null, 'Reunified']];

export function chronologyView({ base, famOf, city, W }) {
  const sch = new Map();
  for (const n of base) {
    const s = sch.get(n.u.id) ?? sch.set(n.u.id, { u: n.u, k: 0, fam: {} }).get(n.u.id);
    s.k++; s.fam[famOf(n)] = (s.fam[famOf(n)] ?? 0) + 1;
  }
  const all = [...sch.values()], rows = all.filter((s) => s.u.stats?.founded).sort((a, b) => a.u.stats.founded - b.u.stats.founded || b.k - a.k);
  const undated = all.filter((s) => !s.u.stats?.founded);
  if (!rows.length) return `<p style="padding:20px 14px;color:var(--dim)">No schools match the current filters.</p>`;

  // Broken axis: two medieval universities would otherwise squeeze 1650–today into the right half.
  const now = new Date().getFullYear(), BRK = 1650, start = Math.min(BRK, Math.floor(rows[0].u.stats.founded / 50) * 50);
  const gutter = Math.ceil(Math.max(...rows.map((s) => short(s.u).length + 5)) * 6.2 + 8), xb = gutter + (start < BRK ? 44 : 0), x1 = W - 6;
  const x = (y) => +(y < BRK ? gutter + ((y - start) / (BRK - start)) * 34 : xb + ((y - BRK) / (now - BRK)) * (x1 - xb)).toFixed(1);
  const rh = 11, top = 46, H = top + rows.length * rh + 6;

  const eras = ERAS.map(([a, b, label], i) => `<rect class="era" x="${x(a)}" y="0" width="${x(b ?? now) - x(a)}" height="${H}"/><text class="era-l" x="${x(a) + 3}" y="${i % 2 ? 22 : 11}">${label}</text>`).join('');
  const ticks = [...(start < BRK ? [start] : []), ...Array.from({ length: Math.floor((now - BRK) / 50) + 1 }, (_, i) => BRK + i * 50)]
    .map((y) => `<line class="tick" x1="${x(y)}" x2="${x(y)}" y1="${top - 8}" y2="${H}"/><text class="yr-l" x="${x(y) + 2}" y="${top - 2}">${y}</text>`).join('')
    + (start < BRK ? `<text class="brk" x="${(gutter + 34 + xb) / 2}" y="${top - 2}" text-anchor="middle">≈</text>` : '');

  const lines = rows.map((s, i) => {
    const y = top + i * rh + rh / 2, f = s.u.stats.founded, re = s.u.stats.re_established, sw = Math.min(rh - 3, 1.2 + Math.sqrt(s.k) * 1.05).toFixed(1);
    const tip = `${s.u.name}, ${s.u.city}: founded ${f}${re ? `, re-established ${re}` : ''}. ${s.k} program${s.k > 1 ? 's' : ''} shown.`;
    const life = re ? `<line class="gap" x1="${x(f)}" x2="${x(re)}" y1="${y}" y2="${y}"/><line x1="${x(re)}" x2="${x1}" y1="${y}" y2="${y}" stroke-width="${sw}"/>` : `<line x1="${x(f)}" x2="${x1}" y1="${y}" y2="${y}" stroke-width="${sw}"/>`;
    return `<g class="life${s.u.city === city ? ' city' : ''}" style="--fc:var(--c-${dominant(s.fam)})" data-school-query="${esc(s.u.name)}" data-hover-city="${esc(s.u.city)}" data-tip="${esc(tip)}"><rect class="hit" x="0" y="${y - rh / 2}" width="${W}" height="${rh}"/><text x="${x(f) - 5}" y="${y}">${esc(short(s.u))}<tspan class="yr" dx="4">${f}</tspan></text>${life}</g>`;
  }).join('');

  return `<div class="chron-wrap"><p class="key"><span>Each line runs from a school's founding to today; thickness = programs shown, color = its main field. Dotted: closed, then re-established. Click a school to list its programs.</span>${undated.length ? `<span>No founding year recorded: ${undated.map((s) => esc(short(s.u))).join(', ')}</span>` : ''}</p>
    <svg class="chron" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${eras}${ticks}${lines}</svg></div>`;
}
