import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Profile, EMPTY_PROFILE } from '@/lib/applicationCheck';

/**
 * Programs the user keeps, plus their answers for the application check.
 * Saved in this browser (localStorage) and never sent anywhere — no account;
 * the share link (?keep=id,id) carries the list to another device.
 * ponytail: local only — add a synced backend (login) if users ask for it.
 */
interface ShortlistStore {
  ids: string[];
  toggle: (id: string) => void;
  add: (ids: string[]) => void;
  remove: (id: string) => void;
  clear: () => void;
  profile: Profile;
  setProfile: (patch: Partial<Profile>) => void;
}

export const useShortlist = create<ShortlistStore>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })),
      add: (ids) => set((s) => ({ ids: [...s.ids, ...ids.filter((id) => !s.ids.includes(id))] })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
      profile: EMPTY_PROFILE,
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
    }),
    { name: 'german-art-schools:shortlist' }
  )
);
