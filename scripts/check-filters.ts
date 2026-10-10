/**
 * Self-check for the filter predicate and taxonomy against the real data.
 * Run: npm run check:filters
 */
import data from '../src/data/enhanced_german_art_schools.json';
import { passesFilters, countMatches, Filters } from '../src/lib/glass/filter';
import { checkProgram, EMPTY_PROFILE, UNI_ASSIST_LEAD_DAYS } from '../src/lib/applicationCheck';
import { parseDeadlineDate, getDeadlineStatus } from '../src/utils/deadlineUtils';
import { normalizeSchoolType, degreeGroupOf, subjectGroupOf, fold, admissionOf, matchScore, programSearchMatch, uniAssistFee } from '../src/lib/taxonomy';

const unis = Object.entries((data as any).universities).map(([name, d]: [string, any]) => ({
  id: d.id, name, state: d.state, city: d.city, description: d.description || '',
  type: normalizeSchoolType(d.type), programTypes: (d.programs ?? []).map((p: any) => p.name),
  programs: d.programs ?? [], applicationMethod: d.applicationMethod, nonEuTuition: d.nonEuTuition,
  founded: d.stats?.founded?.toString(),
})) as any[];

const none: Filters = { search: '', state: null, program: null, type: null, semester: null, nc: null, method: null, language: null, degree: null, timeline: null };
const count = (f: Partial<Filters>) => countMatches(unis, { ...none, ...f });
let failed = 0;
const check = (ok: boolean, msg: string) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failed++; };

// program-level filters must hold on one and the same program
const available = (p: any) => p.status?.status !== 'not-matched' && p.status?.status !== 'discontinued';
const englishBachelor = unis.filter((u) => u.programs.some((p: any) => available(p) && p.language?.includes('English') && degreeGroupOf(p.degree) === 'Bachelor')).length;
check(count({ language: 'English', degree: 'Bachelor' }) === englishBachelor, `English + Bachelor = ${englishBachelor} schools with an English-taught bachelor`);
check(count({ language: 'English' }) > count({ language: 'English', degree: 'Bachelor' }), 'adding a degree narrows the English results');

// bilingual programs count as English
const anyEnglish = unis.filter((u) => u.programs.some((p: any) => available(p) && p.language?.includes('English'))).length;
check(count({ language: 'English' }) === anyEnglish, `English includes German/English programs (${anyEnglish})`);

// unknown data never passes an active filter
// NC-free is per program: aptitude/open admission must hold on a program that also passes the other program filters
const ncFree = unis.filter((u) => u.programs.some((p: any) => admissionOf(p, u.type))).length;
check(count({ nc: true }) === ncFree, `NC-free = ${ncFree} schools with an aptitude-test or open-admission program`);
const ncEnglishMaster = unis.filter((u) => u.programs.some((p: any) => available(p) && admissionOf(p, u.type) && p.language?.includes('English') && degreeGroupOf(p.degree) === 'Master')).length;
check(count({ nc: true, language: 'English', degree: 'Master' }) === ncEnglishMaster, `NC-free + English + Master = ${ncEnglishMaster} (same program)`);
const thi = unis.find((u) => u.name === 'Technische Hochschule Ingolstadt');
check(!passesFilters(thi, { ...none, nc: true }), 'unconfirmed university programs are not claimed NC-free (THI)');
const macro = unis.find((u) => u.name === 'Hochschule Macromedia');
check(passesFilters(macro, { ...none, nc: true }), 'researched open admission counts as NC-free (Macromedia)');
check(count({ method: 'uni-assist' }) + count({ method: 'direct' }) === unis.length, 'every school has an application route');

// search folds umlauts / ß
check(count({ search: 'weissensee' }) === 1 && passesFilters(unis.find((u) => u.name.includes('Weißensee')), { ...none, search: 'weissensee' }), '"weissensee" finds Kunsthochschule Berlin-Weißensee');
check(fold('Düsseldorf') === 'dusseldorf', 'fold strips umlauts');

// taxonomy covers the data
const types = new Set(unis.map((u) => u.type));
check(types.size <= 6, `schools collapse into ${types.size} types: ${[...types].join(', ')}`);
const other = unis.flatMap((u) => u.programs).filter((p: any) => subjectGroupOf(p.name) === 'Other').length;
check(other <= 5, `${other} programs fall outside the subject groups`);

