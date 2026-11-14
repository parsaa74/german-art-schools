// Unified reference sheet: left cartographic locator (map + alphabetical gazetteer),
// right tabular index whose column headers are the filters and whose rightmost column is the 12-month graphic score.
import { programs, schools, nodeById, related, emptyFilters, emptyExtras, classify } from '../focus/focus-model.js';
import { fold, SUBJECT_GROUPS, subjectGroupOf, DEGREE_GROUPS, LANGUAGES, degreeAbbrev, typeLabel, feeLine } from '../lib/taxonomy.ts';
import { parseDeadlineDate } from '../utils/deadlineUtils.ts';
import { programLinks } from '../lib/programLinks.ts';
import geo from './germany.json';
import { kinshipView, cross } from './kinship.js';
import { distributionView, chronologyView } from './plates.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FIELDS = [...SUBJECT_GROUPS, 'Other'];
const CITY = { 'Köln': 'Cologne', 'Nürnberg': 'Nuremberg', 'Frankfurt': 'Frankfurt am Main', 'Multiple Cities': 'Munich' };
for (const u of schools) u.city = CITY[u.city] ?? u.city;

// Map each of the 16 subject groups to one of 6 pigment families (--c-art, --c-design, --c-space, --c-film, --c-music, --c-theory)
const FAMILY = {
  'Fine Art': 'art',
  'Photography': 'art',
  'Media Art & Sound': 'art',
  'Communication & Graphic Design': 'design',
  'Interaction & Digital Media': 'design',
  'Product & Industrial Design': 'design',
  'Fashion, Textile & Jewellery': 'design',
  'Architecture, Interior & Stage Design': 'space',
  'Theatre, Acting & Dance': 'space',
  'Film & Television': 'film',
  'Animation, Games & VFX': 'film',
  'Music Performance': 'music',
  'Composition, Conducting & Theory': 'music',
  'Church Music': 'music',
  'Art & Music Education': 'theory',
  'Theory, Curating & Management': 'theory',
  'Other': 'theory',
};
const famVar = (g) => `var(--c-${FAMILY[g] ?? 'art'})`;

for (const n of programs) {
  n.group = subjectGroupOf(n.name);
  n.hay = fold(`${n.name} ${n.u.name} ${n.u.city} ${n.group} ${n.p.degree ?? ''} ${degreeAbbrev(n.p.degree)}`);
}

// ---------- dates & 12-month axis ----------
const today = new Date(); today.setHours(0, 0, 0, 0);
const t0 = new Date(today.getFullYear(), today.getMonth(), 1);
const t1 = new Date(t0.getFullYear() + 1, t0.getMonth(), 1);
const months = Array.from({ length: 12 }, (_, i) => new Date(t0.getFullYear(), t0.getMonth() + i, 1));
const frac = (d) => (Math.min(Math.max(d, t0), t1) - t0) / (t1 - t0);
const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function nextWindow(p) {
  let best = null;
  for (const w of Object.values(p.applicationDeadlines ?? {})) {
    if (!w || typeof w !== 'object' || !w.end) continue;
    let end, start = null;
    try { end = parseDeadlineDate(w.end); } catch { continue; }
    if (end < today) continue;
    if (w.start) try { start = parseDeadlineDate(w.start, end.getFullYear()); if (start > end) start.setFullYear(start.getFullYear() - 1); } catch { start = null; }
    if (!best || end < best.end) best = { start, end, open: !start || start <= today };
  }
  return best;
}
const windowCache = new Map(programs.map((n) => [n.id, nextWindow(n.p)]));
function whenText(w) {
  if (!w) return 'Undated';
  if (w.open) return w.start ? `Open until ${fmt(w.end)}` : `Closes ${fmt(w.end)}`;
  return `Opens ${fmt(w.start)}`;
}

