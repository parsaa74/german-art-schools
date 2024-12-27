import { create } from 'zustand';
import type { Map } from 'mapbox-gl';
import { School } from '@/types';

interface MapStore {
  map: Map | null;
  selectedSchool: School | null;
  setMap: (map: Map) => void;
  setSelectedSchool: (school: School | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  map: null,
  selectedSchool: null,
  setMap: (map) => set({ map }),
  setSelectedSchool: (school) => set({ selectedSchool: school }),
})); 