// search matches across German/English spellings, but not everything
check(matchScore('Digitale Medien', 'digital media') > 0 && matchScore('Digitale Medien', 'digital medias') > 0, 'search "digital media" finds "Digitale Medien"');
check(matchScore('Kommunikationsdesign', 'kommunikation') > 0, 'search prefix "kommunikation" finds "Kommunikationsdesign"');
check(matchScore('Kirchenmusik A', 'animation') === 0 && matchScore('Hochschule Darmstadt', 'xyzzy') === 0, 'search does not match unrelated names');

check(uniAssistFee(0) === 0 && uniAssistFee(1) === 75 && uniAssistFee(4) === 165, 'uni-assist fee: €75 first + €30 each further program');

// application check
const school = (name: string) => unis.find((u) => u.name === name);
const prog = (u: any, re: RegExp) => u.programs.find((p: any) => re.test(p.name + ' ' + p.degree));
const abk = school('Staatliche Akademie der Bildenden Künste Stuttgart');
const abkProg = abk.programs[0];
const nonEu = { ...EMPTY_PROFILE, citizenship: 'non-eu' as const, certificate: 'foreign' as const };
check(checkProgram(abkProg, abk, nonEu).checks.some((c) => c.text.includes('€1,500')), 'non-EU applicant sees BW tuition (ABK Stuttgart)');
check(!checkProgram(abkProg, abk, { ...nonEu, certificate: 'german' }).checks.some((c) => c.text.includes('Tuition')), 'German certificate: no non-EU tuition');
const fhp = school('Fachhochschule Potsdam'); // uni-assist member
const fhpProg = prog(fhp, /Communication Design/);
const { steps } = checkProgram(fhpProg, fhp, nonEu);
const send = steps.find((st) => st.text.startsWith('Send to uni-assist')), due = steps.find((st) => st.text.startsWith('Application deadline'));
check(!!send && !!due && Math.round((+due!.date - +send!.date) / 864e5) === UNI_ASSIST_LEAD_DAYS, 'uni-assist step is 8 weeks before the deadline');
check(!checkProgram(fhpProg, fhp, { ...nonEu, certificate: 'german' }).steps.some((st) => st.text.startsWith('Send to uni-assist')), 'German certificate: no uni-assist step');
const master = unis.flatMap((u) => u.programs.map((p: any) => [u, p])).find(([, p]: any) => /^Master of Arts$/.test(p.degree));
check(checkProgram(master[1], master[0], { ...EMPTY_PROFILE, firstDegree: false }).checks.some((c) => c.level === 'warn' && c.text.includes('first degree')), 'master without a first degree is flagged');
const germanOnly = unis.flatMap((u) => u.programs.map((p: any) => [u, p])).find(([, p]: any) => p.language === 'German');
check(checkProgram(germanOnly[1], germanOnly[0], { ...EMPTY_PROFILE, german: 'a' }).checks.some((c) => c.level === 'warn' && c.text.startsWith('Taught in German')), 'German-taught program with A-level German is flagged');

// researched data (data/research/2026-10-10-accepted.json)
check(parseDeadlineDate('5 March 2027').getFullYear() === 2027 && parseDeadlineDate('5 March 2020').getFullYear() === 2020, 'a dated deadline keeps its year');
check(getDeadlineStatus({ start: '1 January 2020', end: '5 March 2020' })?.label.startsWith('Closed') === true && getDeadlineStatus({ end: '5 March 2020' })?.status === 'closed', 'a passed dated round is closed, not moved to next year');
const tub = school('Technische Universität Berlin');
check(admissionOf(prog(tub, /Media Technology/), 'art_academy') === undefined, 'researched grade-restricted program is never NC-free');
check(degreeGroupOf('State Exam in Interdisciplinary Communication, Design or Arts (B.A. equivalent)') === 'Bachelor' && degreeGroupOf('Absolvent*in der Universität der Künste Berlin (A)') === 'Diploma', 'researched degree labels land in the right group');
const gone = unis.flatMap((u) => u.programs.map((p: any) => [u, p])).find(([, p]: any) => p.status?.status === 'discontinued');
check(!!gone && checkProgram(gone[1], gone[0], EMPTY_PROFILE).checks[0].level === 'warn', 'discontinued program is flagged first');

