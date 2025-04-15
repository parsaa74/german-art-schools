'use client'

import { useState } from 'react'
import InfoPanel from './InfoPanel'
import { ProcessedUniversity } from '@/stores/schoolStore'

export default function TestInfoPanel() {
  const [showPanel, setShowPanel] = useState(true)
  const [showDebug, setShowDebug] = useState(true)

  // Create a hardcoded test university
  const testSchool: ProcessedUniversity = {
    id: 'test-university',
    name: 'Test University',
    location: [52.5200, 13.4050],
    type: 'art_academy',
    state: 'Berlin',
    programCount: 3,
    website: 'https://example.com',
    programTypes: ['Fine Arts', 'Design', 'Architecture'],
    city: 'Berlin',
    description: 'This is a test university for debugging purposes.',
    founded: '1990',
    students: '1000',
    programs: [
      {
        name: 'Fine Arts',
        degree: 'Bachelor of Arts',
        applicationDeadlines: {
          winter: { start: '1 May', end: '15 June' }
        },
        language: 'German',
        duration: '8 semesters',
        description: 'A comprehensive program covering various aspects of fine arts.',
        specializations: ['Painting', 'Sculpture', 'Photography']
      }
    ]
  }

  const handleClose = () => {
    console.log('Test panel closed')
    setShowPanel(false)
  }

  const toggleDebug = () => {
    setShowDebug(!showDebug)
  }

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999]">
      {/* Debug panel */}
      {showDebug && (
        <div className="fixed top-20 left-4 bg-black/70 text-white p-4 rounded-lg text-sm z-[9999] pointer-events-auto">
          <h3 className="font-bold mb-2">Debug Panel</h3>
          <p>Panel Visible: {showPanel ? 'Yes' : 'No'}</p>
          <p>Test School: {testSchool.name}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              {showPanel ? 'Hide Panel' : 'Show Panel'}
            </button>
            <button
              onClick={toggleDebug}
              className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
            >
              Hide Debug
            </button>
          </div>
        </div>
      )}

      {/* The InfoPanel component */}
      <InfoPanel
        school={showPanel ? testSchool : null}
        isOpen={showPanel}
        onClose={handleClose}
      />

      {/* Toggle debug button when hidden */}
      {!showDebug && (
        <button
          onClick={toggleDebug}
          className="fixed top-20 left-4 bg-gray-500 text-white p-2 rounded-lg text-sm z-[9999] pointer-events-auto"
        >
          Show Debug
        </button>
      )}
    </div>
  )
}
