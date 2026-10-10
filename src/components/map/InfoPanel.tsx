'use client'

import { useEffect, useRef, useMemo } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'
import { shallow } from 'zustand/shallow'
import { useShortlist } from '@/stores/shortlistStore'
import { useSchoolStore, type ProcessedUniversity } from '@/stores/schoolStore'
import { cn } from '@/lib/utils'
import { getNextDeadline, getAllUpcomingDeadlines } from '@/utils/deadlineUtils'
import { generateSchoolICalFile, downloadICalFile } from '@/utils/icalExport'
import { getLogoForSchool } from '@/data/universityLogos'
import { typeLabel, typeColor, degreeAbbrev, admissionOf, feeLine, KIN_COLOR, TIER_LABELS, TIER_OPACITY } from '@/lib/taxonomy'
import { filtersFromState, matchingPrograms } from '@/lib/glass/filter'

// Define the props interface for InfoPanel
interface InfoPanelProps {
  school: ProcessedUniversity | null
  isOpen: boolean
  onClose: () => void
  className?: string
}

// --- Helper Component for Panel Sections ---
interface PanelSectionProps {
  title?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  delay?: number
}

function PanelSection({ title, icon, children, className, delay = 0 }: PanelSectionProps) {
  return (
    <motion.div
      className={cn("py-2 border-b border-white/5 last:border-b-0", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05 + delay * 0.03 }}
    >
      {title && (
        <div className="flex items-center mb-1.5">
          {icon && <div className="mr-2 text-blue-400/70 flex-shrink-0">{icon}</div>}
          <h3 className="text-[0.65rem] font-medium text-blue-300/80 tracking-wide uppercase">
            {title}
          </h3>
        </div>
      )}
      <div className={cn("text-[0.75rem] text-gray-100 leading-snug", { 'pl-[1.5rem]': icon })}>
        {children}
      </div>
    </motion.div>
  )
}

