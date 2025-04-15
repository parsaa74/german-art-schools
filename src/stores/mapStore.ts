import { create } from 'zustand';
import type { Map as MapboxMap } from 'mapbox-gl';
import { School } from '@/types';
import * as THREE from 'three';

interface MapStore {
  map: MapboxMap | null;
  selectedSchool: School | null;
  nodePositions: Map<string, THREE.Vector3>;
  activePanel: string | null;
  setMap: (map: MapboxMap) => void;
  setSelectedSchool: (school: School | null) => void;
  setNodePositions: (positions: Map<string, THREE.Vector3>) => void;
  setActivePanel: (panelId: string | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  map: null,
  selectedSchool: null,
  nodePositions: new Map<string, THREE.Vector3>(),
  activePanel: null,
  setMap: (map) => set({ map }),
  setSelectedSchool: (school) => set({ selectedSchool: school }),
  setNodePositions: (positions) => set({ nodePositions: positions }),
  setActivePanel: (panelId) => set({ activePanel: panelId }),
})); 