// Shared 220px inline timeline geometry for the rightmost table column
const BAR_W = 220, xNow = +(frac(today) * BAR_W).toFixed(1);
const monthGridD = months.map((m) => `M${+(frac(m) * BAR_W).toFixed(1)} 0V16`).join('');
$('axis-head').innerHTML = `<svg viewBox="0 0 ${BAR_W} 34" preserveAspectRatio="none">${months.map((m) => {
  const x = +(frac(m) * BAR_W).toFixed(1);
  return `<line class="mgrid" x1="${x}" x2="${x}" y1="0" y2="34"/><text class="mlbl" x="${x + 2.5}" y="21">${m.toLocaleDateString('en-GB', { month: 'narrow' })}</text>`;
}).join('')}<line class="now" x1="${xNow}" x2="${xNow}" y1="0" y2="34"/></svg>`;

function rowBar(w, st) {
  let mark = '';
  if (w && w.end >= t0 && (w.start ?? w.end) < t1) {
    const a = +(frac(w.start ?? w.end) * BAR_W).toFixed(1), b = +(frac(w.end) * BAR_W).toFixed(1);
    const cls = `stroke${w.open && w.start ? ' open' : ''}${st === 'unknown' ? ' unknown' : ''}`;
    mark = w.start
      ? `<line class="${cls}" x1="${a}" x2="${Math.max(b, a + 2)}" y1="7" y2="7"/>`
      : `<line class="${cls}" x1="${b}" x2="${b}" y1="2.5" y2="11.5"/>`;
  }
  return `<svg viewBox="0 0 ${BAR_W} 14" preserveAspectRatio="none" aria-hidden="true"><path class="mgrid" d="${monthGridD}"/><line class="now" x1="${xNow}" x2="${xNow}" y1="0" y2="14"/>${mark}</svg>`;
}

// ---------- state & filtering ----------
let filters = emptyFilters(), states = classify(filters, emptyExtras());
let city = null, statusFilter = '', query = '', openId = null;
let view = 'index', kinOrder = 'kinship', kinPin = null; // view: index | score | kin | spread | chron

const THEMES = [
  { id: 'atlas', label: 'Atlas' },
  { id: 'aicher', label: 'Aicher' },
  { id: 'plakat', label: 'Plakat' },
];
let themeIdx = Math.max(0, THEMES.findIndex((t) => t.id === new URLSearchParams(location.search).get('palette')));
function applyTheme() {
  const t = THEMES[themeIdx];
  if (t.id === 'atlas') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t.id);
  $('theme-btn').textContent = `Palette: ${t.label}`;
}
applyTheme();
$('theme-btn').addEventListener('click', () => {
  themeIdx = (themeIdx + 1) % THEMES.length;
  applyTheme();
});

function matches(n, { ignoreCity = false, st = states } = {}) {
  if (st.get(n.id).state === 'outside') return false;
  if (!ignoreCity && city && n.u.city !== city) return false;
  if (statusFilter) {
    const w = windowCache.get(n.id);
    if (statusFilter === 'open' && !(w?.open && w.start)) return false;
    if (statusFilter === 'dated' && !w) return false;
  }
  if (query) {
    const words = fold(query).split(/\s+/).filter(Boolean);
    if (!words.every((w) => n.hay.includes(w))) return false;
  }
  return true;
}
const shown = () => programs.filter((n) => matches(n));
const hasActiveFilters = () => Boolean(filters.program || filters.degree || filters.language || city || statusFilter || query);

// ---------- geography (left pane: map + gazetteer) ----------
const P = geo.projection;
const proj = ({ lat, lng }) => [(lng - P.lng0) * P.k * P.scale + P.pad, (P.latMax - lat) * P.scale + P.pad];
const cities = [...Map.groupBy(schools, (u) => u.city)].map(([name, us]) => {
  const xy = us.map((u) => proj(u.coordinates));
  return { name, schools: us, x: xy.reduce((t, q) => t + q[0], 0) / xy.length, y: xy.reduce((t, q) => t + q[1], 0) / xy.length };
}).sort((a, b) => a.name.localeCompare(b.name));

$('map').innerHTML = `<svg viewBox="0 0 ${geo.width} ${geo.height}" role="img" aria-label="Map of Germany with cities that have art schools">${geo.states.map((s, i) => `<path class="state s${i % 4}" d="${s.d}" vector-effect="non-scaling-stroke"><title>${esc(s.name)}</title></path>`).join('')}<g id="cities"></g></svg>`;

