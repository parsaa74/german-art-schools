'use client'

import { useState, useEffect } from 'react'
import { useSchoolStore } from '@/stores/schoolStore'
import D3NetworkGraph from './D3NetworkGraph.fixed'
import D3Statistics from './D3Statistics'
import D3Timeline from './D3Timeline.fixed'
import { motion } from 'framer-motion'

export default function D3VisualizationContainer() {
  const { 
    processedUniversities, 
    initializeStore, 
    timelineFilter,
    setTimelineFilter
  } = useSchoolStore()
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [isVisible, setIsVisible] = useState(false)

  // Initialize the store if needed
  useEffect(() => {
    if (processedUniversities.length === 0) {
      initializeStore()
    }
  }, [processedUniversities.length, initializeStore])

  // Update dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: Math.min(window.innerWidth - 40, 1200),
        height: Math.min(window.innerHeight - 100, 800)
      })
    }

    // Set initial dimensions
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Show the visualization after a short delay
    const timer = setTimeout(() => setIsVisible(true), 500)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  return (
    <motion.div
      className="d3-visualization-container p-4 rounded-xl bg-gradient-to-br from-[#101820]/90 to-[#18212B]/90 backdrop-blur-lg shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : 20
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">
          German Art Schools Network
          <span className="ml-2 text-sm font-normal text-cyan-300">
            Powered by D3.js
          </span>
        </h2>
        <div className="text-sm text-cyan-300">
          {processedUniversities.length} institutions
        </div>
      </div>

      <div className="visualization-wrapper rounded-lg overflow-hidden border border-cyan-500/20">
        <D3NetworkGraph
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>

      <div className="mt-4 text-sm text-cyan-200/70">
        <p>
          <span className="font-medium">Interaction: </span>
          Drag nodes to reposition • Click to select • Scroll to zoom • Drag background to pan
        </p>
      </div>

      {/* Statistics */}
      <D3Statistics />

      {/* Timeline of German Art Movements */}
      <D3Timeline
        width={dimensions.width}
        height={120}
        onTimelineFilter={setTimelineFilter}
      />

      {/* Timeline filter info */}
      {timelineFilter && (
        <div className="mt-2 text-sm text-cyan-300 text-center">
          <span className="font-medium">Filtering by period: </span>
          {timelineFilter[0]} - {timelineFilter[1]}
        </div>
      )}
    </motion.div>
  )
}
