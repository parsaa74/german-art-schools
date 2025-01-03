import { School } from '@/types/school';

export const schools: School[] = [
  {
    name: "Hochschule für Künste Bremen",
    type: "kunsthochschule",
    state: "Bremen",
    lat: 53.0793,
    long: 8.8017,
    programs: ["Fine Arts", "Digital Media", "Integrated Design"],
    founded: "1873",
    website: "https://www.hfk-bremen.de"
  },
  // ... other schools
];

export default schools; 