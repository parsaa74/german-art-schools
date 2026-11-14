// Kinship plate: a road-atlas distance chart for curricula. Every cell joins two schools;
// its mark counts their closely related programs (similarity edges in relations.json) and
// takes the ink of the discipline they share. Read across from one name, up from the other.
import { edges } from '../focus/focus-model.js';
import { degreeAbbrev } from '../lib/taxonomy.ts';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Names as students and staff say them; anything missing falls back to the full name.
const SHORT = {
  'Hochschule für bildende Künste Hamburg': 'HFBK Hamburg', 'Hochschule der Bildenden Künste Saar': 'HBKsaar',
  'Hochschule für Bildende Künste Braunschweig': 'HBK Braunschweig', 'Hochschule für Musik und Theater Rostock': 'HMT Rostock',
  'Kunstakademie Düsseldorf': 'Kunstakademie Düsseldorf', 'Universität der Künste Berlin': 'UdK Berlin',
  'Staatliche Hochschule für Gestaltung Karlsruhe': 'HfG Karlsruhe', 'Hochschule für Künste Bremen': 'HfK Bremen',
  'Staatliche Akademie der Bildenden Künste Stuttgart': 'ABK Stuttgart', 'Kunsthochschule für Medien Köln': 'KHM Köln',
  'Hochschule für Gestaltung Offenbach': 'HfG Offenbach', 'Hochschule für Grafik und Buchkunst Leipzig': 'HGB Leipzig',
  'Muthesius Kunsthochschule Kiel': 'Muthesius Kiel', 'Bauhaus-Universität Weimar': 'Bauhaus-Uni Weimar',
  'Alanus Hochschule für Kunst und Gesellschaft': 'Alanus Alfter', 'Hochschule der bildenden Künste Essen': 'HBK Essen',
  'Hochschule Macromedia': 'Macromedia', 'Merz Akademie': 'Merz Akademie', 'Hochschule für Fernsehen und Film München': 'HFF München',
  'Filmuniversität Babelsberg KONRAD WOLF': 'Filmuni Babelsberg', 'Hochschule für Gestaltung Schwäbisch Gmünd': 'HfG Schwäbisch Gmünd',
  'Bard College Berlin': 'Bard Berlin', 'Academy of Visual Arts Frankfurt': 'AVA Frankfurt', 'Fachhochschule Potsdam': 'FH Potsdam',
  'Hochschule Darmstadt': 'h_da Darmstadt', 'Hochschule Rhein-Waal': 'HS Rhein-Waal', 'Technische Universität Berlin': 'TU Berlin',
  'Hochschule Anhalt': 'HS Anhalt', 'Universität Trier': 'Uni Trier', 'Universität Siegen': 'Uni Siegen',
  'Technische Hochschule Ingolstadt': 'THI Ingolstadt', 'Technische Hochschule Augsburg': 'TH Augsburg', 'Universität Passau': 'Uni Passau',
  'Universität Würzburg': 'Uni Würzburg', 'RWTH Aachen University': 'RWTH Aachen', 'Technische Universität München': 'TU München',
  'Köln International School of Design': 'KISD Köln', 'Hochschule Reutlingen': 'HS Reutlingen', 'Kunsthochschule Mainz': 'KH Mainz',
  'Kunsthochschule Kassel': 'KH Kassel', 'Hochschule Pforzheim': 'HS Pforzheim', 'Hochschule für Medien Stuttgart': 'HdM Stuttgart',
  'Kunstakademie Münster': 'Kunstakademie Münster', 'Akademie der Bildenden Künste München': 'AdBK München',
  'Akademie der Bildenden Künste Nürnberg': 'AdBK Nürnberg', 'Burg Giebichenstein Kunsthochschule Halle': 'Burg Halle',
  'Folkwang Universität der Künste': 'Folkwang Essen', 'Hochschule für Angewandte Wissenschaften Hamburg': 'HAW Hamburg',
  'Hochschule für Bildende Künste Dresden': 'HfBK Dresden', 'Städelschule Frankfurt': 'Städelschule', 'Kunsthochschule München': 'KH München',
  'Technische Universität Chemnitz': 'TU Chemnitz', 'Kunsthochschule Berlin-Weißensee': 'KH Weißensee',
  'Hochschule für Musik und Theater Leipzig': 'HMT Leipzig', 'Hochschule für Musik, Theater und Medien Hannover': 'HMTM Hannover',
  'Hochschule für evangelische Kirchenmusik der Evangelisch-Lutherischen Kirche in Bayern': 'HfEK Bayreuth',
  'Hochschule für Musik Hanns Eisler Berlin': 'HfM Hanns Eisler', 'Hochschule für Schauspielkunst Ernst Busch': 'HfS Ernst Busch',
  'Hochschule für Musik Detmold': 'HfM Detmold', 'Hochschule für Kirchenmusik der Evangelisch-Lutherischen Landeskirche Sachsens': 'HfKM Dresden',
  'Hochschule für Musik Carl Maria von Weber Dresden': 'HfM Dresden', 'Palucca Hochschule für Tanz Dresden': 'Palucca Dresden',
  'Robert Schumann Hochschule Düsseldorf': 'RSH Düsseldorf', 'Hochschule für Musik und Darstellende Kunst Frankfurt am Main': 'HfMDK Frankfurt',
  'Hochschule für Musik Freiburg im Breisgau': 'HfM Freiburg', 'Evangelische Hochschule für Kirchenmusik': 'EHK Halle',
  'Hochschule für Kirchenmusik der Evangelischen Landeskirche in Baden': 'HfKM Heidelberg', 'Hochschule für Musik Karlsruhe': 'HfM Karlsruhe',
  'Hochschule für Musik und Tanz Köln': 'HfMT Köln', 'Musikhochschule Lübeck': 'MH Lübeck',
  'Staatliche Hochschule für Musik und Darstellende Kunst Mannheim': 'HfMDK Mannheim', 'Hochschule für Musik Nürnberg': 'HfM Nürnberg',
  'Hochschule für Katholische Kirchenmusik und Musikpädagogik': 'HfKM Regensburg', 'Hochschule für Kirchenmusik der Diözese Rottenburg-Stuttgart': 'HfKM Rottenburg',
  'Hochschule für Musik Saar': 'HfM Saar', 'Staatliche Hochschule für Musik und Darstellende Kunst Stuttgart': 'HMDK Stuttgart',
  'Staatliche Hochschule für Musik Trossingen': 'HfM Trossingen', 'Hochschule für Kirchenmusik der Evangelischen Landeskirche in Württemberg': 'HfKM Tübingen',
  'Hochschule für Musik Franz Liszt Weimar': 'HfM Weimar', 'Hochschule für Kirchenmusik der Evangelischen Kirche von Westfalen': 'HfKM Witten',
  'Hochschule für Musik Würzburg': 'HfM Würzburg', 'Filmakademie Baden-Württemberg': 'Filmakademie Ludwigsburg', 'Fachhochschule Dortmund': 'FH Dortmund',
  'Leuphana Universität Lüneburg': 'Leuphana Lüneburg', 'Bergische Universität Wuppertal': 'Uni Wuppertal', 'Fachhochschule Münster': 'FH Münster',
  'Goethe-Universität Frankfurt am Main': 'Goethe-Uni Frankfurt', 'Hochschule Offenburg': 'HS Offenburg',
  'Carl von Ossietzky Universität Oldenburg': 'Uni Oldenburg', 'Universität Bremen': 'Uni Bremen', 'Universität Hamburg': 'Uni Hamburg',
  'Europa-Universität Flensburg': 'EUF Flensburg', 'Heinrich-Heine-Universität Düsseldorf': 'HHU Düsseldorf',
  'Deutsche Film- und Fernsehakademie Berlin (DFFB)': 'dffb Berlin', 'ifs Internationale Filmschule Köln': 'ifs Köln',
};
export const short = (u) => SHORT[u.name] ?? u.name;

