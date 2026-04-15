import { create } from 'zustand';

interface MapStore {
  activePanel: string | null;
  setActivePanel: (panelId: string | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  activePanel: null,
  setActivePanel: (panelId) => set({ activePanel: panelId }),
}));
