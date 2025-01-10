export interface School {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  type: 'university' | 'academy' | 'college';
  programs: Program[];
  professors: string[];
  website?: string;
  description?: string;
  logo?: string;
  founded?: number;
}

export interface Program {
  name: string;
  degree: string;
  applicationDeadlines: {
    winter?: {
      start: string;
      end: string;
    };
    summer?: {
      start: string;
      end: string;
    };
  };
  professors: Array<{
    name: string;
    email: string;
    position?: string;
  }>;
  tuitionFees: string;
  language: string;
  duration: string;
  description: string;
  specializations: string[];
  requirements?: string[];
  link?: string;
} 