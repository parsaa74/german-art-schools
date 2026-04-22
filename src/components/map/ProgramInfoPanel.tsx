'use client'

import { useEffect, useMemo } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'
import { useSchoolStore } from '@/stores/schoolStore'
import { cn } from '@/lib/utils'

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
  const programEdges = useSchoolStore(s => s.programEdges)

  const entry = selectedProgramId ? programById.get(selectedProgramId) : null
  const program = entry?.program

  const related = useMemo(() => {
    if (!selectedProgramId) return []
    const hits: Array<{ id: string; weight: number; schoolName: string; name: string; degree: string }> = []
    for (const e of programEdges) {
      let otherId: string | null = null
      if (e.src === selectedProgramId) otherId = e.dst
      else if (e.dst === selectedProgramId) otherId = e.src
      if (!otherId) continue
      const info = programById.get(otherId)
      if (!info) continue
      hits.push({
        id: otherId,
        weight: e.weight,
        schoolName: info.schoolName,
        name: info.program.name,
        degree: info.program.degree,
      })
    }
    hits.sort((a, b) => b.weight - a.weight)
    return hits.slice(0, 8)
  }, [selectedProgramId, programEdges, programById])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedProgramId) setSelectedProgramId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedProgramId, setSelectedProgramId])

  const isOpen = !!(selectedProgramId && program)
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
            'fixed top-4 left-4 z-[500] w-[min(22rem,calc(100vw-2rem))] ui-organic text-gray-100',
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
            <div className="text-[0.65rem] text-gray-500 mt-1 truncate">at {entry!.schoolName}</div>
          </div>

          <div className="px-4 pb-4 pt-2 space-y-2">
            {program.description && (
              <Section title="About">
                <p>{program.description}</p>
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

            {program.applicationDeadlines && (program.applicationDeadlines.winter || program.applicationDeadlines.summer) && (
              <Section title="Application Deadlines">
                <div className="space-y-1">
                  {program.applicationDeadlines.winter && (
                    <div className="text-[0.7rem]">
                      <span className="text-blue-300 mr-2">Winter:</span>
                      {program.applicationDeadlines.winter.start} — {program.applicationDeadlines.winter.end}
                    </div>
                  )}
                  {program.applicationDeadlines.summer && (
                    <div className="text-[0.7rem]">
                      <span className="text-amber-300 mr-2">Summer:</span>
                      {program.applicationDeadlines.summer.start} — {program.applicationDeadlines.summer.end}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {details && (details.portfolioRequired != null || details.tuitionEuroPerSemester != null || details.capacity != null || details.languageRequirements) && (
              <Section title="Requirements">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.7rem]">
                  {details.portfolioRequired != null && (
                    <div>
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wide">Portfolio</div>
                      <div>{details.portfolioRequired ? 'Required' : 'Not required'}</div>
                    </div>
                  )}
                  {details.tuitionEuroPerSemester != null && (
                    <div>
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wide">Tuition</div>
                      <div>€{details.tuitionEuroPerSemester}/sem</div>
                    </div>
                  )}
                  {details.capacity != null && (
                    <div>
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wide">Capacity</div>
                      <div>{details.capacity}</div>
                    </div>
                  )}
                  {details.languageRequirements && (
                    <div className="col-span-2">
                      <div className="text-[0.6rem] text-gray-400 uppercase tracking-wide">Language</div>
                      <div>{details.languageRequirements}</div>
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

            {related.length > 0 && (
              <Section title={`Similar Programs (${related.length})`}>
                <ul className="space-y-1">
                  {related.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => setSelectedProgramId(r.id)}
                        className="text-left w-full group"
                      >
                        <div className="flex items-start justify-between gap-2 px-2 py-1.5 rounded-soft hover:bg-white/5 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="text-[0.7rem] text-gray-200 group-hover:text-white truncate">{r.name}</div>
                            <div className="text-[0.6rem] text-gray-500 truncate">{r.degree} · {r.schoolName}</div>
                          </div>
                          <span className="text-[0.6rem] text-cyan-300 flex-shrink-0 pt-0.5">
                            {(r.weight * 100).toFixed(0)}%
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
