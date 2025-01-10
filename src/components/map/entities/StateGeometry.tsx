'use client'

import { memo } from 'react'
import type { StateData } from '@/types/map'

interface StateGeometryProps extends StateData {
  onSelect: (state: StateData) => void
  isSelected: boolean
}

export const StateGeometry = memo(function StateGeometry({
  id,
  name,
  path,
  population,
  onSelect,
  isSelected
}: StateGeometryProps) {
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
}) 