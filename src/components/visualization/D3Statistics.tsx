'use client'

import { useState, useEffect } from 'react'
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore'
import { motion } from 'framer-motion'

interface StatItem {
  label: string
  value: number | string
  color: string
}

export default function D3Statistics() {
  const { processedUniversities } = useSchoolStore()
  const [stats, setStats] = useState<StatItem[]>([])
  const [isVisible, setIsVisible] = useState(false)

  // Calculate statistics
  useEffect(() => {
    if (processedUniversities.length === 0) return

    // Count universities by type
    const typeCount: Record<string, number> = {}
    processedUniversities.forEach(uni => {
      typeCount[uni.type] = (typeCount[uni.type] || 0) + 1
    })

    // Count universities by state
    const stateCount: Record<string, number> = {}
    processedUniversities.forEach(uni => {
      stateCount[uni.state] = (stateCount[uni.state] || 0) + 1
    })

    // Get top 3 states
    const topStates = Object.entries(stateCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([state, count]) => ({ state, count }))

    // Calculate average programs per university
    const totalPrograms = processedUniversities.reduce((sum, uni) => sum + (uni.programCount || 0), 0)
    const avgPrograms = totalPrograms / processedUniversities.length

    // Create stats array
    const newStats: StatItem[] = [
      { 
        label: 'Total Institutions', 
        value: processedUniversities.length,
        color: 'bg-blue-500'
      },
      { 
        label: 'Universities', 
        value: typeCount['university'] || 0,
        color: 'bg-blue-600'
      },
      { 
        label: 'Art Academies', 
        value: typeCount['art_academy'] || 0,
        color: 'bg-blue-500'
      },
      { 
        label: 'Design Schools', 
        value: typeCount['design_school'] || 0,
        color: 'bg-blue-700'
      },
      { 
        label: 'Avg. Programs', 
        value: avgPrograms.toFixed(1),
        color: 'bg-blue-400'
      },
      { 
        label: `Top State: ${topStates[0]?.state || 'N/A'}`, 
        value: topStates[0]?.count || 0,
        color: 'bg-blue-300'
      }
    ]

    setStats(newStats)
    
    // Show the stats after a short delay
    const timer = setTimeout(() => setIsVisible(true), 800)
    return () => clearTimeout(timer)
  }, [processedUniversities])

  if (stats.length === 0) return null

  return (
    <motion.div 
      className="d3-statistics grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 20 
      }}
      transition={{ duration: 0.5, ease: "easeOut", staggerChildren: 0.1 }}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="stat-card p-4 rounded-lg bg-black/40 backdrop-blur-sm border border-blue-500/20 flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isVisible ? 1 : 0, 
            y: isVisible ? 0 : 20 
          }}
          transition={{ 
            duration: 0.5, 
            ease: "easeOut",
            delay: index * 0.1
          }}
        >
          <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`}></div>
          <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
          <div className="text-xs text-blue-200/70">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}