function renderGeo() {
  const base = programs.filter((n) => matches(n, { ignoreCity: true }));
  const counts = new Map(cities.map((c) => [c.name, 0]));
  for (const n of base) counts.set(n.u.city, (counts.get(n.u.city) ?? 0) + 1);

  const svg = $('map').querySelector('svg'), box = svg.getBoundingClientRect();
  const s = Math.min(box.width / geo.width, box.height / geo.height) || 0.24;
  const radius = (c) => (counts.get(c.name) ? 2.5 + Math.sqrt(counts.get(c.name)) * 1.15 : 2) / s, fs = 10.5 / s;
  const dots = cities.map((c) => ({ k: counts.get(c.name), x0: c.x - radius(c), x1: c.x + radius(c), y0: c.y - radius(c), y1: c.y + radius(c) }));
  const labels = [], over = (b, q) => b.x0 < q.x1 && q.x0 < b.x1 && b.y0 < q.y1 && q.y0 < b.y1;
  const order = [...cities].sort((a, b) => (b.name === city) - (a.name === city) || counts.get(b.name) - counts.get(a.name));
  const text = order.map((c) => {
    const k = counts.get(c.name); if (!k && c.name !== city) return '';
    const r = radius(c), w = (c.name.length * 5.8 + 4) / s, gap = 2.5 / s, y0 = c.y - fs * .55, y1 = c.y + fs * .55, off = r + fs * .75;
    const side = [{ x0: c.x + r + gap, x1: c.x + r + gap + w, y0, y1, anchor: 'start', dy: 0 }, { x0: c.x - r - gap - w, x1: c.x - r - gap, y0, y1, anchor: 'end', dy: 0 },
      ...[-1, 1].map((d) => ({ x0: c.x - w / 2, x1: c.x + w / 2, y0: y0 + d * off, y1: y1 + d * off, anchor: 'middle', dy: d * off }))]
      .find((b) => b.x0 >= 0 && b.x1 <= geo.width && !labels.some((q) => over(b, q)) && !dots.some((q) => q.k >= k / 3 && over(b, q)));
    if (!side) return '';
    labels.push(side);
    return `<text data-city="${esc(c.name)}" class="${c.name === city ? 'on' : ''}" x="${side.anchor === 'start' ? side.x0 : side.anchor === 'end' ? side.x1 : c.x}" y="${c.y + side.dy + 3.5 / s}" text-anchor="${side.anchor}" style="font-size:${fs}px;stroke-width:${3.2 / s}px">${esc(c.name)}</text>`;
  });
  const marks = order.map((c) => {
    const k = counts.get(c.name);
    return `<g class="city${k ? '' : ' empty'}${c.name === city ? ' on' : ''}" data-city="${esc(c.name)}" tabindex="0" role="button" aria-label="${esc(`${c.name}: ${k} programs`)}"><circle cx="${c.x}" cy="${c.y}" r="${radius(c)}"/><title>${esc(`${c.name}, ${k} programs`)}</title></g>`;
  });
  $('cities').innerHTML = marks.reverse().join('') + `<g class="labels">${text.join('')}</g>`;

  const activeCities = cities.filter((c) => counts.get(c.name) || c.name === city);
  $('gazetteer').innerHTML = `<ul class="cities">${activeCities.map((c, i) => `<li${i && fold(c.name)[0] !== fold(activeCities[i - 1].name)[0] ? ' class="letter"' : ''}><button type="button" class="${c.name === city ? 'on' : ''}" data-city="${esc(c.name)}" title="${esc(c.name)}"><span class="cname">${esc(c.name)}</span><span class="ccount">${counts.get(c.name)}</span></button></li>`).join('')}</ul>`;
}

