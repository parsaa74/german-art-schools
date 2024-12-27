export interface School {
  id: string;
  name: string;
  type: 'university' | 'academy' | 'college';
  location: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
  programs: string[];
  studentCount: number;
  website: string;
  founded: number;
}

export interface Program {
  id: string;
  name: string;
  degree: 'bachelor' | 'master' | 'diploma';
  duration: number;
  language: string[];
} 