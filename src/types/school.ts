export interface Program {
  name: string;
  degree: 'BA' | 'MA' | 'PhD' | string;
  applicationDeadlines?: {
    winter?: {
      start?: string;
      end?: string;
    };
    summer?: {
      start?: string;
      end?: string;
    };
  };
  professors?: Array<{
    name: string;
    email?: string;
    position?: string;
  }>;
  tuitionFees?: number | 'None' | string;
  language?: string;
  duration: string;
  description?: string;
  specializations?: string[];
  requirements?: string[];
  link?: string;
}

export interface School {
  name: string;
  type: string;
  state: string;
  lat: number;
  long: number;
  programs: string[];
  founded?: string;
  website?: string;
}

export const schools: School[] = [
  {
    id: '1',
    name: 'Kunstakademie Münster',
    type: 'kunsthochschule',
    lat: 51.9607,
    lng: 7.6261,
    state: 'North Rhine-Westphalia',
    founded: '1971',
    website: 'https://www.kunstakademie-muenster.de',
    logo: 'kunstakademie-munster-logo.png',
    programs: []
  },
  {
    id: '2',
    name: 'Academy of Fine Arts Nuremberg',
    type: 'kunsthochschule',
    lat: 49.4521,
    lng: 11.0767,
    state: 'Bavaria',
    founded: '1662',
    website: 'https://www.adbk-nuernberg.de',
    logo: 'Akademie_der_Bildenden_Künste_Nürnberg_logo.svg',
    programs: []
  },
  {
    id: '3',
    name: 'University of Design Offenbach',
    type: 'hochschule',
    lat: 50.1055,
    lng: 8.7623,
    state: 'Hesse',
    website: 'https://www.hfg-offenbach.de',
    logo: 'hfk offenbach mainz logo.jpg',
    programs: []
  },
  {
    id: '4',
    name: 'Film University Babelsberg',
    type: 'hochschule',
    lat: 52.3906,
    lng: 13.1256,
    state: 'Brandenburg',
    founded: '1954',
    website: 'https://www.filmuniversitaet.de',
    programs: []
  }
]; 