import { create } from 'zustand';
import { School } from '@/types/school';

interface SchoolStore {
  selectedSchool: School | null;
  setSelectedSchool: (school: School | null) => void;
}

export const useSchoolStore = create<SchoolStore>((set) => ({
  selectedSchool: null,
  setSelectedSchool: (school) => set({ selectedSchool: school }),
})); 