// ---------- inline program dossier ----------
function renderDossier(n) {
  const { p, u } = n, w = windowCache.get(n.id), d = p.details ?? {};
  const windows = Object.entries(p.applicationDeadlines ?? {}).filter(([, v]) => v && typeof v === 'object')
    .map(([sem, v]) => `<p>${esc(sem[0].toUpperCase() + sem.slice(1))}: ${esc(v.start || 'opening not published')} – ${esc(v.end || 'closing not published')}</p>`).join('');
  const fees = [...(p.fees ?? []), ...(u.fees ?? [])].map((f) => `<p>${esc(feeLine(f))}</p>`).join('') +
    (u.nonEuTuition ? `<p>Non-EU tuition: ${esc(u.nonEuTuition.perSemester ? `${u.nonEuTuition.perSemester} per semester` : 'charged, see school')}</p>` : '');
  const links = programLinks(d, u.website).map((l) => /^https?:/.test(l.url) ? `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>` : '').join('');
  const near = related(n.id).filter((e) => e.kind === 'similarity').sort((a, b) => b.weight - a.weight).slice(0, 6).map((e) => nodeById.get(e.id)).filter(Boolean);
  const spec = [
    ['Status', `<span class="${w?.open && w.start ? 'open' : ''}">${esc(whenText(w))}</span>${windows}`],
    ['Portfolio', d.portfolioRequired == null ? '' : d.portfolioRequired ? 'Required' : 'Not required'],
    ['School', `${esc(u.name)} (${esc(typeLabel(u.type))})`],
    ['Location', `<button type="button" data-city="${esc(u.city)}" style="text-decoration:underline">${esc(u.city)}${u.state && u.state !== u.city ? `, ${esc(u.state)}` : ''}</button>`],
  ].filter(([, v]) => v);
  const facts = [
    ['Degree', esc(p.degree || 'Not specified')],
    ['Language', esc(p.language || 'Not confirmed')],
    ['Duration', esc(p.duration)],
    ['Fees', fees || 'Not published'],
  ].filter(([, v]) => v);

  return `<div class="dossier" style="--fc:${famVar(n.group)}" role="region" aria-label="${esc(n.name)} details">
    <div><h3>Admission &amp; links</h3><dl>${spec.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>${links ? `<div class="links">${links}</div>` : ''}</div>
    <div><h3>Program &amp; costs</h3><dl>${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>${p.description ? `<p style="margin-top:6px">${esc(p.description)}</p>` : ''}</div>
    <div><h3>Related at other schools</h3>${near.length ? `<ul class="rel">${near.map((m) => `<li><button type="button" data-jump-id="${esc(m.id)}">${esc(m.name)}</button> <span>— ${esc(m.u.name)}, ${esc(m.u.city)} (${esc(degreeAbbrev(m.p.degree) || 'n/a')})</span></li>`).join('')}</ul>` : '<p>None recorded.</p>'}</div>
  </div>`;
}

// ---------- main ledger (rows or full-width score) ----------
function rowHTML(n) {
  const w = windowCache.get(n.id), st = states.get(n.id).state, exp = openId === n.id;
  return `<li><button type="button" class="row ${st}" data-id="${esc(n.id)}" data-hover-city="${esc(n.u.city)}" aria-expanded="${exp}">` +
    `<span class="name">${esc(n.name)}</span>` +
    `<span>${esc(`${n.u.name}, ${n.u.city}`)}</span>` +
    `<span class="deg">${esc(degreeAbbrev(n.p.degree))}</span>` +
    `<span>${esc(n.p.language)}</span>` +
    `<span class="when${w?.open && w.start ? ' open' : ''}">${esc(whenText(w))}</span>` +
    `<span class="bar">${rowBar(w, st)}</span>` +
    `</button>${exp ? renderDossier(n) : ''}</li>`;
}

