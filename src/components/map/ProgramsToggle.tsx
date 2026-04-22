'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSchoolStore } from '@/stores/schoolStore'
import { GraduationCap, CircleDot } from 'lucide-react'

export function ProgramsToggle() {
  const selectedUniversity = useSchoolStore(s => s.selectedUniversity)
  const showPrograms = useSchoolStore(s => s.showPrograms)
  const setShowPrograms = useSchoolStore(s => s.setShowPrograms)
  const visualizationMode = useSchoolStore(s => s.visualizationMode)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!mounted) return null

  const progCount = selectedUniversity?.programs?.length ?? 0
  const visible = !!selectedUniversity && visualizationMode === 'network' && progCount > 0

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-5 left-20 z-30 pointer-events-auto"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        >
          <motion.button
            onClick={() => setShowPrograms(!showPrograms)}
            className={`w-12 h-12 flex items-center justify-center ${isMobile ? 'ui-mobile mobile-button' : 'ui-organic'} ${showPrograms ? 'text-cyan-300' : 'text-slate-300'} hover:text-white transition-all duration-300 relative`}
            whileHover={{ scale: isMobile ? 1.05 : 1.1, y: isMobile ? -1 : -2 }}
            whileTap={{ scale: 0.95, y: 0 }}
            aria-label={showPrograms ? 'Hide program satellites' : 'Show program satellites'}
            title={showPrograms ? `Hide ${progCount} programs` : `Show ${progCount} programs`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={showPrograms ? 'on' : 'off'}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.25 }}
                className="absolute"
              >
                {showPrograms ? <CircleDot size={20} /> : <GraduationCap size={20} />}
              </motion.div>
            </AnimatePresence>
            {progCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500/90 text-[10px] font-semibold text-black flex items-center justify-center">
                {progCount}
              </span>
            )}
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProgramsToggle
