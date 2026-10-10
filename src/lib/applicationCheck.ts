/**
 * Application check — turns the user's situation (answered in the browser,
 * never sent anywhere) into a per-program plan: what fits, what to prepare,
 * by when, and what it costs. Every rule states only what our sourced data
 * supports; anything else says "check the program page".
 */

import { ProcessedUniversity } from '@/stores/schoolStore';
import { admissionOf, degreeGroupOf } from '@/lib/taxonomy';
import { isDated, parseDeadlineDate } from '@/utils/deadlineUtils';

export type Level = 'none' | 'a' | 'b1' | 'b2' | 'c1';

export interface Profile {
  citizenship: 'eu' | 'non-eu' | null;   // EU/EEA citizen?
  certificate: 'german' | 'foreign' | null; // where the school-leaving certificate is from
  firstDegree: boolean | null;           // bachelor (or equivalent) by the start?
  german: Level | null;
  english: Level | null;
  portfolio: 'ready' | 'in-progress' | 'none' | null;
  semester: 'winter' | 'summer' | null;
}

export const EMPTY_PROFILE: Profile = { citizenship: null, certificate: null, firstDegree: null, german: null, english: null, portfolio: null, semester: null };

export const LEVEL_LABELS: Record<Level, string> = { none: 'None', a: 'A1–A2', b1: 'B1', b2: 'B2', c1: 'C1 or more' };

export interface Check { level: 'ok' | 'warn' | 'info'; text: string; source?: string }
export interface Step { date: Date; text: string }

/** uni-assist asks for applications at least 8 weeks before the deadline (uni-assist.de, "Fristen & Bearbeitungszeit"). */
export const UNI_ASSIST_LEAD_DAYS = 56;
const UNI_ASSIST_TIMING = 'https://www.uni-assist.de/bewerben/bewerbung-planen/fristen-bearbeitungszeit/';

type Program = NonNullable<ProcessedUniversity['programs']>[number];

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const TEST_KINDS: Record<string, string> = { portfolio: 'Portfolio upload', 'aptitude-registration': 'Aptitude test registration', audition: 'Audition' };
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** research dates: "10-31" (every year) -> "31 October", "2026-12-23" (one round) -> "23 December 2026" */
const mdText = (s: string) => { const [a, b, c] = s.split('-').map(Number); return c ? `${c} ${MONTH_NAMES[b - 1]} ${a}` : `${b} ${MONTH_NAMES[a - 1]}`; };

function languageCheck(language: string | undefined, p: Profile, requirement?: string | null): Check {
  if (!language) return { level: 'info', text: 'Teaching language not in our data — check the program page.' };
  const german = language.includes('German'), english = language.includes('English');
  // the user can follow it in either language a bilingual program offers
  const levels = [german ? p.german : null, english ? p.english : null].filter((l): l is Level => !!l);
  const best = levels.sort((x, y) => ['none', 'a', 'b1', 'b2', 'c1'].indexOf(y) - ['none', 'a', 'b1', 'b2', 'c1'].indexOf(x))[0];
  const req = requirement ? ` Required: ${requirement.replace(/\.+$/, '')}.` : ' Check the level this program requires.';
  if (!best) return { level: 'info', text: `Taught in ${language}.${req}` };
  if (best === 'c1') return { level: 'ok', text: `Taught in ${language} — your level is C1 or more.` };
  if (best === 'none' || best === 'a') return { level: 'warn', text: `Taught in ${language} — you'll need a language certificate before you start.${req}` };
  return { level: 'info', text: `Taught in ${language} — your level is ${LEVEL_LABELS[best]}.${req}` };
}