function renderScoreOnly(ns) {
  const W = $('body').clientWidth - 28 || 860, narrow = W < 620, gutter = narrow ? 0 : 210, lane = 4.5;
  const x = (d) => gutter + frac(d) * (W - gutter - 6);
  let y = 26; const parts = [];
  for (const g of FIELDS) {
    const gns = ns.filter((n) => n.group === g); if (!gns.length) continue;
    const items = gns.map((n) => ({ n, w: windowCache.get(n.id) })).filter((i) => i.w && i.w.end >= t0 && (i.w.start ?? i.w.end) < t1)
      .map((i) => ({ ...i, a: x(i.w.start ?? i.w.end), b: x(i.w.end) })).sort((p, q) => p.a - q.a || p.b - q.b);
    const ends = [];
    for (const i of items) { let l = ends.findIndex((e) => e < i.a - 3); if (l < 0) l = ends.push(0) - 1; ends[l] = i.b; i.lane = l; }
    const top = y + (narrow ? 20 : 6), h = Math.max(ends.length, 3) * lane + 8, undated = gns.length - items.length;
    parts.push(`<g class="stave" style="--fc:${famVar(g)}"><text x="0" y="${narrow ? y + 11 : top + 10}">${esc(g)}</text>${undated ? `<text class="undated" x="${narrow ? W - 6 : 0}" y="${narrow ? y + 11 : top + 23}" ${narrow ? 'text-anchor="end"' : ''}>${undated} undated</text>` : ''}<line class="base" x1="${gutter}" x2="${W - 6}" y1="${top + h}" y2="${top + h}"/>` +
      items.map((i) => {
        const yy = top + 4 + i.lane * lane, cls = `stroke${i.w.open && i.w.start ? ' open' : ''}${states.get(i.n.id).state === 'unknown' ? ' unknown' : ''}`;
        return i.w.start
          ? `<line class="${cls}" data-id="${esc(i.n.id)}" x1="${i.a}" x2="${Math.max(i.b, i.a + 2)}" y1="${yy}" y2="${yy}"/>`
          : `<line class="${cls}" data-id="${esc(i.n.id)}" x1="${i.b}" x2="${i.b}" y1="${yy - 2}" y2="${yy + 2}"/>`;
      }).join('') + '</g>');
    y = top + h + 14;
  }
  const axis = `<g class="axis">${months.map((m) => `<line class="mgrid" x1="${x(m)}" x2="${x(m)}" y1="16" y2="${y}"/><text class="mlbl" x="${x(m) + 3}" y="11">${m.toLocaleDateString('en-GB', { month: narrow ? 'narrow' : 'short' })}${m.getMonth() === 0 || m === months[0] ? ' ' + String(m.getFullYear()).slice(2) : ''}</text>`).join('')}</g>`;
  const now = `<g class="today"><line class="now" x1="${x(today)}" x2="${x(today)}" y1="16" y2="${y}"/><text class="now-lbl" x="${x(today) + 3}" y="24">today</text></g>`;
  const openCount = ns.filter((n) => { const w = windowCache.get(n.id); return w?.open && w.start; }).length;
  const opened = openId ? nodeById.get(openId) : null;
  $('body').innerHTML = `${opened ? renderDossier(opened) : ''}<div class="score-wrap"><p class="key"><span><i></i>application window (colored by field)</span><span><i class="tick"></i>deadline only</span><span><i class="open"></i>open today (${openCount}) — click any stroke to unfold program details</span></p><svg viewBox="0 0 ${W} ${y}" height="${y}">${axis}${now}${parts.join('')}</svg></div>`;
}

// Plates: contents list under the masthead (bottom bar on mobile) + a running title on the page itself.
const PLATES = [
  ['index', 'I', 'Index', 'every program', 'every program, by field'],
  ['score', 'II', 'Score', 'application dates', '12-month application calendar'],
  ['kin', 'III', 'Kinship', 'related programs', 'schools connected by related programs'],
  ['spread', 'IV', 'Distribution', 'fields on the map', 'where each field is taught'],
  ['chron', 'V', 'Chronology', 'founding years', 'founding years, 1402 to today'],
];
$('toc').innerHTML = PLATES.map(([id, num, name, desc]) => `<button type="button" data-plate="${id}" aria-pressed="${id === 'index'}"><b>${num}</b><span class="t">${name}</span><span class="d">${desc}</span></button>`).join('');
function renderLedger() {
  drawLedger();
  const [, num, name, , sub] = PLATES.find((p) => p[0] === view);
  $('body').insertAdjacentHTML('afterbegin', `<h2 class="plate-title"><b>${num}</b>${name}<span>${sub}</span></h2>`);
}

