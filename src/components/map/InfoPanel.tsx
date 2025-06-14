'use client'

import { useEffect, useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProcessedUniversity } from '@/stores/schoolStore'
import { cn } from '@/lib/utils'

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

  // Handle close button click - simplified
  const handleClose = () => {
    onClose()
  }

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Get a more artistic color scheme for type badges
  const getTypeStyles = (type: string): string => {
    switch (type) {
      case 'university': return 'border-blue-400/50 text-blue-300 bg-blue-500/20'
      case 'art_academy': return 'border-emerald-400/50 text-emerald-300 bg-emerald-500/20'
      case 'design_school': return 'border-cyan-400/50 text-cyan-300 bg-cyan-500/20'
      case 'music_academy': return 'border-purple-400/50 text-purple-300 bg-purple-500/20'
      case 'film_school': return 'border-amber-400/50 text-amber-300 bg-amber-500/20'
      default: return 'border-gray-400/50 text-gray-300 bg-gray-500/20'
    }
  }

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
            'fixed top-4 right-4 z-[500] w-full max-w-sm ui-organic text-gray-100',
            'max-h-[calc(100vh-2rem)] overflow-y-auto',
            'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20',
            className
          )}
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={(e) => e.stopPropagation()}
    >
          <div className="sticky top-0 z-10 bg-gradient-to-b from-black/90 via-black/80 to-transparent backdrop-blur-sm px-5 pt-5 pb-3 border-b border-white/10">
            <div className="flex justify-between items-start mb-2">
          <h2
            id="school-name-heading"
                className="text-lg font-semibold text-white leading-tight pr-3"
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
              className={cn(
                'inline-block px-3 py-1.5 text-[0.6rem] font-medium rounded-pill border',
                'tracking-wide uppercase',
                getTypeStyles(school.type)
              )}
          >
            {school.type.replace('_', ' ')}
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

        {school.programTypes && school.programTypes.length > 0 && (
              <PanelSection title={`Programs (${school.programCount || school.programTypes.length})`} icon={<ProgramIcon />} delay={3}>
                <div className="flex flex-wrap gap-1">
                  {school.programTypes.map((prog, index) => (
                  <span
                    key={index}
                      className="px-2 py-1 border border-white/20 rounded-soft text-[0.65rem] text-gray-200 bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    {prog}
                  </span>
                ))}
              </div>
              </PanelSection>
            )}

            {school.website && (
              <PanelSection title="Website" icon={<WebsiteIcon />} delay={4}>
            <a
              href={school.website}
              target="_blank"
              rel="noopener noreferrer"
                  className="inline-block text-blue-400 hover:text-blue-300 hover:underline underline-offset-2 break-all transition-colors duration-200 group"
                >
                  {school.website.replace(/^https?:\/\//, '')}
                  <span className="inline-block ml-1 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">→</span>
                </a>
              </PanelSection>
            )}
          </div>
        </motion.div>
        )}
    </AnimatePresence>
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