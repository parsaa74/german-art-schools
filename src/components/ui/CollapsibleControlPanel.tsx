'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@nextui-org/button' // Or your preferred button component
import { Settings, X, SlidersHorizontal } from 'lucide-react' // Added SlidersHorizontal

interface CollapsibleControlPanelProps {
  children: React.ReactNode // Buttons/Controls to be placed inside
  triggerIcon?: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  panelTitle?: string
}

const panelVariants = {
  hidden: (position: string) => ({
    opacity: 0,
    x: position.includes('right') ? 20 : -20,
  }),
  visible: {
    opacity: 1,
    x: 0,
  },
  exit: (position: string) => ({
    opacity: 0,
    x: position.includes('right') ? 20 : -20,
  }),
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
}

export function CollapsibleControlPanel({
  children,
  triggerIcon = <SlidersHorizontal size={18} />, // Changed default icon
  position = 'top-right', // Default position
  panelTitle = 'Controls',
}: CollapsibleControlPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const togglePanel = () => setIsOpen(!isOpen)

  return (
    <div
      className={`fixed ${positionClasses[position]} z-30 flex flex-col ${position.includes('right') ? 'items-end' : 'items-start'} pointer-events-auto`}
    >
      {/* Trigger Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 18 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          isIconOnly
          onClick={togglePanel}
          className={`${isMobile ? 'ui-mobile mobile-button' : 'ui-organic'} text-slate-300 hover:text-white transition-all duration-300 w-12 h-12`}
          aria-label={isOpen ? 'Close Control Panel' : 'Open Control Panel'}
          size="md"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isOpen ? 'x' : 'icon'}
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {isOpen ? <X size={18} /> : triggerIcon}
            </motion.div>
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Collapsible Panel Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            custom={position}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className={`mt-2 ${isMobile ? 'w-72 ui-mobile' : 'w-64 ui-organic'} overflow-hidden`}
            style={{ originX: position.includes('right') ? 1 : 0 }}
          >
            <div className="p-3">
              <h3 className="text-xs font-medium mb-2.5 text-blue-300/80 uppercase tracking-wider border-b border-white/10 pb-1.5">
                {panelTitle}
              </h3>
              <div className="space-y-2">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CollapsibleControlPanel 