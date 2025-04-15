'use client'

import { useEffect } from 'react'
import TestInfoPanel from '@/components/map/TestInfoPanel'
import { useSchoolStore } from '@/stores/schoolStore'

export default function TestPage() {
  const initializeStore = useSchoolStore((state) => state.initializeStore)

  const { selectedUniversity } = useSchoolStore()

  useEffect(() => {
    // Initialize the store when the component mounts
    initializeStore()

    // Add event listener for key press to close panel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        useSchoolStore.getState().setSelectedUniversity(null)
        console.log('Cleared selected university with Escape key')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [initializeStore])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#101820] to-[#18212B] flex flex-col items-center justify-center">
      <h1 className="text-white text-2xl font-bold mb-8">Info Panel Test Page</h1>
      <p className="text-white text-lg mb-4">The info panel should appear in the top-right corner</p>
      <button
        onClick={() => {
          const uni = useSchoolStore.getState().processedUniversities[0]
          useSchoolStore.getState().setSelectedUniversity(uni)
          console.log('Selected university:', uni?.name)
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg mb-4"
      >
        Show Info Panel
      </button>
      <button
        onClick={() => {
          useSchoolStore.getState().setSelectedUniversity(null)
          console.log('Cleared selected university')
        }}
        className="px-4 py-2 bg-red-500 text-white rounded-lg"
      >
        Hide Info Panel
      </button>
      <TestInfoPanel />
    </div>
  )
}
