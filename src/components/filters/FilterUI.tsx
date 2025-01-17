'use client';

import { FilterSystem } from './FilterSystem';
import type { University } from '../map/UniversityNodes';

interface FilterUIProps {
  universities: University[];
  onFilterChange: (filteredNodes: University[]) => void;
}

export function FilterUI({ universities, onFilterChange }: FilterUIProps) {
  return (
    <div className="fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-white/90 backdrop-blur-sm shadow-lg w-80">
      <FilterSystem
        nodes={universities}
        onFilterChange={onFilterChange}
      />
    </div>
  );
} 