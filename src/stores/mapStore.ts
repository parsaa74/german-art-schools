import { create } from 'zustand';

interface MapStore {
  activePanel: string | null;          // 'filters' while the filter panel is open
  setActivePanel: (panelId: string | null) => void;
  wizardOpen: boolean;
  setWizardOpen: (open: boolean) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  activePanel: null,
  setActivePanel: (panelId) => set({ activePanel: panelId }),
  wizardOpen: false,
  setWizardOpen: (open) => set({ wizardOpen: open }),
}));