// Official-catalogue follow-up: joint offerings and nested classes are not extra degrees.
const udk = school('Universität der Künste Berlin');
const udkDc = prog(udk, /Design & Computation/);
const tuDc = prog(tub, /Design & Computation/);
check(udkDc.degree === 'Master of Arts' && udkDc.language === 'German' && udkDc.jointProgramId === tuDc.jointProgramId, 'D&C is the same joint UdK/TU MA, taught in German');
check(getDeadlineStatus(udkDc.applicationDeadlines.winter)?.status === 'closed' && tuDc.applicationDeadlines.winter.end === '15 May 2026', 'D&C keeps its passed 2026/27 round, not an invented annual deadline');
check(!checkProgram(udkDc, udk, nonEu).steps.some((s) => s.text.startsWith('Send to uni-assist')), 'sourced programme portal instructions override a school-membership route guess');
check(!checkProgram(udkDc, udk, EMPTY_PROFILE).checks.some((c) => c.text.includes('grades count')), 'restricted admission alone does not imply a grade-based NC');
const vk = prog(udk, /Visual Communication Bachelor/);
const vkMaster = prog(udk, /Visual Communication Master/);
check(vk.duration === '8 semesters' && vkMaster.duration === '2 semesters', 'UdK Visual Communication BA/MA have verified durations');
check(!vk.language && vk.details.languageNotes[0].includes('B2'), 'a German certificate rule does not invent teaching language, and the B2 application option is retained');
check(programSearchMatch(vk, 'Digitale Klasse').area?.includes('New Media') === true, 'Digitale Klasse search opens its actual Visual Communication parent');
check(passesFilters(udk, { ...none, search: 'Digitale Klasse', degree: 'Master' }) && !passesFilters(udk, { ...none, search: 'Digitale Klasse', language: 'English' }), 'class search and degree/language filters must match the same parent programme');
const offenbach = school('Hochschule für Gestaltung Offenbach');
const art = prog(offenbach, /Art \(Kunst\) Bachelor/);
check(art.degree === 'Bachelor of Fine Arts' && programSearchMatch(art, 'Elektronische Medien').score > 0, 'Offenbach electronic media belongs to Art BFA, not a standalone degree');
check(!offenbach.programs.filter((p: any) => p.degree === 'Diploma').some((p: any) => Object.keys(p.applicationDeadlines).length || admissionOf(p, offenbach.type)), 'phased-out Offenbach diploma intakes have no future windows or NC-free claim');
const bremen = school('Universität Bremen');
const bremenMaster = prog(bremen, /Digitale Medien Master/);
check(bremenMaster.degree === 'Master of Science' && bremenMaster.language === 'English' && bremenMaster.jointProfile.includes('Informatics'), 'Bremen university joint master is the informatics MSc, not HfK’s design MA');
check(prog(bremen, /Digitale Medien Bachelor/).degree === 'Bachelor of Science', 'Bremen university bachelor award is BSc; its immutable ID is preserved');
const hda = school('Hochschule Darmstadt');
const expanded = prog(hda, /Expanded Media Master/);
check(expanded.specializations.includes('Expanded Realities') && expanded.duration === '3/4 semesters', 'h_da Expanded Realities is a track within Expanded Media MA');
check(hda.programs.filter(available).length === 17, 'h_da current Architecture/Media/Design catalogue is covered by 17 verified entries');
check(prog(hda, /Communication Design/).degree === 'Diploma (FH)' && prog(hda, /Motion Pictures/).language === 'English', 'h_da Communication Design degree and Motion Pictures language are corrected');
check(programSearchMatch(prog(hda, /User Experience Design/), 'Interactive Media Design').score === 100, 'h_da former Interactive Media Design searches the current User Experience Design programme');
check(!passesFilters(hda, { ...none, search: 'Digital Media', degree: 'Master', language: 'English' }), 'unsupported h_da Digital Media MSc does not satisfy active programme filters');
check(passesFilters(hda, { ...none, search: 'Expanded Media', semester: 'summer', degree: 'Master' }), 'verified intake survives filters even without a universal application window');
check(expanded.otherDeadlines.some((d: any) => d.semester === 'winter' && d.scope === 'international applicants' && d.end === '06-01') && Object.keys(expanded.applicationDeadlines).length === 0, 'h_da international/domestic deadlines remain scoped, not a universal annual window');
check(fhp.programs.find((p: any) => p.name === 'Interface Design').duration === '8 semesters', 'FH Potsdam Interface Design is eight semesters');

if (failed) process.exit(1);
