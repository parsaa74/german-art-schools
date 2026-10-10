'use client'

/**
 * Shortlist — the programs a user keeps, as an application plan: next deadline
 * per program (most urgent first), admission route, uni-assist cost, calendar
 * export and a share link. With the user's situation filled in it becomes the
 * application check (lib/applicationCheck). Saved in this browser (see shortlistStore).
 */

import { useEffect, useMemo, useState } from 'react';
import { Bookmark, CalendarPlus, Link2, X, Check as CheckIcon, AlertTriangle, Info } from 'lucide-react';
import { useSchoolStore } from '@/stores/schoolStore';
import { useShortlist } from '@/stores/shortlistStore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getNextDeadline } from '@/utils/deadlineUtils';
import { generateAllDeadlinesICalFile, downloadICalFile } from '@/utils/icalExport';
import { admissionOf, degreeAbbrev, feeLine, uniAssistFee, type Fee } from '@/lib/taxonomy';
import { checkProgram, Profile, Level, LEVEL_LABELS, Check } from '@/lib/applicationCheck';

const URGENCY: Record<string, number> = { 'closing-soon': 0, open: 1, upcoming: 2, closed: 3 };

export function Shortlist() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { ids, add, remove, clear, profile, setProfile } = useShortlist();
  const answered = Object.values(profile).some((v) => v !== null);
  const programById = useSchoolStore((s) => s.programById);
  const universityById = useSchoolStore((s) => s.universityById);
  const setSelectedUniversity = useSchoolStore((s) => s.setSelectedUniversity);
  const setSelectedProgramId = useSchoolStore((s) => s.setSelectedProgramId);

  // A shared link (?keep=id,id) adds its programs to this browser's list once.
  useEffect(() => {
    if (!programById.size) return;
    const params = new URLSearchParams(window.location.search);
    const shared = params.get('keep');
    if (!shared) return;
    const valid = shared.split(',').filter((id) => programById.has(id));
    if (valid.length) { add(valid); setOpen(true); }
    params.delete('keep');
    const rest = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);
  }, [programById, add]);

  const rows = useMemo(() => ids.flatMap((id) => {
    const info = programById.get(id);
    const school = info && universityById.get(info.schoolId);
    if (!info || !school) return []; // program no longer in the data
    const next = info.program.applicationDeadlines ? getNextDeadline(info.program.applicationDeadlines) : null;
    return [{ id, program: info.program, school, next, admission: admissionOf(info.program, school.type), ...checkProgram(info.program, school, profile) }];
  }).sort((a, b) =>
    (URGENCY[a.next?.status.status ?? ''] ?? 4) - (URGENCY[b.next?.status.status ?? ''] ?? 4) ||
    (a.next?.status.daysRemaining ?? 999) - (b.next?.status.daysRemaining ?? 999)
  ), [ids, programById, universityById, profile]);

  // A German school certificate does not establish where a master's first degree was earned.
  // Keep sourced foreign-degree handling routes visible as possible costs, not a fee verdict.
  const viaUniAssist = rows.filter((r) => r.program.applicationMethods
    ? r.program.applicationMethods.includes('uni-assist')
    : profile.certificate !== 'german' && r.school.applicationMethod === 'uni-assist').length;
  const rowFees = (r: typeof rows[number]): Fee[] => {
    const all: Fee[] = [...(r.school.fees ?? []), ...(r.program.fees ?? [])];
    return all.filter((f, i) => all.findIndex((other) => JSON.stringify(other) === JSON.stringify(f)) === i);
  };
  const today = new Date();
  const steps = rows.flatMap((r) => r.steps).filter((st) => st.date >= today).sort((a, b) => +a.date - +b.date);
  const tuitionSchools = profile.citizenship === 'non-eu' && profile.certificate !== 'german'
    ? [...new Set(rows.filter((r) => r.school.nonEuTuition).map((r) => r.school.name))] : [];

  const openProgram = (r: typeof rows[number]) => {
    setSelectedUniversity(r.school);
    setSelectedProgramId(r.id);
    setOpen(false);
  };

  const exportCalendar = () => {
    const bySchool = new Map<string, { name: string; website?: string; programs: any[] }>();
    rows.forEach((r) => {
      const entry = bySchool.get(r.school.name) ?? { name: r.school.name, website: r.school.website, programs: [] };
      entry.programs.push(r.program);
      bySchool.set(r.school.name, entry);
    });
    downloadICalFile(generateAllDeadlinesICalFile([...bySchool.values()]), 'my-shortlist-deadlines.ics');
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?keep=${rows.map((r) => r.id).join(',')}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link to open your shortlist on another device:', url);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 ui-organic text-white transition-all duration-300"
        aria-label={`Your shortlist (${rows.length})`}
        title="Your shortlist"
      >
        <Bookmark size={18} fill={rows.length ? 'currentColor' : 'none'} />
        {rows.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-cyan-500 text-[0.6rem] font-semibold leading-[1.1rem] text-center">
            {rows.length}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-xl w-[95vw] border-white/10 overflow-hidden">
          <div className="ui-organic text-gray-100 max-h-[85vh] overflow-y-auto p-5">
            <DialogTitle className="text-lg font-semibold text-white">Your shortlist {rows.length > 0 && `(${rows.length})`}</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1 mb-4">
              Saved in this browser — no account needed. Use “Copy link” to open it on your phone or share it.
            </DialogDescription>

            <SituationForm profile={profile} setProfile={setProfile} initiallyOpen={!answered} />

            {rows.length === 0 ? (
              <p className="text-sm text-slate-300 py-6 text-center">
                Open a program and press <b className="text-white">Keep</b> to collect it here.
              </p>
            ) : (
              <>
                <ul className="space-y-1.5">
                  {rows.map((r) => (
                    <li key={r.id} className="flex items-start gap-2 rounded-soft hover:bg-white/5 px-2 py-2">
                      <button onClick={() => openProgram(r)} className="flex-1 min-w-0 text-left">
                        <span className="block text-sm text-white">
                          {r.program.name}{degreeAbbrev(r.program.degree) && <span className="text-slate-400"> · {degreeAbbrev(r.program.degree)}</span>}
                        </span>
                        <span className="block text-xs text-slate-400">{r.school.name}</span>
                        {answered ? <CheckList checks={r.checks} /> : (
                        <span className="mt-1 flex flex-wrap gap-1.5 text-[0.65rem]">
                          {r.next ? (
                            <span className={`px-2 py-0.5 rounded-full border ${r.next.status.color}`}>
                              {r.next.status.label} · {r.next.semester} · until {r.next.deadline.end}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full border border-white/15 text-slate-400">Deadline unknown</span>
                          )}
                          {r.admission && (
                            <span className="px-2 py-0.5 rounded-full border border-white/15 text-slate-300">
                              {r.admission === 'aptitude' ? 'Portfolio / aptitude test' : 'Open admission'}
                            </span>
                          )}
                          {r.school.applicationMethod && (
                            <span className="px-2 py-0.5 rounded-full border border-white/15 text-slate-300">
                              {r.school.applicationMethod === 'uni-assist' ? 'via uni-assist' : 'apply directly'}
                            </span>
                          )}
                        </span>
                        )}
                        {rowFees(r).length > 0 && (
                          <span className="block mt-1 text-[0.65rem] text-slate-300 space-y-0.5">
                            {rowFees(r).map((f, i) => <span key={i} className="block">{feeLine(f)}</span>)}
                          </span>
                        )}
                      </button>
                      <button onClick={() => remove(r.id)} aria-label={`Remove ${r.program.name} from shortlist`} className="p-1 text-slate-500 hover:text-white">
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>

                {answered && steps.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <h3 className="text-xs uppercase tracking-wider text-cyan-300 mb-1.5">Next steps</h3>
                    <ol className="space-y-1 text-xs text-slate-200">
                      {steps.map((st, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="w-24 flex-shrink-0 text-slate-400">{st.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span>{st.text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <p className="mt-4 text-xs text-slate-300 border-t border-white/10 pt-3">
                  {profile.certificate === 'german' && <>A German school certificate may change your route; master’s applicants must also check the origin of their first degree. </>}
                  {viaUniAssist > 0
                    ? <>For non-German qualifications, {viaUniAssist === 1
                        ? <>1 of these may go through uni-assist: <b className="text-white">€75</b> handling fee (each further program in the same semester adds €30).</>
                        : <>{viaUniAssist} of these may go through uni-assist: about <b className="text-white">€{uniAssistFee(viaUniAssist)}</b> in handling fees if you apply to all of them in the same semester (€75 first, €30 each further).</>}</>
                    : <>No uni-assist handling step is identified for this selection; confirm programme-specific credential checks and fees.</>}
                  <> Tuition, enrolment and semester contributions are separate; see the scoped fees above.</>
                  {tuitionSchools.length > 0 && <> Tuition for non-EU students applies at {tuitionSchools.join(', ')} (see each program).</>}
                  {profile.citizenship === 'non-eu' && profile.certificate !== 'german' && <> Other schools may charge too — Bavaria and Saxony let each school decide.</>}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={exportCalendar} className="flex items-center gap-1.5 rounded-full border border-cyan-300/50 bg-cyan-400/10 px-3.5 py-1.5 text-sm text-cyan-100 hover:bg-cyan-400/20 transition">
                    <CalendarPlus size={14} /> Add deadlines to calendar
                  </button>
                  <button onClick={copyLink} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-slate-200 hover:bg-white/10 transition">
                    <Link2 size={14} /> {copied ? 'Link copied' : 'Copy link'}
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Remove all programs from your shortlist?')) clear(); }}
                    className="ml-auto rounded-full px-3.5 py-1.5 text-sm text-slate-400 hover:text-red-300 transition"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const ICONS = { ok: <CheckIcon size={12} className="text-emerald-400" />, warn: <AlertTriangle size={12} className="text-amber-400" />, info: <Info size={12} className="text-slate-400" /> };

function CheckList({ checks }: { checks: Check[] }) {
  return (
    <ul className="mt-1.5 space-y-1 text-[0.7rem] text-slate-300">
      {checks.map((c, i) => (
        <li key={i} className="flex items-start gap-1.5">
          <span className="mt-0.5 flex-shrink-0">{ICONS[c.level]}</span>
          <span>
            {c.text}
            {c.source && <> <a href={c.source} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-300 hover:underline">source</a></>}
          </span>
        </li>
      ))}
    </ul>
  );
}

const LEVELS: Level[] = ['none', 'a', 'b1', 'b2', 'c1'];

/** The user's situation — seven questions, answered once, kept in this browser. */
function SituationForm({ profile, setProfile, initiallyOpen }: { profile: Profile; setProfile: (p: Partial<Profile>) => void; initiallyOpen: boolean }) {
  const [open] = useState(initiallyOpen);
  const field = (label: string, key: keyof Profile, options: Array<[string, string]>) => (
    <label className="block">
      <span className="block text-[0.7rem] text-cyan-200 mb-0.5">{label}</span>
      <select
        value={profile[key] === null ? '' : String(profile[key])}
        onChange={(e) => {
          const v = e.target.value;
          setProfile({ [key]: v === '' ? null : v === 'true' ? true : v === 'false' ? false : v } as Partial<Profile>);
        }}
        className="w-full bg-gray-800/60 border border-white/20 text-gray-100 text-xs rounded-soft p-1.5"
      >
        <option value="">—</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
  return (
    <details open={open} className="mb-4 rounded-soft border border-white/10 bg-white/5 px-3 py-2">
      <summary className="cursor-pointer text-sm text-white">
        Your situation <span className="text-xs text-slate-400">— turns this list into a personal check. Stays on your device.</span>
      </summary>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
        {field('Citizenship', 'citizenship', [['eu', 'EU / EEA'], ['non-eu', 'Outside the EU / EEA']])}
        {field('School-leaving certificate from', 'certificate', [['german', 'Germany'], ['foreign', 'Another country']])}
        {field('First degree (bachelor) by the start?', 'firstDegree', [['true', 'Yes'], ['false', 'No']])}
        {field('Portfolio', 'portfolio', [['ready', 'Ready'], ['in-progress', 'Working on it'], ['none', 'Not yet']])}
        {field('German level', 'german', LEVELS.map((l) => [l, LEVEL_LABELS[l]]))}
        {field('English level', 'english', LEVELS.map((l) => [l, LEVEL_LABELS[l]]))}
        {field('Start in', 'semester', [['winter', 'Winter semester'], ['summer', 'Summer semester']])}
      </div>
    </details>
  );
}
