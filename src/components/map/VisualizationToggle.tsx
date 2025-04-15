'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSchoolStore, VisualizationMode } from '@/stores/schoolStore'

export default function VisualizationToggle() {
  const { visualizationMode, setVisualizationMode } = useSchoolStore()
  const [mounted, setMounted] = useState(false)

  // Only show component after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleVisualizationMode = () => {
    const newMode: VisualizationMode = visualizationMode === 'network' ? 'd3-force' : 'network'
    setVisualizationMode(newMode)
  }

  if (!mounted) return null

  return (
    <motion.div
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-black/50 backdrop-blur-md rounded-full px-1 py-1 flex items-center shadow-lg border border-blue-500/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
    >
      <button
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          visualizationMode === 'network'
            ? 'bg-blue-600 text-white'
            : 'bg-transparent text-gray-300 hover:text-white'
        }`}
        onClick={toggleVisualizationMode}
      >
        3D Network
      </button>
      
      <button
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          visualizationMode === 'd3-force'
            ? 'bg-blue-600 text-white'
            : 'bg-transparent text-gray-300 hover:text-white'
        }`}
        onClick={toggleVisualizationMode}
      >
        D3 Force
      </button>
    </motion.div>
  )
}
