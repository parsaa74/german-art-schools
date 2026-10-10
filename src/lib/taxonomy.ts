/**
 * Taxonomy — turns the raw, bilingual data vocabulary into the handful of
 * choices an applicant actually thinks in: subject groups, degree levels,
 * teaching languages and school types.
 *
 * One source of truth for the filters, the wizard, the search and the
 * relationship builder (scripts/build-relations.ts).
 */

/** Lowercase, strip diacritics, ß→ss — so "Weißensee" matches "weissensee". */
export function fold(s: string): string {
  return s.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ------------------------------------------------------------------ search --

// Levenshtein distance, for typo tolerance on whole words
function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

// Light German/English stem so "Medien" ≈ "media" and "Digitale" ≈ "digital".
// ponytail: suffix stripping only — "Fotografie"/"photography" still needs the typo rule.
const stem = (w: string) => w.replace(/(en|es|e|s|a)+$/, '');

/**
 * 0 = no match. Substring of the whole text scores highest; otherwise every
 * query word must start, share a stem with, or nearly spell (1 typo, 2 for
 * long words) some word of the text. Text words shorter than 3 letters never
 * match, so stray "a"/"of" can't make everything a hit.
 */
export function matchScore(text: string, query: string): number {
  const t = fold(text);
  const q = fold(query).trim();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;
  const words = t.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  const qWords = q.split(/[^a-z0-9]+/).filter(Boolean);
  let total = 0;
  for (const qw of qWords) {
    let best = 0;
    for (const w of words) {
      if (w.startsWith(qw)) best = Math.max(best, 70);
      else if (stem(qw).length >= 4 && stem(w) === stem(qw)) best = Math.max(best, 65);
      else if (qw.length >= 4) {
        const d = levenshtein(w.slice(0, qw.length + 1), qw);
        if (d <= (qw.length >= 7 ? 2 : 1)) best = Math.max(best, 60 - d * 10);
      }
    }
    if (!best) return 0;
    total += best;
  }
  return total / qWords.length;
}

/** Search real degrees by their official aliases and nested classes/areas too.
 * A class match opens its parent degree; it must never become a fake programme. */
export function programSearchMatch(p: {
  name: string;
  searchAliases?: string[];
  specializations?: string[];
  teachingAreas?: Array<{ name: string }>;
}, query: string): { score: number; area?: string } {
  let score = Math.max(matchScore(p.name, query), ...(p.searchAliases ?? []).map((a) => matchScore(a, query)));
  let area: string | undefined;
  for (const a of p.teachingAreas ?? []) {
    const hit = Math.max(0, matchScore(a.name, query) - 10);
    if (hit > score) { score = hit; area = a.name; }
  }
  for (const s of p.specializations ?? []) {
    const hit = Math.max(0, matchScore(s, query) - 15);
    if (hit > score) { score = hit; area = s; }
  }
  return { score, area };
}

// ---------------------------------------------------------------- subjects --

export const SUBJECT_GROUPS = [
  'Fine Art',
  'Communication & Graphic Design',
  'Interaction & Digital Media',
  'Product & Industrial Design',
  'Fashion, Textile & Jewellery',
  'Architecture, Interior & Stage Design',
  'Film & Television',
  'Animation, Games & VFX',
  'Photography',
  'Media Art & Sound',
  'Theatre, Acting & Dance',
  'Music Performance',
  'Composition, Conducting & Theory',
  'Church Music',
  'Art & Music Education',
  'Theory, Curating & Management',
] as const;
export type SubjectGroup = (typeof SUBJECT_GROUPS)[number] | 'Other';

// First match wins, so specific rules come before broad ones. Tested against
// the folded program name (see fold()).
const SUBJECT_RULES: Array<[SubjectGroup, RegExp]> = [
  ['Church Music', /kirchenmusik|kirchliche|liturg|gregorian|posaunenwart|orgel|organ\b/],
  ['Art & Music Education', /lehramt|padagog|pedagog|education|vermittl|unterrichten|schulmusik|musikplus|rhythmik|bewegung|darstellendes spiel|therap|erganzungsstudiengang|q-master|teacher/],
  ['Product & Industrial Design', /packaging|technisches design/],
  ['Fine Art', /(?<!scenic )painting|malerei|sculpture|bildhauer|printmaking|meisterschul/],
  ['Theory, Curating & Management', /wissenschaft|studies|management|promotions|doctoral|research|curat|restaur|preservation|humanities|liberal arts|economics|relations|philosoph|gender/],
  ['Composition, Conducting & Theory', /kompos|compos|dirig|conduct|leitung|musiktheorie|gehorbildung|horerziehung|tonmeister|musikubertragung|korrepetition|arrang|filmmusik/],
  ['Media Art & Sound', /musikproduktion|medien und musik|musik und medien/],
  ['Theatre, Acting & Dance', /schauspiel|acting|dramaturgie fur musiktheater/],
  ['Animation, Games & VFX', /animation|game|visual effects|vfx|technical directing|expanded realit|digital reality|motion design/],
  ['Film & Television', /film|screen|kamera|cinemat|montage|schnitt|editing|drehbuch|production|produktion|producing|fernseh|television|motion pictures|serial storytelling|bildgestaltung|szenenbild|ton und bild|atelier ludwigsburg/],
  ['Architecture, Interior & Stage Design', /archit|innenarch|interior|buhnen-? und kostum|buhnenbild|stage|theatre design|raum|spatial|scenic/],
  ['Theatre, Acting & Dance', /drama|regie|theat|tanz|dance|choreo|puppen|figurentheater|spiel und objekt|sprechkunst|performing arts|opernstudio|buhnengesang/],
  ['Photography', /foto|photo/],
  ['Media Art & Sound', /media art|medienkunst|mediale kunste|sound|klang|audio|elektro|electronic|musikdesign|zeitabhangige medien|music technology/],
  ['Fashion, Textile & Jewellery', /mode|fashion|textil|schmuck|jewel|kostum/],
  ['Product & Industrial Design', /produkt|product|industrial|transportation|mobility|objekt/],
  ['Interaction & Digital Media', /interact|interakt|interface|human.?computer|human-technology|user experience|\bux\b|digital|informatik|informatics|computation|mobile medien|computer science|engineering|medientechnik|media technology|crossmedia|online/],
  ['Communication & Graphic Design', /kommunikationsdesign|kommunikationsgestaltung|communication design|design and communication|creative direction|visual communication|visuelle kommunikation|graphic|grafik|illustration|typo|editorial|book|buch|informationsdesign|information design|werbung|advertising/],
  ['Theory, Curating & Management', /kultur|cultural|theory|kommunikation|communication|publishing|journal|marketing|psycholog|bibliothek/],
  ['Music Performance', /musik|music|instrument|gesang|vokal|voice|\bsing|klavier|piano|gitarre|guitar|harfe|streich|blas|blech|holz|schlagzeug|orchester|kammer|jazz|pop|rock|konzert|oper|lied|solist|mandoline|historische|alte musik|interpretation|bigband|meisterklasse|kunstlerisches profil|kunstlerische ausbildung|kunstlerischer|kronberg|ensemble/],
  ['Fine Art', /fine art|freie kunst|bildende kunst|visual art|art and media|art and design|creative arts|kunst/],
  ['Communication & Graphic Design', /design|gestaltung/],
  ['Interaction & Digital Media', /medien|media/],
];

export function subjectGroupOf(name: string): SubjectGroup {
  const n = fold(name);
  for (const [group, re] of SUBJECT_RULES) if (re.test(n)) return group;
  return 'Other';
}

// ----------------------------------------------------------------- degrees --

export const DEGREE_GROUPS = ['Bachelor', 'Master', 'Diploma', 'Postgraduate / Meisterschüler', 'Doctorate', 'Teaching degree', 'Certificate / short course'] as const;
export type DegreeGroup = (typeof DEGREE_GROUPS)[number] | null;

export function degreeGroupOf(degree: string | undefined): DegreeGroup {
  const d = fold(degree || '');
  if (!d) return null;
  // DFFB’s institutional diploma is not an academic Diplom or degree equivalent.
  if (/dffb.*non-state/.test(d)) return 'Certificate / short course';
  if (/b\.a\. equivalent/.test(d)) return 'Bachelor'; // AVA Frankfurt's state exam is not a teaching degree
  if (/education|lehramt|staatsexamen|state exam/.test(d)) return 'Teaching degree';
  if (/phd|dr\.|doctor|promotion/.test(d)) return 'Doctorate';
  if (/meister|konzertexamen|solist|postgraduate|advanced studies|masterclass/.test(d)) return 'Postgraduate / Meisterschüler';
  if (/bachelor/.test(d)) return 'Bachelor';
  if (/master-aquivalent|absolvent/.test(d)) return 'Diploma'; // long one-tier art degrees (Kassel, UdK)
  if (/master|magister/.test(d)) return 'Master';
  if (/diplom|akademiebrief/.test(d)) return 'Diploma';
  return 'Certificate / short course';
}

/** Short tag to tell same-named programs apart: "BA", "MA", "Dipl." … */
export function degreeAbbrev(degree: string | undefined): string {
  const d = degree || '';
  const known: Record<string, string> = {
    'DFFB diploma (non-state qualification)': 'DFFB',
    'Bachelor of Arts': 'BA', 'Master of Arts': 'MA', 'Bachelor of Music': 'BMus', 'Master of Music': 'MMus',
    'Bachelor of Science': 'BSc', 'Master of Science': 'MSc', 'Bachelor of Fine Arts': 'BFA', 'Master of Fine Arts': 'MFA',
    'Master of Education': 'MEd', 'Bachelor of Engineering': 'BEng', 'Master of Engineering': 'MEng', 'Master of Architecture': 'MArch',
  };
  if (known[d]) return known[d];
  const g = degreeGroupOf(d);
  if (g === 'Diploma') return 'Dipl.';
  if (g === 'Doctorate') return 'PhD';
  return d;
}

// --------------------------------------------------------------- languages --

export const LANGUAGES = ['German', 'English'] as const;

/** "German/English" counts as both — a bilingual program is taught in English too. */
export function taughtIn(language: string | undefined, wanted: string): boolean {
  return !!language && language.includes(wanted);
}

// --------------------------------------------------------------- admission --

/** How a program admits without a grade cut-off (NC): by portfolio / artistic
 *  aptitude test, or openly (the school states grades don't decide). */
export type Admission = 'aptitude' | 'open';

const ART_SCHOOL_TYPES = new Set(['art_academy', 'music_academy', 'film_university']);

/**
 * NC-free admission route of a program, if known. Researched values (with a
 * source) win; a scraped "portfolio required" counts as aptitude; otherwise art,
 * music, film and performing-arts schools select every artistic program by
 * aptitude test — Hochschulkompass, "Auswahlverfahren & Eignungsprüfung":
 * https://www.hochschulkompass.de/studium/bewerbung-zulassung/zulassungsverfahren/auswahlverfahren-eignungspruefung.html
 * Their academic programs (musicology, management, …) stay unknown.
 */
export function admissionOf(
  p: { name: string; status?: { status: string }; admission?: string; details?: { portfolioRequired?: boolean | null } | null },
  schoolType: string
): Admission | undefined {
  if (p.status?.status === 'not-matched' || p.status?.status === 'discontinued') return undefined;
  // Explicit restrictions block the NC-free fallback, even when a portfolio is required.
  if (p.admission) return p.admission === 'aptitude' || p.admission === 'open' ? p.admission : undefined;
  if (p.details?.portfolioRequired) return 'aptitude';
  if (ART_SCHOOL_TYPES.has(schoolType) && subjectGroupOf(p.name) !== 'Theory, Curating & Management') return 'aptitude';
  return undefined;
}

export const ADMISSION_LABELS: Record<Admission, string> = {
  aptitude: 'Portfolio / aptitude test — grades aren\'t the cut-off',
  open: 'Open admission — the school states there is no grade cut-off',
};

// ------------------------------------------------------------- uni-assist --

// -------------------------------------------------------------------- fees --

export interface Fee { kind: string; euros: number | null; period: string; appliesTo: string; notes?: string; cycle?: string | null; approximate?: boolean }

const FEE_KINDS: Record<string, string> = {
  tuition: 'Tuition', 'non-eu-tuition': 'Tuition (non-EU)', 'semester-contribution': 'Semester contribution',
  application: 'Application fee', 'aptitude-test': 'Aptitude test fee', enrolment: 'Enrolment fee',
  'enrolment-equipment': 'Enrolment & equipment insurance', 'semester-ticket': 'Semester transport ticket',
};
const PERIODS: Record<string, string> = { semester: '/semester', month: '/month', year: '/year', once: '', credit: '/credit' };

/** "Semester contribution: €346.80/semester (all students, 2026/27)" */
export function feeLine(f: Fee): string {
  const amount = f.euros == null ? 'amount not verified' : f.euros === 0 ? 'none' : `${f.approximate ? 'about ' : ''}€${f.euros.toLocaleString('en-GB')}${PERIODS[f.period] ?? ''}`;
  const scope = [f.appliesTo, f.cycle].filter(Boolean).join(', ');
  return `${FEE_KINDS[f.kind] ?? f.kind}: ${amount}${scope ? ` (${scope})` : ''}`;
}

/** uni-assist handling fee for applying to `n` programs in one semester:
 *  €75 for the first, €30 for each further one (uni-assist.de, "Handling fees"). */
export const uniAssistFee = (n: number) => (n > 0 ? 75 + 30 * (n - 1) : 0);

// ------------------------------------------------------------ school types --

export const SCHOOL_TYPES: Record<string, { label: string; color: string }> = {
  art_academy: { label: 'Art academy', color: '#EF4444' },
  design_school: { label: 'Design school', color: '#10B981' },
  film_university: { label: 'Film school', color: '#F59E0B' },
  music_academy: { label: 'Music & performing arts', color: '#A855F7' },
  university: { label: 'University', color: '#3B82F6' },
  university_of_applied_sciences: { label: 'University of applied sciences', color: '#22D3EE' },
};

/** Collapse the raw data types (kunsthochschule, academy, …) into SCHOOL_TYPES keys. */
export function normalizeSchoolType(raw: string | undefined): string {
  const t = raw || 'university';
  if (['academy', 'kunsthochschule', 'kunstakademie', 'university_of_arts'].includes(t)) return 'art_academy';
  if (t.includes('design')) return 'design_school';
  if (t.includes('film')) return 'film_university';
  if (t.includes('music') || t.includes('theater') || t.includes('performing')) return 'music_academy';
  if (t === 'college') return 'university';
  return SCHOOL_TYPES[t] ? t : 'university';
}

export const typeLabel = (t: string) => SCHOOL_TYPES[t]?.label ?? t.replace(/_/g, ' ');
export const typeColor = (t: string) => SCHOOL_TYPES[t]?.color ?? '#3B82F6';

// ----------------------------------------------------------- relationships --

/** Related schools glow gold on the wall; brightness = tier (scripts/build-relations.ts). */
export const KIN_COLOR = '#FBBF24';
export const TIER_LABELS: Record<number, string> = { 3: 'Very similar', 2: 'Similar', 1: 'Some overlap' };
export const TIER_OPACITY: Record<number, number> = { 3: 1, 2: 0.6, 1: 0.3 };
