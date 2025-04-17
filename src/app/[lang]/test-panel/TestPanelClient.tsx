'use client'

import { useState } from 'react'
import SimpleInfoPanel from '@/components/map/SimpleInfoPanel'

// Define the structure for the school object if not already defined globally
// You might want to import this type from a central types file
interface School {
  id: string;
  name: string;
  location: [number, number];
  type: string;
  state: string;
  programCount: number;
  website: string;
  programTypes: string[];
  city: string;
  description: string;
  founded: string;
  students: string;
  programs: Program[];
}

interface Program {
  name: string;
  degree: string;
  applicationDeadlines: {
    [key: string]: { start: string; end: string };
  };
  language: string;
  duration: string;
  description: string;
  specializations: string[];
}


export default function TestPanelClient() {
  const [showPanel, setShowPanel] = useState(true)

  const testSchool: School = {
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

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white">
        <h1 className="text-xl font-bold mb-4">InfoPanel Test</h1>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          {showPanel ? 'Hide Panel' : 'Show Panel'}
        </button>
      </div>

      {showPanel && (
        <SimpleInfoPanel
          school={testSchool}
          isOpen={showPanel}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  )
}