function drawLedger() {
  const ns = shown();
  const schoolCount = new Set(ns.map((n) => n.u.id)).size;
  $('count').innerHTML = `${ns.length} programs, ${schoolCount} schools` + (hasActiveFilters() ? `<button type="button" id="reset">Reset</button>` : '');

  for (const sel of form.querySelectorAll('select')) sel.classList.toggle('active', Boolean(sel.value));
  if (view === 'score') { renderScoreOnly(ns); return; }
  // Plates ignore the city filter (the city is highlighted instead); Distribution also ignores the field filter.
  const W = $('body').clientWidth - 28 || 860, famOf = (n) => FAMILY[n.group] ?? 'art';
  const anyCity = programs.filter((n) => matches(n, { ignoreCity: true }));
  if (view === 'kin') { $('body').innerHTML = kinshipView(anyCity, { W, famOf, order: kinOrder, pin: kinPin, city }); return; }
  if (view === 'chron') { $('body').innerHTML = chronologyView({ base: anyCity, famOf, city, W }); return; }
  if (view === 'spread') {
    const st = filters.program ? classify({ ...filters, program: null }, emptyExtras()) : states;
    $('body').innerHTML = distributionView({ base: programs.filter((n) => matches(n, { ignoreCity: true, st })), groups: FIELDS, famVar, cities, geo, city, filterable: SUBJECT_GROUPS });
    return;
  }

  const groups = FIELDS.map((g) => [g, ns.filter((n) => n.group === g).sort((a, b) => a.name.localeCompare(b.name) || a.u.name.localeCompare(b.u.name))]).filter(([, list]) => list.length);
  if (!groups.length) {
    $('body').innerHTML = `<p style="padding:20px 14px;color:var(--dim)">No programs match the current filters.</p>`;
    return;
  }
  $('body').innerHTML = groups.map(([g, list]) => {
    const openInField = list.filter((n) => { const w = windowCache.get(n.id); return w?.open && w.start; }).length;
    return `<section class="field" style="--fc:${famVar(g)}"><div class="field-head"><h2>${esc(g)}<span>${list.length}</span></h2><span class="field-meta">${openInField ? `${openInField} open now` : ''}</span><span class="field-axis">${rowBar(null, 'inside')}</span></div><ul class="rows">${list.map(rowHTML).join('')}</ul></section>`;
  }).join('');
}

function renderAll() { renderGeo(); renderLedger(); }

// ---------- controls & events ----------
const opts = (all, list) => `<option value="">${all}</option>` + list.map((v) => `<option value="${esc(v)}">${esc(v === 'English' ? 'English / bilingual' : v)}</option>`).join('');
const form = $('filters');
form.program.innerHTML = opts('All fields', SUBJECT_GROUPS);
form.city.innerHTML = opts(`All ${cities.length} cities`, cities.map((c) => c.name));
form.degree.innerHTML = opts('Degree', DEGREE_GROUPS);
form.language.innerHTML = opts('Language', LANGUAGES);

form.addEventListener('submit', (e) => e.preventDefault());
form.addEventListener('change', () => {
  filters = { ...emptyFilters(), program: form.program.value || null, degree: form.degree.value || null, language: form.language.value || null };
  city = form.city.value || null;
  statusFilter = form.status.value || '';
  states = classify(filters, emptyExtras());
  renderAll();
});
$('find').addEventListener('input', (e) => { query = e.target.value.trim(); renderAll(); });

function setView(next) {
  view = next;
  document.body.dataset.view = view;
  for (const b of document.querySelectorAll('[data-plate]')) b.setAttribute('aria-pressed', String(b.dataset.plate === view));
  renderLedger();
  if (scrollY > $('body').offsetTop) scrollTo(0, 0);
}

$('map-toggle').addEventListener('click', () => {
  const open = $('geo-pane').classList.toggle('open');
  $('map-toggle').setAttribute('aria-expanded', String(open));
  if (open) renderGeo();
});