const FAMS = ['art', 'design', 'space', 'film', 'music', 'theory'];
const FAM_LABEL = { art: 'Fine art, photo, media art', design: 'Design', space: 'Architecture, stage, theatre', film: 'Film, animation', music: 'Music', theory: 'Education, theory' };
export const dominant = (c) => FAMS.reduce((a, f) => ((c[f] ?? 0) > (c[a] ?? 0) ? f : a));
const top = dominant;
const bump = (o, k) => { o[k] = (o[k] ?? 0) + 1; };
const SIM = edges.filter((e) => e.kind === 'similarity');

export function build(ns, famOf, order) {
  const byId = new Map(ns.map((n) => [n.id, n]));
  const pairs = new Map(), sch = new Map();
  const school = (u) => sch.get(u.id) ?? sch.set(u.id, { u, total: 0, fam: {}, links: [] }).get(u.id);
  for (const e of SIM) {
    let p = byId.get(e.source), q = byId.get(e.target);
    if (!p || !q || p.u.id === q.u.id) continue;
    if (p.u.id > q.u.id) [p, q] = [q, p];
    const key = `${p.u.id}|${q.u.id}`;
    let r = pairs.get(key);
    if (!r) { pairs.set(key, r = { key, a: p.u, b: q.u, list: [], fam: {} }); school(p.u).links.push(r); school(q.u).links.push(r); }
    r.list.push([p, q, e.weight]);
    bump(r.fam, famOf(p)); bump(r.fam, famOf(q));
    school(p.u).total++; school(q.u).total++;
  }
  for (const n of ns) if (sch.has(n.u.id)) bump(sch.get(n.u.id).fam, famOf(n));
  for (const s of sch.values()) s.ink = top(s.fam);

  let list = [...sch.values()];
  if (order === 'north') list.sort((s, t) => t.u.coordinates.lat - s.u.coordinates.lat);
  else {
    // Family blocks, then a greedy chain inside each block so the strongest neighbours sit side by side.
    // ponytail: greedy chain, real seriation (e.g. spectral ordering) if the blocks start looking noisy
    const w = (s, t) => pairs.get(s.u.id < t.u.id ? `${s.u.id}|${t.u.id}` : `${t.u.id}|${s.u.id}`)?.list.length ?? 0;
    list = FAMS.flatMap((f) => {
      const left = new Set(list.filter((s) => s.ink === f)), out = [];
      let cur = [...left].sort((s, t) => t.total - s.total)[0];
      while (cur) {
        out.push(cur); left.delete(cur);
        let best = null;
        for (const s of left) if (!best || w(cur, s) > w(cur, best) || (w(cur, s) === w(cur, best) && s.total > best.total)) best = s;
        cur = best;
      }
      return out;
    });
  }
  return { list, pairs, schools: sch, unlinked: new Set(ns.map((n) => n.u.id)).size - sch.size };
}

