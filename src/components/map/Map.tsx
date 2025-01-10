'use client'

import { useState } from 'react'
import type { StateData } from '@/types/map'

function StateGeometry({
  id,
  name,
  path,
  population,
  onSelect,
  isSelected
}: {
  id: string
  name: string
  path: string
  population: number
  onSelect: (state: StateData) => void
  isSelected: boolean
}) {
  return (
    <path
      d={path}
      className={`
        transition-colors
        cursor-pointer
        ${isSelected 
          ? 'fill-blue-500 hover:fill-blue-600' 
          : 'fill-gray-200 hover:fill-gray-300'
        }
      `}
      onClick={() => onSelect({ id, name, path, population })}
    />
  )
}

export default function Map() {
  const [selectedState, setSelectedState] = useState<StateData | null>(null)

  return (
    <div className="w-full h-full relative">
      <svg viewBox="0 0 800 1000" className="w-full h-full">
        <StateGeometry
          id="berlin"
          name="Berlin"
          path="M..."  // Add actual path data
          population={3669495}
          onSelect={setSelectedState}
          isSelected={selectedState?.id === 'berlin'}
        />
      </svg>
      
      {selectedState && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold">{selectedState.name}</h2>
          <p>Population: {selectedState.population.toLocaleString()}</p>
        </div>
      )}
    </div>
  )
} 