/** Checks and dated next steps for one program, given the user's situation. */
export function checkProgram(program: Program, school: ProcessedUniversity, p: Profile): { checks: Check[]; steps: Step[] } {
  const checks: Check[] = [];
  const steps: Step[] = [];
  const name = program.name;
  const status = program.status?.status;
  if (status === 'discontinued') checks.push({ level: 'warn', text: `No longer admitting new students${program.status!.notes ? ` — ${program.status!.notes}` : ''}.`, source: program.sources?.status });
  else if (status === 'not-matched') checks.push({ level: 'warn', text: 'This entry doesn’t match a program in the school’s current catalogue — check what they offer now.', source: program.sources?.status });

  // intake + deadline
  const dl = program.applicationDeadlines ?? {};
  const semester = p.semester && dl[p.semester] ? p.semester : (['winter', 'summer'] as const).find((s) => dl[s]?.end);
  const window = semester ? dl[semester] : undefined;
  let deadline: Date | null = null;
  try { deadline = window?.end ? parseDeadlineDate(window.end) : null; } catch { deadline = null; }
  const dated = isDated(window?.end);
  if (!window) checks.push({ level: 'info', text: 'Deadline not in our data — check the program page.' });
  else {
    if (p.semester && semester !== p.semester) checks.push({ level: 'warn', text: `No ${p.semester} intake listed — only ${semester}.` });
    const Sem = semester![0].toUpperCase() + semester!.slice(1);
    if (deadline && dated && deadline < new Date()) {
      checks.push({ level: 'info', text: `${Sem} intake: the published window (${window.start ? `${window.start} – ` : 'until '}${window.end}) has passed — next dates aren’t published yet.` });
      deadline = null;
    } else if (deadline) {
      checks.push({ level: 'info', text: `${Sem} intake: apply ${window.start ? `${window.start} – ` : 'by '}${window.end}${dated ? ' (dates published for this round)' : ` (next: ${fmt(deadline)})`}.`, source: program.sources?.[`applicationDeadlines.${semester}`] });
      steps.push({ date: deadline, text: `Application deadline — ${name}, ${school.name}` });
    }
  }

  // researched portfolio / test registration dates (often earlier than the application)
  for (const d of program.otherDeadlines ?? []) {
    if (!TEST_KINDS[d.kind] || (p.semester && d.semester && d.semester !== p.semester)) continue;
    const end = mdText(d.end);
    let due: Date | null = null;
    try { due = parseDeadlineDate(end); } catch { /* unparseable: text only */ }
    if (due && due < new Date()) continue; // a dated round that has passed
    checks.push({ level: 'info', text: `${TEST_KINDS[d.kind]}: ${d.start ? `${mdText(d.start)} – ` : 'by '}${end}${d.scope && d.scope !== 'all applicants' ? ` (${d.scope})` : ''}.`, source: program.sources?.otherDeadlines });
    if (due) steps.push({ date: due, text: `${TEST_KINDS[d.kind]} — ${name}, ${school.name}` });
  }

  // degree
  const group = degreeGroupOf(program.degree);
  if ((group === 'Master' || group === 'Postgraduate / Meisterschüler') && p.firstDegree === false) {
    checks.push({ level: 'warn', text: 'A master’s needs a first degree (bachelor or equivalent) by the start.' });
  }

  // language
  const details = (program as any).details;
  checks.push({ ...languageCheck(program.language, p, details?.languageNotes?.join(' · ') || details?.languageRequirements), source: program.sources?.language ?? program.sources?.['details.languageNotes'] });

  // admission route
  const admission = admissionOf(program as any, school.type);
  if (admission === 'aptitude') {
    if (p.portfolio === 'ready') checks.push({ level: 'ok', text: 'Admission by portfolio / aptitude test — your portfolio is ready.' });
    else checks.push({ level: p.portfolio ? 'warn' : 'info', text: `Admission by portfolio / aptitude test${p.portfolio === 'none' ? ' — you’ll need to build one' : p.portfolio === 'in-progress' ? ' — finish it before the deadline' : ''}.${program.otherDeadlines?.some((d) => TEST_KINDS[d.kind]) ? '' : ' Check whether the test has its own, earlier registration date.'}`, source: program.admissionSource });
  } else if (admission === 'open') {
    checks.push({ level: 'ok', text: 'Open admission — the school states grades aren’t a cut-off.', source: program.admissionSource });
  } else if (program.admission === 'restricted' || program.admission === 'aptitude-and-restricted') {
    checks.push({ level: 'info', text: `Places are limited and grades count in selection (NC)${program.admission === 'aptitude-and-restricted' ? ', on top of an aptitude test' : ''}.`, source: program.admissionSource });
  }

  // application route
  if (p.certificate === 'foreign' && school.applicationMethod === 'uni-assist') {
    checks.push({ level: 'info', text: 'With a non-German certificate you’ll likely apply via uni-assist — send it at least 8 weeks before the deadline.', source: UNI_ASSIST_TIMING });
    if (deadline) steps.push({ date: new Date(deadline.getTime() - UNI_ASSIST_LEAD_DAYS * 864e5), text: `Send to uni-assist — ${name}, ${school.name}` });
  } else if (p.certificate && school.applicationMethod === 'direct') {
    checks.push({ level: 'ok', text: 'Apply directly to the school — no uni-assist fee.' });
  } else if (p.certificate === 'german' && school.applicationMethod === 'uni-assist') {
    checks.push({ level: 'ok', text: 'Apply directly — uni-assist only handles non-German certificates.' });
  }

  // tuition for non-EU citizens who come to Germany to study — the BW ministry and HfM Dresden's fee rules
  // exempt holders of a German school certificate (Bildungsinländer)
  if (p.citizenship === 'non-eu' && p.certificate !== 'german' && school.nonEuTuition) {
    const t = school.nonEuTuition;
    checks.push({ level: 'warn', text: t.perSemester ? `Tuition for non-EU students: ${t.perSemester} per semester (exemptions exist).` : 'Charges tuition for non-EU students — see the school’s fee page.', source: t.source });
  }

  return { checks, steps };
}
