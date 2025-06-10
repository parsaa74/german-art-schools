'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSchoolStore, VisualizationMode } from '@/stores/schoolStore'
import { BoxSelect, Network } from 'lucide-react' // Changed Cube to BoxSelect

export function ViewModeToggle() {
  const { visualizationMode, setVisualizationMode } = useSchoolStore()
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleMode = () => {
    const newMode: VisualizationMode =
      visualizationMode === 'network' ? 'd3-force' : 'network'
    setVisualizationMode(newMode)
  }

  const is3D = visualizationMode === 'network'
  const iconSize = 20

  if (!mounted) return null

  return (
    <motion.div
      className="fixed bottom-5 left-5 z-30 pointer-events-auto"
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 1.2, // Delay slightly more than control panel
        type: 'spring',
        stiffness: 180,
        damping: 20,
      }}
    >
      <motion.button
        onClick={toggleMode}
        className={`w-12 h-12 flex items-center justify-center ${isMobile ? 'ui-mobile mobile-button' : 'ui-organic'} text-slate-300 hover:text-white transition-all duration-300 overflow-hidden relative`}
        whileHover={{ scale: isMobile ? 1.05 : 1.1, y: isMobile ? -1 : -2 }}
        whileTap={{ scale: 0.95, y: 0 }}
        aria-label={`Switch to ${is3D ? '2D Force Graph' : '3D Network'} View`}
      >
        {/* Subtle background hint (Optional) */}
        <motion.div
          className="absolute inset-0 opacity-5"
          animate={{
            background: is3D
              ? 'radial-gradient(circle, rgba(0,100,255,0.1) 0%, rgba(0,0,0,0) 70%)' // Abstract 2D hint
              : 'radial-gradient(circle, rgba(100,200,255,0.1) 0%, rgba(0,0,0,0) 70%)', // Abstract 3D hint
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Icon transition */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={visualizationMode}
            initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute" // Position icons absolutely for smooth transition
          >
            {is3D ? (
              <Network size={iconSize} /> // Show 2D icon when in 3D mode (indicating switch *to* 2D)
            ) : (
              <BoxSelect size={iconSize} /> // Show 3D-like icon when in 2D mode
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}

export default ViewModeToggle 