import { School } from '@/types/school';

export const schools: School[] = [
  {
    id: '1',
    name: 'Kunstakademie Münster',
    lat: 51.9607,
    lng: 7.6261,
    city: 'Münster',
    state: 'North Rhine-Westphalia',
    programs: ['Fine Arts', 'Art Education'],
    professors: ['Prof. Dr. Claudia Blümle', 'Prof. Daniele Buetti'],
    website: 'https://www.kunstakademie-muenster.de',
    description: 'Academy of Fine Arts in Münster'
  },
  {
    id: '2',
    name: 'Academy of Fine Arts Nuremberg',
    lat: 49.4521,
    lng: 11.0767,
    city: 'Nuremberg',
    state: 'Bavaria',
    programs: ['Fine Arts', 'Art Education', 'Gold and Silversmithing'],
    professors: ['Prof. Michael Hakimi', 'Prof. Christine Rebet'],
    website: 'https://www.adbk-nuernberg.de',
    description: 'One of the oldest art academies in Central Europe'
  },
  {
    id: '3',
    name: 'University of Design Offenbach',
    lat: 50.1055,
    lng: 8.7623,
    city: 'Offenbach',
    state: 'Hesse',
    programs: ['Visual Communication', 'Product Design', 'Art Education'],
    professors: ['Prof. Dr. Marc Ries', 'Prof. Frank Georg Zebner'],
    website: 'https://www.hfg-offenbach.de',
    description: 'University focusing on design, art and media'
  },
  {
    id: '4',
    name: 'Film University Babelsberg',
    lat: 52.3906,
    lng: 13.1256,
    city: 'Potsdam',
    state: 'Brandenburg',
    programs: ['Film Directing', 'Cinematography', 'Film Production'],
    professors: ['Prof. Dr. Johannes Siebler', 'Prof. Barbara Albert'],
    website: 'https://www.filmuniversitaet.de',
    description: 'Germany\'s largest and oldest film school'
  }
];

export default schools; 