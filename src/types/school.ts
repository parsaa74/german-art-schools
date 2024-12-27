export interface School {
  id: string;
  name: string;
  type: 'art' | 'music' | 'film' | 'design' | 'theater' | 'dance' | 'media';
  lat: number;
  lng: number;
  state: string;
  founded?: number;
  website?: string;
  programs?: string[];
  studentCount?: number;
}

export const schools: School[] = [
  {
    id: '1',
    name: 'Kunstakademie Münster',
    type: 'art',
    lat: 51.9607,
    lng: 7.6261,
    state: 'North Rhine-Westphalia',
    founded: 1971,
    website: 'https://www.kunstakademie-muenster.de'
  },
  {
    id: '2',
    name: 'Academy of Fine Arts Nuremberg',
    type: 'art',
    lat: 49.4521,
    lng: 11.0767,
    state: 'Bavaria',
    founded: 1662,
    website: 'https://www.adbk-nuernberg.de'
  },
  {
    id: '3',
    name: 'University of Design Offenbach',
    type: 'design',
    lat: 50.1055,
    lng: 8.7623,
    state: 'Hesse',
    website: 'https://www.hfg-offenbach.de'
  },
  {
    id: '4',
    name: 'Film University Babelsberg',
    type: 'film',
    lat: 52.3906,
    lng: 13.1256,
    state: 'Brandenburg',
    founded: 1954,
    website: 'https://www.filmuniversitaet.de'
  },
  // Add all schools from your list...
]; 