function setCity(next) {
  city = next && next !== city ? next : null;
  form.city.value = city ?? '';
  renderAll();
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#reset')) {
    filters = emptyFilters(); states = classify(filters, emptyExtras());
    city = null; statusFilter = ''; query = '';
    form.reset(); $('find').value = '';
    renderAll(); return;
  }
  const plate = e.target.closest('[data-plate]');
  if (plate) { setView(plate.dataset.plate); return; }
  const field = e.target.closest('[data-field]');
  if (field) { form.program.value = field.dataset.field; form.dispatchEvent(new Event('change')); setView('index'); return; }
  const sq = e.target.closest('[data-school-query]');
  if (sq) { query = sq.dataset.schoolQuery; $('find').value = query; renderAll(); setView('index'); return; }
  const kin = e.target.closest('[data-kin-order],[data-kin-pair],[data-kin-school],[data-kin-close]');
  if (kin) {
    const d = kin.dataset;
    if (d.kinOrder) kinOrder = d.kinOrder;
    else if (d.kinPair) kinPin = kinPin?.key === d.kinPair ? null : { key: d.kinPair };
    else if (d.kinSchool) kinPin = kinPin?.id === d.kinSchool ? null : { id: d.kinSchool };
    else kinPin = null;
    renderLedger();
    if (d.kinPair || d.kinSchool) document.querySelector('.kin-note')?.scrollIntoView({ block: 'nearest' });
    return;
  }
  const jump = e.target.closest('[data-jump-id]');
  if (jump) {
    const id = jump.dataset.jumpId, target = nodeById.get(id);
    if (!target) return;
    if (view !== 'index') setView('index');
    if (!matches(target)) {
      filters = emptyFilters(); states = classify(filters, emptyExtras());
      city = null; statusFilter = ''; query = '';
      form.reset(); $('find').value = '';
    }
    openId = id; renderAll();
    const rowEl = document.querySelector(`.row[data-id="${CSS.escape(id)}"]`);
    if (rowEl) rowEl.scrollIntoView({ block: 'center' });
    return;
  }
  const rowBtn = e.target.closest('[data-id]');
  if (rowBtn) {
    const id = rowBtn.dataset.id;
    openId = openId === id ? null : id;
    renderLedger();
    return;
  }
  const cityEl = e.target.closest('[data-city]');
  if (cityEl) setCity(cityEl.dataset.city || null);
});

$('map').addEventListener('keydown', (e) => {
  const g = e.target.closest('[data-city]');
  if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setCity(g.dataset.city || null); }
});
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (view === 'kin' && kinPin) { kinPin = null; renderLedger(); } else if (openId) { openId = null; renderLedger(); }
});

// Cross-highlight city on map + gazetteer when hovering a program row, and show tooltip on score strokes
let hotCity = null;
document.addEventListener('pointerover', (e) => {
  const hc = e.target.closest?.('[data-hover-city]')?.dataset.hoverCity ?? null;
  if (hc !== hotCity) {
    hotCity = hc;
    const hot = new Set(hc?.split('|')); // kinship cells carry two cities
    for (const el of document.querySelectorAll('.locator [data-city], .pdot')) el.classList.toggle('hot', hot.has(el.dataset.city));
  }
  const hl = document.getElementById('kin-hl');
  if (hl) {
    const svg = hl.ownerSVGElement, [i, j] = (e.target.closest?.('[data-ij]')?.dataset.ij ?? '').split(',').filter(Boolean).map(Number);
    hl.innerHTML = i == null ? '' : cross(i, j, +svg.dataset.c, +svg.dataset.n);
    for (const t of svg.querySelectorAll('.kn')) t.classList.toggle('hot', +t.dataset.ij === i || +t.dataset.ij === j);
  }
});
document.addEventListener('pointermove', (e) => {
  const n = view === 'score' ? nodeById.get(e.target.closest?.('.stroke[data-id]')?.dataset.id) : null, tip = $('tip');
  const text = n ? `${n.name} — ${n.u.name}, ${whenText(windowCache.get(n.id))}` : e.target.closest?.('[data-tip]')?.dataset.tip;
  tip.hidden = !text; if (!text) return;
  tip.textContent = text;
  tip.style.left = `${Math.min(innerWidth - 310, e.clientX + 12)}px`;
  tip.style.top = `${e.clientY + 14}px`;
});

addEventListener('resize', () => { renderGeo(); if (view !== 'index') renderLedger(); });

renderAll();