// Crosshair from a cell to both names on the diagonal (pair: j < i), or a school's full row + column.
export function cross(i, j, c, n) {
  const R = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`;
  return j == null
    ? R(0, i * c, i * c, c) + R(i * c, i * c, c, (n - i) * c)
    : R(j * c, i * c, (i - j) * c, c) + R(j * c, j * c, c, (i - j + 1) * c);
}

function pairNote(r) {
  const rows = [...r.list].sort((x, y) => y[2] - x[2]).map(([p, q]) => `<tr>${[p, q].map((m) =>
    `<td><button type="button" data-jump-id="${esc(m.id)}">${esc(m.name)}</button> <span class="deg">${esc(degreeAbbrev(m.p.degree))}</span></td>`).join('<td class="tie" aria-hidden="true">—</td>')}</tr>`).join('');
  return `<div class="kin-note" style="--fc:var(--c-${top(r.fam)})"><h3>${esc(short(r.a))} — ${esc(short(r.b))}<span>${r.list.length} related program pair${r.list.length > 1 ? 's' : ''}</span><button type="button" class="kin-close" data-kin-close>Close</button></h3>
    <table><thead><tr><th>${esc(r.a.name)}, ${esc(r.a.city)}</th><th></th><th>${esc(r.b.name)}, ${esc(r.b.city)}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function schoolNote(s) {
  const links = [...s.links].sort((x, y) => y.list.length - x.list.length);
  return `<div class="kin-note" style="--fc:var(--c-${s.ink})"><h3>${esc(s.u.name)}<span>${esc(s.u.city)}, related programs at ${links.length} school${links.length > 1 ? 's' : ''}</span><button type="button" class="kin-close" data-kin-close>Close</button></h3>
    <ul class="kin-list">${links.map((r) => { const o = r.a.id === s.u.id ? r.b : r.a; return `<li><button type="button" data-kin-pair="${esc(r.key)}" style="--fc:var(--c-${top(r.fam)})"><span>${esc(short(o))}</span><span class="n">${r.list.length}</span></button></li>`; }).join('')}</ul></div>`;
}

export function kinshipView(ns, { W, famOf, order, pin, city }) {
  const k = build(ns, famOf, order), n = k.list.length;
  if (n < 2) return `<p style="padding:20px 14px;color:var(--dim)">No related programs between schools under the current filters.</p>`;
  const longest = Math.max(...k.list.map((s) => short(s.u).length));
  let fs = 11, c = 10;
  for (let pass = 0; pass < 2; pass++) { c = Math.max(9, Math.min(32, Math.floor((W - longest * fs * 0.58 - 12) / n))); fs = Math.min(c > 24 ? 13 : 11.5, c - 1); }
  const labelW = longest * fs * 0.58 + 12, SW = Math.ceil(n * c + labelW), SH = n * c + 1;
  const idx = new Map(k.list.map((s, i) => [s.u.id, i])), max = Math.max(...[...k.pairs.values()].map((r) => r.list.length));
  // Log scale: conservatories list every instrument as its own program, so a few pairs reach ~50 while the median is 2.
  const size = (v) => (max > 1 ? Math.log(v) / Math.log(max) : 1), side = (v) => +(c * (0.3 + 0.62 * size(v))).toFixed(1);
  const sizeKey = [...new Set([1, Math.round(Math.sqrt(max)), max])].map((v) => `<svg width="${c}" height="${c}" aria-hidden="true"><rect x="${(c - side(v)) / 2}" y="${(c - side(v)) / 2}" width="${side(v)}" height="${side(v)}" fill="var(--dim)"/></svg> ${v}`).join(' ');
  const ij = (r) => { const a = idx.get(r.a.id), b = idx.get(r.b.id); return a > b ? [a, b] : [b, a]; };

  let grid = '', blocks = '';
  for (let i = 1; i <= n; i++) grid += `M0 ${i * c}H${Math.min(i, n - 1) * c}`;
  for (let j = 0; j < n; j++) grid += `M${j * c} ${Math.max(j, 1) * c}V${n * c}`;
  if (order !== 'north') for (let i = 1; i < n; i++) if (k.list[i].ink !== k.list[i - 1].ink) blocks += `M0 ${i * c}H${i * c}V${n * c}`;

  const cells = [...k.pairs.values()].map((r) => {
    const [i, j] = ij(r), v = r.list.length, x = j * c, y = i * c, t = size(v);
    const tip = `${short(r.a)} – ${short(r.b)}: ${v} related program pair${v > 1 ? 's' : ''}, mostly ${FAM_LABEL[top(r.fam)].toLowerCase()}`;
    const mark = c >= 18
      ? `<rect class="bg" x="${x}" y="${y}" width="${c}" height="${c}" fill-opacity="${(0.14 + 0.6 * t).toFixed(2)}"/><text x="${x + c / 2}" y="${y + c / 2}" style="font-size:${fs}px">${v}</text>`
      : (() => { const s = side(v); return `<rect class="mk" x="${x + (c - s) / 2}" y="${y + (c - s) / 2}" width="${s}" height="${s}"/>`; })();
    return `<g class="kc${pin?.key === r.key ? ' on' : ''}" style="--fc:var(--c-${top(r.fam)})" data-kin-pair="${esc(r.key)}" data-ij="${i},${j}" data-tip="${esc(tip)}" data-hover-city="${esc(r.a.city)}|${esc(r.b.city)}"><rect class="hit" x="${x}" y="${y}" width="${c}" height="${c}"/>${mark}</g>`;
  }).join('');

  const names = k.list.map((s, i) => `<text class="kn${s.u.city === city ? ' city' : ''}${pin?.id === s.u.id ? ' on' : ''}" data-kin-school="${esc(s.u.id)}" data-ij="${i}" data-tip="${esc(`${s.u.name}, ${s.u.city}: related programs at ${s.links.length} schools`)}" data-hover-city="${esc(s.u.city)}" x="${i * c + 4}" y="${i * c + c / 2}" style="fill:var(--c-${s.ink});font-size:${fs}px">${esc(short(s.u))}</text>`).join('');

  const pr = pin?.key ? k.pairs.get(pin.key) : null, ps = pin?.id ? k.schools.get(pin.id) : null;
  const pinned = pr ? cross(...ij(pr), c, n) : ps ? cross(idx.get(ps.u.id), null, c, n) : '';
  const note = pr ? pairNote(pr) : ps ? schoolNote(ps) : '';
  const btn = (id, label) => `<button type="button" data-kin-order="${id}" class="${(order === 'north') === (id === 'north') ? 'on' : ''}">${label}</button>`;

  return `${note}<div class="kin-wrap">
    <p class="key"><span>Distance chart of ${n} schools: read across from one name and up from the other. The mark counts their closely related programs.${k.unlinked ? ` ${k.unlinked} more school${k.unlinked > 1 ? 's have' : ' has'} none.` : ''}</span><span class="kin-order">Order ${btn('kinship', 'by kinship')} ${btn('north', 'north to south')}</span></p>
    <p class="key fams"><span class="sizes">${sizeKey}</span>${FAMS.map((f) => `<span><i style="background:var(--c-${f})"></i>${FAM_LABEL[f]}</span>`).join('')}</p>
    <div class="kin-scroll"><svg class="kin" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}" data-c="${c}" data-n="${n}" role="img" aria-label="Distance chart of related programs between ${n} schools">
      <path class="kgrid" d="${grid}"/><g class="kin-pin">${pinned}</g><g id="kin-hl"></g>${blocks ? `<path class="kblock" d="${blocks}"/>` : ''}${cells}${names}
    </svg></div></div>`;
}
