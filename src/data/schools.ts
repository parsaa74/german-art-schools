export interface School {
  name: string;
  lat: number;
  lng: number;
  type: 'art' | 'music' | 'film' | 'design' | 'theater' | 'dance' | 'media';
  website?: string;
  founded?: number;
}

export const schools: School[] = [
  {
    name: 'Kunstakademie Münster',
    lat: 51.9607,
    lng: 7.6261,
    type: 'art',
    website: 'https://www.kunstakademie-muenster.de',
    founded: 1971
  },
  {
    name: 'Academy of Fine Arts Nuremberg',
    lat: 49.4521,
    lng: 11.0767,
    type: 'art',
    website: 'https://www.adbk-nuernberg.de',
    founded: 1662
  },
  {
    name: 'University of Design Offenbach',
    lat: 50.1055,
    lng: 8.7623,
    type: 'design',
    website: 'https://www.hfg-offenbach.de'
  },
  {
    name: 'Film University Babelsberg',
    lat: 52.3906,
    lng: 13.1256,
    type: 'film',
    website: 'https://www.filmuniversitaet.de',
    founded: 1954
  },
  {
    name: 'College of Fine Arts Saar',
    lat: 49.2401,
    lng: 6.9969,
    type: 'art'
  },
  {
    name: 'Stuttgart State Academy of Fine Arts',
    lat: 48.7887,
    lng: 9.2334,
    type: 'art',
    founded: 1761
  },
  {
    name: 'Stuttgart State University of Music',
    lat: 48.7818,
    lng: 9.1829,
    type: 'music'
  },
  {
    name: 'Trossingen State University of Music',
    lat: 48.0741,
    lng: 8.6349,
    type: 'music'
  },
  {
    name: 'Alanus University of Art and Society',
    lat: 50.7374,
    lng: 7.0513,
    type: 'art'
  },
  {
    name: 'Deutsche Film- und Fernsehakademie Berlin',
    lat: 52.5074,
    lng: 13.3903,
    type: 'film'
  },
  {
    name: 'Hochschule für Musik Hanns Eisler Berlin',
    lat: 52.5163,
    lng: 13.3777,
    type: 'music'
  },
  {
    name: 'Hochschule für Schauspielkunst Ernst Busch',
    lat: 52.5419,
    lng: 13.4037,
    type: 'theater'
  },
  {
    name: 'Kunsthochschule Berlin-Weißensee',
    lat: 52.5547,
    lng: 13.4241,
    type: 'art'
  },
  {
    name: 'Staatliche Ballettschule Berlin',
    lat: 52.5308,
    lng: 13.4569,
    type: 'dance'
  },
  {
    name: 'Detmold University of Music',
    lat: 51.9361,
    lng: 8.8722,
    type: 'music'
  },
  {
    name: 'Dresden University of Fine Arts',
    lat: 51.0504,
    lng: 13.7373,
    type: 'art'
  },
  {
    name: 'Robert Schumann University Düsseldorf',
    lat: 51.2277,
    lng: 6.7735,
    type: 'music'
  },
  {
    name: 'Art Academy of Düsseldorf',
    lat: 51.2332,
    lng: 6.7734,
    type: 'art'
  },
  {
    name: 'College of Fine Arts Essen',
    lat: 51.4556,
    lng: 7.0116,
    type: 'art'
  },
  {
    name: 'Folkwang University of the Arts',
    lat: 51.4431,
    lng: 7.0025,
    type: 'art'
  },
  {
    name: 'Städelschule Frankfurt',
    lat: 50.1109,
    lng: 8.6821,
    type: 'art'
  },
  {
    name: 'Frankfurt University of Music',
    lat: 50.1157,
    lng: 8.6692,
    type: 'music'
  },
  {
    name: 'Freiburg University of Music',
    lat: 47.9990,
    lng: 7.8421,
    type: 'music'
  },
  {
    name: 'Burg Giebichenstein Halle',
    lat: 51.4969,
    lng: 11.9688,
    type: 'art'
  },
  {
    name: 'University of Fine Arts Hamburg',
    lat: 53.5511,
    lng: 9.9937,
    type: 'art'
  },
  {
    name: 'State Academy of Fine Arts Karlsruhe',
    lat: 49.0069,
    lng: 8.4037,
    type: 'art'
  },
  {
    name: 'Karlsruhe University of Art and Design',
    lat: 49.0136,
    lng: 8.3858,
    type: 'design'
  },
  {
    name: 'Muthesius Art College',
    lat: 54.3233,
    lng: 10.1228,
    type: 'art'
  },
  {
    name: 'Academy of Media Arts Cologne',
    lat: 50.9375,
    lng: 6.9603,
    type: 'media'
  },
  {
    name: 'University of Visual Arts Leipzig',
    lat: 51.3397,
    lng: 12.3731,
    type: 'art'
  },
  {
    name: 'Mannheim University of Music',
    lat: 49.4875,
    lng: 8.4660,
    type: 'music'
  },
  {
    name: 'Academy of Fine Arts Munich',
    lat: 48.1497,
    lng: 11.5806,
    type: 'art'
  },
  {
    name: 'University of Television and Film Munich',
    lat: 48.1505,
    lng: 11.5677,
    type: 'film'
  },
  {
    name: 'University of Music and Theatre Munich',
    lat: 48.1429,
    lng: 11.5797,
    type: 'music'
  }
]; 