'use client'

import { useEffect, useMemo } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'
import { useSchoolStore } from '@/stores/schoolStore'
import { useShortlist } from '@/stores/shortlistStore'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { admissionOf, ADMISSION_LABELS, feeLine, type Fee } from '@/lib/taxonomy'
import type { ProcessedUniversity } from '@/stores/schoolStore'

type Program = NonNullable<ProcessedUniversity['programs']>[number]

const STATUS_TEXT: Record<string, string> = {
  discontinued: 'No longer admitting new students',
  'not-matched': 'Not found in the school’s current catalogue — check what they offer now',
  renamed: 'Now offered under another name',
}
const DEADLINE_KINDS: Record<string, string> = {
  application: 'Application', portfolio: 'Portfolio upload', 'aptitude-registration': 'Aptitude test registration',
  audition: 'Audition', 'uni-assist': 'Via uni-assist', vpd: 'uni-assist VPD',
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** "2027-01-18" -> "18 January 2027", "05-02" -> "2 May" */
const day = (s: string) => { const [a, b, c] = s.split('-').map(Number); return c ? `${c} ${MONTHS[b - 1]} ${a}` : `${b} ${MONTHS[a - 1]}` }
const span = (start?: string | null, end?: string) => (start ? `${start} — ${end}` : `until ${end}`)
const checkedOn = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

const DEGREE_STYLES: Record<string, string> = {
  bachelor: 'border-cyan-400/50 text-cyan-300 bg-cyan-500/20',
  master: 'border-pink-400/50 text-pink-300 bg-pink-500/20',
  diploma: 'border-amber-400/50 text-amber-300 bg-amber-500/20',
  phd: 'border-violet-400/50 text-violet-300 bg-violet-500/20',
  doctorate: 'border-violet-400/50 text-violet-300 bg-violet-500/20',
  certificate: 'border-emerald-400/50 text-emerald-300 bg-emerald-500/20',
  default: 'border-gray-400/50 text-gray-300 bg-gray-500/20',
}

function degreeKey(degree: string | undefined): keyof typeof DEGREE_STYLES {
  if (!degree) return 'default'
  const d = degree.toLowerCase()
  if (d.includes('bachelor')) return 'bachelor'
  if (d.includes('master')) return 'master'
  if (d.includes('diploma')) return 'diploma'
  if (d.includes('phd') || d.includes('doctor')) return 'phd'
  if (d.includes('certif')) return 'certificate'
  return 'default'
}

export function ProgramInfoPanel() {
  const selectedProgramId = useSchoolStore(s => s.selectedProgramId)
  const setSelectedProgramId = useSchoolStore(s => s.setSelectedProgramId)
  const programById = useSchoolStore(s => s.programById)
  const similarPrograms = useSchoolStore(s => s.similarPrograms)
  const universityById = useSchoolStore(s => s.universityById)
  const setSelectedUniversity = useSchoolStore(s => s.setSelectedUniversity)

  const entry = selectedProgramId ? programById.get(selectedProgramId) : null
  const program = entry?.program

  // similar programs at OTHER schools (scripts/build-relations.ts)
  const related = useMemo(() => {
    if (!selectedProgramId) return []
    return (similarPrograms.get(selectedProgramId) ?? []).flatMap(({ id, score }) => {
      const info = programById.get(id)
      return info ? [{ id, score, schoolId: info.schoolId, schoolName: info.schoolName, name: info.program.name, degree: info.program.degree }] : []
    })
  }, [selectedProgramId, similarPrograms, programById])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedProgramId) setSelectedProgramId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedProgramId, setSelectedProgramId])

  const kept = useShortlist((s) => !!selectedProgramId && s.ids.includes(selectedProgramId))
  const toggleKeep = useShortlist((s) => s.toggle)
  const isOpen = !!(selectedProgramId && program)
  const admission = program ? admissionOf(program, universityById.get(entry!.schoolId)?.type ?? '') : undefined
  const details = program?.details
  const deg = degreeKey(program?.degree)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="program-name-heading"
          className={cn(
            'fixed top-4 left-4 z-[500] w-[min(22rem,calc(100vw-2rem))] ui-organic text-gray-100 !bg-slate-950/95 !bg-none',
            'max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden',
            'scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent hover:scrollbar-thumb-white/50',
          )}
          initial={{ opacity: 0, x: -30, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 bg-gradient-to-b from-black/90 via-black/80 to-transparent backdrop-blur-sm px-5 pt-5 pb-3 border-b border-white/10">
            <div className="flex justify-between items-start gap-3 mb-2">
              <h2 id="program-name-heading" className="text-lg font-semibold text-white leading-tight pr-2 flex-1">
                {program.name}
              </h2>
              <button
                onClick={() => setSelectedProgramId(null)}
                className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-pill transition-all duration-300 focus:outline-none flex-shrink-0"
                aria-label="Close program panel"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => toggleKeep(selectedProgramId!)}
              aria-pressed={kept}
              className={cn(
                'mb-2 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition',
                kept ? 'border-cyan-300/70 bg-cyan-400/20 text-cyan-100' : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
              )}
            >
              <Bookmark size={12} fill={kept ? 'currentColor' : 'none'} />
              {kept ? 'Kept — in your shortlist' : 'Keep'}
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('inline-block px-3 py-1 text-[0.6rem] font-medium rounded-pill border tracking-wide uppercase', DEGREE_STYLES[deg])}>
                {program.degree}
              </span>
              {program.language && (
                <span className="text-[0.65rem] text-gray-400 uppercase tracking-wide">{program.language}</span>
              )}
              {program.duration && (
                <span className="text-[0.65rem] text-gray-400">{program.duration}</span>
              )}
            </div>
            <button
              className="text-[0.65rem] text-gray-400 hover:text-gray-200 hover:underline underline-offset-2 mt-1 truncate max-w-full text-left"
              onClick={() => { const u = universityById.get(entry!.schoolId); if (u) setSelectedUniversity(u) }}
            >
              at {entry!.schoolName}
            </button>
          </div>

          <div className="px-4 pb-4 pt-2 space-y-2">
            {program.status && STATUS_TEXT[program.status.status] && (
              <div role="note" className="mt-2 rounded-soft border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-[0.7rem] text-amber-100">
                {STATUS_TEXT[program.status.status]}.{program.status.notes && <span className="text-amber-200/80"> {program.status.notes}</span>}
              </div>
            )}

            {program.description && (
              <Section title="About">
                <p>{program.description}</p>
              </Section>
            )}

            {!!program.jointWith?.length && (
              <Section title="Joint programme">
                {program.jointProfile && <p className="mb-1">This profile: {program.jointProfile} · {program.degree}</p>}
                <p className="text-gray-400">Offered together with:</p>
                {program.jointWith.map((schoolId: string) => {
                  const partner = universityById.get(schoolId)
                  return partner ? <button key={schoolId} className="block text-blue-300 hover:underline text-left" onClick={() => { setSelectedProgramId(null); setSelectedUniversity(partner) }}>{partner.name}</button> : null
                })}
                {program.jointProfile && <p className="mt-1 text-gray-400">The partner profile has a different degree; apply through the institution for your chosen profile.</p>}
              </Section>
            )}

            {!!program.teachingAreas?.length && (
              <Section title="Classes & teaching areas">
                <p className="text-gray-400 mb-1">Within this programme — not separately awarded degrees.</p>
                {program.teachingAreas.map((a: { name: string; source: string }, i: number) => <a key={i} href={a.source} target="_blank" rel="noopener noreferrer" className="block text-blue-300 hover:underline">{a.name}</a>)}
              </Section>
            )}

            {!!program.intakes?.length && (
              <Section title="Intake">
                <p>{program.intakes.join(' / ')} semester. Application dates may depend on your qualification and route.</p>
              </Section>
            )}

            {program.applicationRoute && (
              <Section title="Application route">
                <p>{program.applicationRoute.notes}</p>
                {program.applicationRoute.url && <a href={program.applicationRoute.url} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">Official application instructions</a>}
              </Section>
            )}

            {program.specializations && program.specializations.length > 0 && (
              <Section title="Specializations">
                <div className="flex flex-wrap gap-1">
                  {program.specializations.map((s: string, i: number) => (
                    <span key={i} className="px-2 py-1 border border-white/20 rounded-soft text-[0.65rem] text-gray-200 bg-white/10">
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {!!(program.applicationDeadlines?.winter || program.applicationDeadlines?.summer || program.otherDeadlines?.length) && (
              <Section title="Application Deadlines">
                <div className="space-y-1">
                  {program.applicationDeadlines?.winter && (
                    <div className="text-[0.7rem]">
                      <span className="text-blue-300 mr-2">Winter:</span>
                      {span(program.applicationDeadlines.winter.start, program.applicationDeadlines.winter.end)}
                    </div>
                  )}
                  {program.applicationDeadlines?.summer && (
                    <div className="text-[0.7rem]">
                      <span className="text-amber-300 mr-2">Summer:</span>
                      {span(program.applicationDeadlines.summer.start, program.applicationDeadlines.summer.end)}
                    </div>
                  )}
                  {program.otherDeadlines?.map((d: NonNullable<Program['otherDeadlines']>[number], i: number) => (
                    <div key={i} className="text-[0.7rem]">
                      <span className="text-gray-300 mr-2">{DEADLINE_KINDS[d.kind] ?? d.kind}{d.semester ? ` (${d.semester})` : ''}:</span>
                      {span(d.start && day(d.start), day(d.end))}
                      {d.scope && <span className="text-gray-500"> — {d.scope}</span>}
                    </div>
                  ))}
                  {/\d{4}$/.test(program.applicationDeadlines?.winter?.end ?? program.applicationDeadlines?.summer?.end ?? '') && (
                    <p className="text-[0.6rem] text-gray-500">Dates with a year are for that round only; the school hasn’t promised the same dates next year.</p>
                  )}
                </div>
              </Section>
            )}

            {(admission || program.admission === 'restricted' || program.admission === 'aptitude-and-restricted') && (
              <Section title="Admission">
                <p>{admission ? ADMISSION_LABELS[admission] : 'Restricted admission — check the programme’s selection criteria'}{program.admission === 'aptitude-and-restricted' ? '; also requires artistic aptitude / work samples' : ''}.</p>
                {program.admissionSource && (
                  <a href={program.admissionSource} target="_blank" rel="noopener noreferrer" className="text-[0.65rem] text-blue-300 hover:underline">Source</a>
                )}
              </Section>
            )}

            {!!(program.requirements?.length || program.fees?.length || (details && (details.portfolioRequired != null || details.tuitionEuroPerSemester != null || details.capacity != null || details.languageRequirements || details.languageNotes))) && (
              <Section title="Requirements">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.7rem]">
                  {details?.portfolioRequired != null && (
                    <div>
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wide">Portfolio</div>
                      <div>{details.portfolioRequired ? 'Required' : 'Not required'}</div>
                    </div>
                  )}
                  {details?.tuitionEuroPerSemester != null && (
                    <div>
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wide">Tuition</div>
                      <div>€{details.tuitionEuroPerSemester}/sem</div>
                    </div>
                  )}
                  {details?.capacity != null && (
                    <div>
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wide">Capacity</div>
                      <div>{details.capacity}</div>
                    </div>
                  )}
                  {(details?.languageNotes?.length || details?.languageRequirements) && (
                    <div className="col-span-2">
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wide">Language</div>
                      {(details.languageNotes ?? [details.languageRequirements]).map((t: string, i: number) => <div key={i}>{t}</div>)}
                    </div>
                  )}
                  {program.requirements?.map((r: { label: string; text: string }, i: number) => (
                    <div key={i} className="col-span-2">
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wide">{r.label}</div>
                      <div>{r.text}</div>
                    </div>
                  ))}
                  {!!program.fees?.length && (
                    <div className="col-span-2">
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wide">Costs</div>
                      {program.fees.map((f: Fee, i: number) => <div key={i}>{feeLine(f)}{f.notes && <p className="text-xs text-slate-400">{f.notes}</p>}</div>)}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {details?.faculty && details.faculty.length > 0 && (
              <Section title={`Faculty (${details.faculty.length})`}>
                <ul className="space-y-1">
                  {details.faculty.slice(0, 12).map((f: any, i: number) => (
                    <li key={i} className="text-[0.7rem]">
                      {f.profileUrl ? (
                        <a href={f.profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 hover:underline">
                          {f.title ? `${f.title} ` : ''}{f.name}
                        </a>
                      ) : (
                        <span>{f.title ? `${f.title} ` : ''}{f.name}</span>
                      )}
                      {f.role && <span className="text-gray-500"> — {f.role}</span>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {(details?.programUrl || details?.applicationUrl) && (
              <Section title="Links">
                <div className="flex flex-col gap-1.5">
                  {details.programUrl && (
                    <a href={details.programUrl} target="_blank" rel="noopener noreferrer" className="text-[0.7rem] text-blue-300 hover:text-blue-200 hover:underline break-all">
                      → Program page
                    </a>
                  )}
                  {details.applicationUrl && (
                    <a href={details.applicationUrl} target="_blank" rel="noopener noreferrer" className="text-[0.7rem] text-blue-300 hover:text-blue-200 hover:underline break-all">
                      → Application page
                    </a>
                  )}
                </div>
              </Section>
            )}

            {program.sources && program.researched && (
              <Section title={`Sources · checked ${checkedOn(program.researched)}`}>
                <ul className="space-y-0.5">
                  {[...new Set(Object.values(program.sources as Record<string, string>))].map((url) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-[0.65rem] text-blue-300 hover:underline break-all">
                        {url.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[0.6rem] text-gray-500">Taken from the school’s own pages. Rules change — confirm on the page before applying.</p>
              </Section>
            )}

            {related.length > 0 && (
              <Section title="Similar programs at other schools">
                <ul className="space-y-1">
                  {related.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => {
                          const u = universityById.get(r.schoolId)
                          if (u) setSelectedUniversity(u)
                          setSelectedProgramId(r.id)
                        }}
                        className="text-left w-full group"
                      >
                        <div className="flex items-start justify-between gap-2 px-2 py-1.5 rounded-soft hover:bg-white/5 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="text-[0.7rem] text-gray-200 group-hover:text-white truncate">{r.name}</div>
                            <div className="text-[0.6rem] text-gray-500 truncate">{[r.degree, r.schoolName].filter(Boolean).join(' · ')}</div>
                          </div>
                          <span className="text-[0.6rem] text-cyan-300 flex-shrink-0 pt-0.5">
                            {r.score >= 0.6 ? 'Very close' : r.score >= 0.45 ? 'Close' : 'Related'}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-white/5 last:border-b-0">
      <h3 className="text-[0.65rem] font-medium text-blue-300/80 tracking-wide uppercase mb-1.5">
        {title}
      </h3>
      <div className="text-[0.75rem] text-gray-100 leading-snug">{children}</div>
    </div>
  )
}

export default ProgramInfoPanel
