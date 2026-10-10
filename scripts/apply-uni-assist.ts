/**
 * Sets each school's `applicationMethod` from uni-assist's official list of
 * universities it processes applications for:
 *   'uni-assist' — international applicants (non-German certificates) apply
 *                  through uni-assist, which charges a handling fee
 *                  (75 € first program per semester, 30 € each additional);
 *   'direct'     — not on the list, so applications go straight to the school.
 * Members decide which programs/applicant groups uni-assist handles, so the UI
 * words this as "may require" and points to the program page.
 *
 * Run: npm run apply:uni-assist   (re-run each application season)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const LIST_URL = 'https://www.uni-assist.de/tools/uni-assist-hochschulen/';
const DATA_PATH = resolve(process.cwd(), 'src/data/enhanced_german_art_schools.json');

// our school name → name on the uni-assist list
const MEMBERS: Record<string, string> = {
  'Hochschule der Bildenden Künste Saar': 'Hochschule der Bildenden Künste Saar',
  'Hochschule für Bildende Künste Braunschweig': 'Hochschule für Bildende Künste Braunschweig',
  'Universität der Künste Berlin': 'Universität der Künste Berlin (UdK Berlin)',
  'Muthesius Kunsthochschule Kiel': 'Muthesius Kunsthochschule',
  'Bauhaus-Universität Weimar': 'Bauhaus-Universität Weimar',
  'Hochschule für Fernsehen und Film München': 'Hochschule für Fernsehen und Film München (HFF München)',
  'Filmuniversität Babelsberg KONRAD WOLF': 'Filmuniversität Babelsberg Konrad Wolf',
  'Fachhochschule Potsdam': 'Fachhochschule Potsdam (FH;P)',
  'Hochschule Darmstadt': 'Hochschule Darmstadt (h_da) – University of Applied Sciences',
  'Hochschule Rhein-Waal': 'Hochschule Rhein-Waal (Campus Kleve)',
  'Technische Universität Berlin': 'Technische Universität Berlin (TU Berlin)',
  'Hochschule Anhalt': 'Hochschule Anhalt (Campus Dessau)',
  'Universität Passau': 'Universität Passau',
  'Universität Würzburg': 'Julius-Maximilians-Universität Würzburg',
  'Technische Universität München': 'Technische Universität München (TUM)',
  'Technische Hochschule Ingolstadt': 'Technische Hochschule Ingolstadt (THI)',
  'Technische Hochschule Augsburg': 'Technische Hochschule Augsburg',
  'Kunsthochschule Kassel': 'Universität Kassel', // part of Universität Kassel
  'Burg Giebichenstein Kunsthochschule Halle': 'Burg Giebichenstein Kunsthochschule Halle',
  'Hochschule für Angewandte Wissenschaften Hamburg': 'Hochschule für Angewandte Wissenschaften Hamburg (HAW Hamburg)',
  'Technische Universität Chemnitz': 'Technische Universität Chemnitz (TU Chemnitz)',
  'Fachhochschule Dortmund': 'Fachhochschule Dortmund',
  'Leuphana Universität Lüneburg': 'Leuphana Universität Lüneburg',
  'Bergische Universität Wuppertal': 'Bergische Universität Wuppertal (BUW)',
  'Goethe-Universität Frankfurt am Main': 'Goethe-Universität Frankfurt',
  'Hochschule Offenburg': 'Hochschule Offenburg',
  'Carl von Ossietzky Universität Oldenburg': 'Carl von Ossietzky Universität Oldenburg',
  'Universität Bremen': 'Universität Bremen',
  'Heinrich-Heine-Universität Düsseldorf': 'Heinrich-Heine Universität Düsseldorf (HHU)',
};

const ENTITIES: Record<string, string> = {
  amp: '&', quot: '"', apos: "'", nbsp: ' ', ndash: '–', szlig: 'ß', eacute: 'é',
  auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü',
};
const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&(\w+);/g, (m, e) => ENTITIES[e] ?? m)
    .replace(/\s+/g, ' ')
    .trim();

async function main() {
  const html = await (await fetch(LIST_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  const listed = new Set([...html.matchAll(/<option[^>]*>([\s\S]*?)<\/option>/g)].map((m) => decode(m[1])));
  if (listed.size < 100) throw new Error(`uni-assist list looks wrong (${listed.size} options) — page layout changed?`);

  const data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  const checked = new Date().toISOString().slice(0, 10);
  let viaUniAssist = 0;
  for (const name of Object.keys(MEMBERS)) {
    if (!data.universities[name]) throw new Error(`unknown school in MEMBERS: ${name}`);
    if (!listed.has(MEMBERS[name])) console.warn(`! no longer on the uni-assist list: ${MEMBERS[name]} (${name}) — marking direct`);
  }
  for (const [name, school] of Object.entries<any>(data.universities)) {
    const member = MEMBERS[name] && listed.has(MEMBERS[name]);
    school.applicationMethod = member ? 'uni-assist' : 'direct';
    school.applicationMethodSource = { url: LIST_URL, checked };
    if (member) viaUniAssist++;
  }
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`uni-assist: ${viaUniAssist}, direct: ${Object.keys(data.universities).length - viaUniAssist}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
