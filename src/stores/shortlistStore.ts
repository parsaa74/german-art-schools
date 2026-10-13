import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Profile, EMPTY_PROFILE } from '@/lib/applicationCheck';

/**
 * Programs the user keeps, plus their answers for the application check.
 * Saved in this browser (localStorage) and never sent anywhere — no account;
 * the share link (?keep=id,id) carries the list to another device.
 * ponytail: local only — add a synced backend (login) if users ask for it.
 */
interface ShortlistStore {
  ids: string[];
  schoolIds: string[];
  toggleSchool: (id: string) => void;
  removeSchool: (id: string) => void;
  toggle: (id: string) => void;
  add: (ids: string[]) => void;
  remove: (id: string) => void;
  clear: () => void;
  profile: Profile;
  setProfile: (patch: Partial<Profile>) => void;
}

// Keep changes usable in memory when a private browser / quota blocks storage.
let persistenceAvailable = true;
export const canPersistShortlist = () => persistenceAvailable;
const browserStorage = {
  getItem: (name: string) => { try { return localStorage.getItem(name); } catch { persistenceAvailable = false; return null; } },
  setItem: (name: string, value: string) => { try { localStorage.setItem(name, value); persistenceAvailable = true; } catch { persistenceAvailable = false; } },
  removeItem: (name: string) => { try { localStorage.removeItem(name); } catch { persistenceAvailable = false; } },
};

export const shortlist = createStore<ShortlistStore>()(
  persist(
    (set) => ({
      ids: [],
      schoolIds: [],
      toggleSchool: (id) => set((s) => ({ schoolIds: s.schoolIds.includes(id) ? s.schoolIds.filter((x) => x !== id) : [...s.schoolIds, id] })),
      removeSchool: (id) => set((s) => ({ schoolIds: s.schoolIds.filter((x) => x !== id) })),
      toggle: (id) => set((s) => ({ ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id] })),
      add: (ids) => set((s) => ({ ids: [...new Set([...s.ids, ...ids])] })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
      profile: EMPTY_PROFILE,
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
    }),
    {
      name: 'german-art-schools:shortlist',
      storage: createJSONStorage(() => browserStorage),
      partialize: ({ ids, schoolIds, profile }) => ({ ids, schoolIds, profile }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ShortlistStore> | undefined;
        const ids = (value: unknown, fallback: string[]) => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string'))] : fallback;
        return {
          ...current,
          ids: ids(saved?.ids, current.ids),
          schoolIds: ids(saved?.schoolIds, current.schoolIds),
          profile: saved?.profile && typeof saved.profile === 'object' ? { ...current.profile, ...saved.profile } : current.profile,
        };
      },
    }
  )
);
