'use client'

import { useEffect, useRef } from 'react'
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import type { ProcessedUniversity } from '@/stores/schoolStore'
import { cn } from '@/lib/utils'

interface MobileInfoPanelProps {
  school: ProcessedUniversity | null
  isOpen: boolean
  onClose: () => void
  className?: string
}

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
      className={cn("py-3 border-b border-white/5 last:border-b-0", className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + delay * 0.05 }}
    >
      {title && (
        <div className="flex items-center mb-2">
          {icon && <div className="mr-3 text-blue-400/70 flex-shrink-0">{icon}</div>}
          <h3 className="text-sm font-medium text-blue-300/80 tracking-wide uppercase">
            {title}
          </h3>
        </div>
      )}
      <div className={cn("text-sm text-gray-100 leading-relaxed", { 'pl-7': icon })}>
        {children}
      </div>
    </motion.div>
  )
}

export default function MobileInfoPanel({
  school,
  isOpen,
  onClose,
  className = ''
}: MobileInfoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  const handleClose = () => {
    onClose()
  }

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Drag to dismiss functionality
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100) {
      handleClose()
    }
  }

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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] md:hidden"
            onClick={handleClose}
          />

          {/* Mobile Panel */}
          <motion.div
            ref={panelRef}
            id="mobile-info-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-school-name-heading"
            className={cn(
              'fixed inset-x-0 bottom-0 z-[500] md:hidden',
              'mobile-drawer mobile-scrollbar-hide overflow-y-auto',
              'max-h-[85vh]',
              className
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-gray-600 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-black/95 via-black/90 to-black/80 backdrop-blur-sm px-6 pb-4">
              <div className="flex justify-between items-start mb-3">
                <h2
                  id="mobile-school-name-heading"
                  className="text-xl font-semibold text-white leading-tight pr-4 flex-1"
                >
                  {school.name}
                </h2>
                <button
                  onClick={handleClose}
                  className="mobile-button text-gray-400 hover:text-white hover:bg-white/10 p-3 rounded-full transition-all duration-300 flex-shrink-0"
                  aria-label="Close information panel"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              <span
                className={cn(
                  'inline-block px-4 py-2 text-sm font-medium rounded-full border',
                  'tracking-wide uppercase',
                  getTypeStyles(school.type)
                )}
              >
                {school.type.replace('_', ' ')}
              </span>
            </div>

            {/* Content */}
            <div className="px-6 pb-8 space-y-0">
              <PanelSection title="Location" icon={<LocationIcon />} delay={0}>
                <p className="text-base">{school.city || 'N/A'}, {school.state || 'N/A'}</p>
              </PanelSection>

              {school.description && (
                <PanelSection title="About" icon={<InfoIcon />} delay={1}>
                  <p className="text-base leading-relaxed">{school.description}</p>
                </PanelSection>
              )}

              {(school.founded || school.students) && (
                <PanelSection title="Statistics" icon={<StatsIcon />} delay={2}>
                  <div className="grid grid-cols-2 gap-4">
                    {school.founded && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1 tracking-wide uppercase">Founded</div>
                        <div className="text-lg font-semibold text-white">{school.founded}</div>
                      </div>
                    )}
                    {school.students && (
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1 tracking-wide uppercase">Students</div>
                        <div className="text-lg font-semibold text-white">{school.students.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </PanelSection>
              )}

              {school.programTypes && school.programTypes.length > 0 && (
                <PanelSection 
                  title={`Programs (${school.programCount || school.programTypes.length})`} 
                  icon={<ProgramIcon />} 
                  delay={3}
                >
                  <div className="grid grid-cols-1 gap-2">
                    {school.programTypes.map((prog, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 border border-white/20 rounded-xl text-sm text-gray-200 bg-white/10 hover:bg-white/15 transition-all duration-300"
                      >
                        {prog}
                      </div>
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
                    className="inline-flex items-center justify-between w-full p-4 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:text-blue-200 hover:bg-blue-500/30 transition-all duration-300 group"
                  >
                    <span className="text-base font-medium">
                      Visit Website
                    </span>
                    <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </PanelSection>
              )}

              {/* Additional mobile-specific info */}
              <PanelSection delay={5}>
                <div className="text-center text-xs text-gray-500 pt-4">
                  <p>Tap and drag to explore • Pinch to zoom</p>
                  <p className="text-blue-400 mt-1">Swipe down to close</p>
                </div>
              </PanelSection>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// SVG Icons (same as desktop but slightly larger for mobile)
function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
}

function StatsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function ProgramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.39 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  )
}

function WebsiteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  )
}