// --- Main Component ---
export default function InfoPanel({
  school,
  isOpen,
  onClose,
  className = ''
}: InfoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const selectedProgramId = useSchoolStore((s) => s.selectedProgramId)
  const keptIds = useShortlist((s) => s.ids)
  const setSelectedProgramId = useSchoolStore((s) => s.setSelectedProgramId)
  // programs that satisfy the active filters get highlighted
  const filters = useSchoolStore((s) => filtersFromState(s), shallow)
  const programFiltered = !!(filters.program || filters.degree || filters.language || filters.semester || filters.nc)
  const matched = useMemo(
    () => new Set(programFiltered && school ? matchingPrograms(school, filters).map((p: any) => p.program_id) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [school, programFiltered, filters.program, filters.degree, filters.language, filters.semester, filters.nc]
  )

  const handleClose = onClose

  // Escape closes the program panel first (it has its own handler), then this one.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !useSchoolStore.getState().selectedProgramId) handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  return (
    <AnimatePresence>
      {isOpen && school && (
        <motion.div
      ref={panelRef}
      id="info-panel"
      role="dialog"
          aria-modal="true"
      aria-labelledby="school-name-heading"
          className={cn(
            'fixed top-4 right-4 z-[500] w-[min(22rem,calc(100vw-2rem))] ui-organic text-gray-100',
            'max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden',
            'scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent hover:scrollbar-thumb-white/50',
            className
          )}
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={(e) => e.stopPropagation()}
    >
          <div className="sticky top-0 z-10 bg-gradient-to-b from-black/90 via-black/80 to-transparent backdrop-blur-sm px-4 pt-3 pb-2 border-b border-white/10">
            <div className="flex justify-between items-start mb-1.5 gap-2">
          {getLogoForSchool(school.id) && (
            <img
              src={getLogoForSchool(school.id)}
              alt={`${school.name} logo`}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              className="w-10 h-10 object-contain flex-shrink-0 rounded bg-white/90 p-1"
            />
          )}
          <h2
            id="school-name-heading"
                className="text-lg font-semibold text-white leading-tight pr-3 flex-1"
          >
            {school.name}
          </h2>
          <button
            onClick={handleClose}
                className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-pill transition-all duration-300 focus:outline-none flex-shrink-0 hover:scale-110"
            aria-label="Close information panel"
          >
                <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
          <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[0.6rem] font-medium rounded-pill border border-white/20 bg-white/5 tracking-wide uppercase text-gray-200"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: typeColor(school.type) }} aria-hidden />
            {typeLabel(school.type)}
          </span>
      </div>


          <div className="px-4 pb-4 pt-2 space-y-0">
            <PanelSection title="Location" icon={<LocationIcon />} delay={0}>
              <p>{school.city || 'N/A'}, {school.state || 'N/A'}</p>
            </PanelSection>

        {school.description && (
              <PanelSection title="About" icon={<InfoIcon />} delay={1}>
                <p>{school.description}</p>
              </PanelSection>
        )}

        {(school.founded || school.students) && (
              <PanelSection title="Stats" icon={<StatsIcon />} delay={2}>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {school.founded && (
                <div>
                      <div className="text-[0.6rem] text-gray-400 mb-0.5 tracking-wide">Founded</div>
                      <div className="text-sm">{school.founded}</div>
                </div>
              )}
              {school.students && (
                <div>
                      <div className="text-[0.6rem] text-gray-400 mb-0.5 tracking-wide">Students</div>
                      <div className="text-sm">{school.students}</div>
                </div>
              )}
            </div>
              </PanelSection>
        )}

        {school.programs && school.programs.length > 0 && (
              <PanelSection title={`Programs (${school.programs.length})${programFiltered ? ` · ${matched.size} match your filters` : ''}`} icon={<ProgramIcon />} delay={3}>
                <div className="flex flex-wrap gap-1">
                  {school.programs.map((prog: any) => {
                    const deg = degreeAbbrev(prog.degree)
                    const isOpenProgram = selectedProgramId === prog.program_id
                    return (
                      <button
                        key={prog.program_id}
                        onClick={() => setSelectedProgramId(isOpenProgram ? null : prog.program_id)}
                        aria-pressed={isOpenProgram}
                        className={cn(
                          'px-2 py-1 border rounded-soft text-[0.65rem] text-left transition-colors duration-200',
                          isOpenProgram ? 'border-cyan-300/80 bg-cyan-400/20 text-white'
                            : matched.has(prog.program_id) ? 'border-cyan-300/50 bg-cyan-400/10 text-gray-100 hover:bg-cyan-400/20'
                            : 'border-white/20 bg-white/10 text-gray-200 hover:bg-white/20'
                        )}
                      >
                        {keptIds.includes(prog.program_id) && <span className="text-cyan-300" aria-label="kept">★ </span>}
                        {prog.name}{deg && <span className="text-gray-400"> · {deg}</span>}
                      </button>
                    )
                  })}
                </div>
              </PanelSection>
            )}

            <PanelSection title="How to apply" icon={<ApplyIcon />} delay={4}>
              {school.applicationMethod === 'uni-assist' ? (
                <p>International applicants may need to go through <a className="text-blue-400 hover:underline" href="https://www.uni-assist.de/en/" target="_blank" rel="noopener noreferrer">uni-assist</a> (€75 first program, €30 each extra) — check the program page.</p>
              ) : school.applicationMethod === 'direct' ? (
                <p>Direct application route — check programme-specific foreign-qualification validation and handling fees below.</p>
              ) : (
                <p className="text-gray-400">Application route unknown.</p>
              )}
              {school.applicationRoute?.notes && (
                <p className="mt-1 text-gray-300">
                  {school.applicationRoute.notes}
                  {school.applicationRoute.scope && school.applicationRoute.scope !== 'all applicants' && <span className="text-gray-500"> ({school.applicationRoute.scope})</span>}
                  {school.sources?.applicationRoute && <> · <a className="text-blue-400 hover:underline" href={school.sources.applicationRoute} target="_blank" rel="noopener noreferrer">source</a></>}
                </p>
              )}
              <AdmissionSummary school={school} />
            </PanelSection>

            {!!school.fees?.length && (
              <PanelSection title="Costs" icon={<StatsIcon />} delay={4}>
                <ul className="space-y-0.5">
                  {school.fees.map((f, i) => <li key={i}>{feeLine(f)}</li>)}
                </ul>
                {school.sources?.fees && (
                  <a className="text-[0.65rem] text-blue-400 hover:underline" href={school.sources.fees} target="_blank" rel="noopener noreferrer">Source</a>
                )}
              </PanelSection>
            )}

            {school.programs && school.programs.length > 0 && (
              <DeadlineSection school={school} delay={5} />
            )}

            <SimilarSchools school={school} />

            {school.website && (
              <PanelSection title="Website" icon={<WebsiteIcon />} delay={7}>
            <a
              href={school.website}
              target="_blank"
              rel="noopener noreferrer"
                  className="inline-block text-blue-400 hover:text-blue-300 hover:underline underline-offset-2 break-all transition-colors duration-200 group"
                >
                  {school.website.replace(/^https?:\/\//, '')}
                  <span className="inline-block ml-1 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">→</span>
                </a>
                {school.contact && (
                  <div className="mt-1 text-gray-300">
                    {school.contact.email && <a className="text-blue-400 hover:underline mr-3" href={`mailto:${school.contact.email}`}>{school.contact.email}</a>}
                    {school.contact.phone && <a className="text-blue-400 hover:underline" href={`tel:${school.contact.phone.replace(/[^+\d]/g, '')}`}>{school.contact.phone}</a>}
                  </div>
                )}
              </PanelSection>
            )}
          </div>
        </motion.div>
        )}
    </AnimatePresence>
  )
}

// --- Deadline Section Component ---
function DeadlineSection({ school, delay }: { school: ProcessedUniversity; delay: number }) {
  const { nextDeadline, more } = useMemo(() => {
    const programs = school.programs ?? [];
    // most urgent open/upcoming window across all programs
    const upcoming = getAllUpcomingDeadlines([{ name: school.name, programs }]);
    if (upcoming.length) {
      const u = upcoming[0];
      return { nextDeadline: { semester: u.semester, deadline: u.deadline, status: u.status, programName: u.programName }, more: upcoming.length - 1 };
    }
    for (const prog of programs) {
      const result = prog.applicationDeadlines && getNextDeadline(prog.applicationDeadlines);
      if (result) return { nextDeadline: { ...result, programName: prog.name }, more: 0 };
    }
    return { nextDeadline: null, more: 0 };
  }, [school.name, school.programs]);

  const handleDownloadICal = () => {
    const icalContent = generateSchoolICalFile({
      name: school.name,
      website: school.website,
      programs: school.programs || [],
    });
    const filename = `${school.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-deadlines.ics`;
    downloadICalFile(icalContent, filename);
  };

  if (!nextDeadline) return null;

  return (
    <PanelSection title="Next deadline" icon={<DeadlineIcon />} delay={delay}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-block px-2 py-0.5 text-[0.6rem] font-medium rounded-full border',
              nextDeadline.status.color
            )}
          >
            {nextDeadline.status.label}
          </span>
          <span className="text-[0.65rem] text-gray-400">
            {nextDeadline.semester} semester
          </span>
        </div>
        <div className="text-[0.7rem] text-gray-300">
          {nextDeadline.programName}: {nextDeadline.deadline.start ? `${nextDeadline.deadline.start} — ` : 'until '}{nextDeadline.deadline.end}
          {more > 0 && <span className="text-gray-500"> · {more} more open or upcoming</span>}
        </div>
        <button
          onClick={handleDownloadICal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-soft text-[0.65rem] text-blue-300 bg-blue-500/15 border border-blue-400/30 hover:bg-blue-500/25 hover:text-blue-200 transition-all duration-200 mt-1"
        >
          <CalendarIcon />
          Export all deadlines (.ics)
        </button>
      </div>
    </PanelSection>
  );
}

// --- NC-free admission across the school's programs (taxonomy.admissionOf) ---
function AdmissionSummary({ school }: { school: ProcessedUniversity }) {
  const programs = school.programs ?? []
  const routes = programs.map((p) => admissionOf(p as any, school.type))
  const aptitude = routes.filter((r) => r === 'aptitude').length
  const open = routes.filter((r) => r === 'open').length
  if (!aptitude && !open) return <p className="mt-1 text-gray-400">NC (grade cut-off): not known — check the program pages.</p>
  const all = aptitude + open === programs.length
  return (
    <p className="mt-1">
      NC-free {all ? 'for all programs' : `for ${aptitude + open} of ${programs.length} programs`}
      {aptitude > 0 && ` — admission by portfolio / aptitude test${open ? ` (${aptitude})` : ''}`}
      {open > 0 && `${aptitude ? ', ' : ' — '}open admission${aptitude ? ` (${open})` : ''}`}.
    </p>
  )
}

// --- Similar schools: related through programs that closely match ---
function SimilarSchools({ school }: { school: ProcessedUniversity }) {
  const relations = useSchoolStore((s) => s.schoolRelations.get(school.id))
  const universityById = useSchoolStore((s) => s.universityById)
  const programById = useSchoolStore((s) => s.programById)
  const setSelectedUniversity = useSchoolStore((s) => s.setSelectedUniversity)
  const setSelectedProgramId = useSchoolStore((s) => s.setSelectedProgramId)
  if (!relations?.length) return null
  const progName = (id: string) => programById.get(id)?.program.name ?? id

  return (
    <PanelSection title="Similar schools" icon={<LinkIcon />} delay={6}>
      <p className="text-[0.65rem] text-gray-400 mb-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
        {[3, 2, 1].map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: KIN_COLOR, opacity: TIER_OPACITY[t] }} />{TIER_LABELS[t]}
          </span>
        ))}
        <span>— glowing on the wall</span>
      </p>
      <ul className="space-y-1">
        {relations.map((r) => {
          const other = universityById.get(r.schoolId)
          if (!other) return null
          return (
            <li key={r.schoolId} className="rounded-soft hover:bg-white/5 px-1.5 py-1">
              <button onClick={() => setSelectedUniversity(other)} className="flex items-center gap-2 w-full text-left group">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: KIN_COLOR, opacity: TIER_OPACITY[r.tier] }} title={TIER_LABELS[r.tier]} />
                <span className="flex-1 text-gray-100 group-hover:text-white">{other.name}</span>
                <span className="text-[0.6rem] text-gray-400 flex-shrink-0">{r.total} similar</span>
              </button>
              <div className="pl-4 text-[0.65rem] text-gray-400 leading-snug">
                {r.pairs.slice(0, 2).map(([mine, theirs], i) => (
                  <span key={i}>
                    {i > 0 && ' · '}
                    <button className="hover:text-gray-200 underline-offset-2 hover:underline" onClick={() => setSelectedProgramId(mine)}>{progName(mine)}</button>
                    {' ↔ '}
                    <button className="hover:text-gray-200 underline-offset-2 hover:underline" onClick={() => { setSelectedUniversity(other); setSelectedProgramId(theirs) }}>{progName(theirs)}</button>
                  </span>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </PanelSection>
  )
}

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  )
}

function ApplyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

// --- SVG Icons (Refined Minimalist Style) ---
function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
}

function StatsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function ProgramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.39 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  )
}

function WebsiteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  )
}

function DeadlineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}