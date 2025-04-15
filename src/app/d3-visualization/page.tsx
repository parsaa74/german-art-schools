'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import D3VisualizationContainer from '@/components/visualization/D3VisualizationContainer'
import { useSchoolStore } from '@/stores/schoolStore'
import InfoPanel from '@/components/map/InfoPanel'

export default function D3VisualizationPage() {
  const { selectedUniversity, setSelectedUniversity, initializeStore } = useSchoolStore()

  // Initialize the store when the component mounts
  useEffect(() => {
    initializeStore()
  }, [initializeStore])

  // Handle closing the info panel
  const handleClosePanel = () => {
    setSelectedUniversity(null)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#101820] to-[#18212B] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            <span className="text-blue-400">D3.js</span> Network Visualization
          </h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600/80 hover:bg-blue-500/90 text-white rounded-md text-sm transition-colors duration-300"
          >
            Back to 3D View
          </Link>
        </div>

        <div className="mb-6">
          <p className="text-blue-200/90">
            Interactive network visualization of German art schools using D3.js. Explore the relationships between different institutions.
          </p>
        </div>

        <D3VisualizationContainer />
      </div>

      {/* Info Panel */}
      <InfoPanel
        school={selectedUniversity}
        isOpen={!!selectedUniversity}
        onClose={handleClosePanel}
      />
    </main>
  )
}
