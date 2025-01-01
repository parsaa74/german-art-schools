import { School } from '@/types/school';
import { updateSchoolsWithPrograms } from './programs';

export const schools: School[] = updateSchoolsWithPrograms([
  {
    id: 'bauhaus',
    name: 'Bauhaus-Universität Weimar',
    type: 'art',
    lat: 50.9745,
    lng: 11.3275,
    state: 'Thuringia',
    founded: 1919,
    website: 'https://www.uni-weimar.de'
  },
  {
    id: 'burg',
    name: 'Burg Giebichenstein Kunsthochschule Halle',
    type: 'art',
    lat: 51.4969,
    lng: 11.9688,
    state: 'Saxony-Anhalt',
    founded: 1915,
    website: 'https://www.burg-halle.de'
  },
  {
    id: 'hbk-bs',
    name: 'Hochschule für Bildende Künste Braunschweig',
    type: 'art',
    lat: 52.2729,
    lng: 10.5284,
    state: 'Lower Saxony',
    founded: 1963,
    website: 'https://www.hbk-bs.de'
  },
  {
    id: 'hfbk-dresden',
    name: 'Hochschule für Bildende Künste Dresden',
    type: 'art',
    lat: 51.0504,
    lng: 13.7373,
    state: 'Saxony',
    founded: 1764,
    website: 'https://www.hfbk-dresden.de'
  },
  {
    id: 'hfbk-hamburg',
    name: 'Hochschule für Bildende Künste Hamburg',
    type: 'art',
    lat: 53.5676,
    lng: 9.9763,
    state: 'Hamburg',
    founded: 1767,
    website: 'https://www.hfbk-hamburg.de'
  },
  {
    id: 'hbks',
    name: 'Hochschule für Bildende Künste Saar',
    type: 'art',
    lat: 49.2354,
    lng: 6.9965,
    state: 'Saarland',
    founded: 1989,
    website: 'https://www.hbks.de'
  },
  {
    id: 'hfg-offenbach',
    name: 'Hochschule für Gestaltung Offenbach am Main',
    type: 'design',
    lat: 50.1019,
    lng: 8.7554,
    state: 'Hesse',
    founded: 1832,
    website: 'https://www.hfg-offenbach.de'
  },
  {
    id: 'hfg-gmuend',
    name: 'Hochschule für Gestaltung Schwäbisch Gmünd',
    type: 'design',
    lat: 48.8053,
    lng: 9.8033,
    state: 'Baden-Württemberg',
    founded: 1776,
    website: 'https://www.hfg-gmuend.de'
  },
  {
    id: 'hgb-leipzig',
    name: 'Hochschule für Grafik und Buchkunst Leipzig',
    type: 'art',
    lat: 51.3397,
    lng: 12.3731,
    state: 'Saxony',
    founded: 1764,
    website: 'https://www.hgb-leipzig.de'
  },
  {
    id: 'hfk-bremen',
    name: 'Hochschule für Künste Bremen',
    type: 'art',
    lat: 53.0793,
    lng: 8.8017,
    state: 'Bremen',
    founded: 1873,
    website: 'https://www.hfk-bremen.de'
  },
  {
    id: 'hks-ottersberg',
    name: 'Hochschule für Künste im Sozialen Ottersberg',
    type: 'art',
    lat: 53.1276,
    lng: 9.1457,
    state: 'Lower Saxony',
    founded: 1967,
    website: 'https://www.hks-ottersberg.de'
  },
  {
    id: 'kunstakademie-duesseldorf',
    name: 'Kunstakademie Düsseldorf',
    type: 'art',
    lat: 51.2277,
    lng: 6.7735,
    state: 'North Rhine-Westphalia',
    founded: 1773,
    website: 'https://www.kunstakademie-duesseldorf.de'
  },
  {
    id: 'kunstakademie-muenster',
    name: 'Kunstakademie Münster',
    type: 'art',
    lat: 51.9607,
    lng: 7.6261,
    state: 'North Rhine-Westphalia',
    founded: 1971,
    website: 'https://www.kunstakademie-muenster.de'
  },
  {
    id: 'kh-berlin',
    name: 'Kunsthochschule Berlin-Weißensee',
    type: 'art',
    lat: 52.5498,
    lng: 13.4294,
    state: 'Berlin',
    founded: 1946,
    website: 'https://www.kh-berlin.de'
  },
  {
    id: 'khm',
    name: 'Kunsthochschule für Medien Köln',
    type: 'media',
    lat: 50.9375,
    lng: 6.9603,
    state: 'North Rhine-Westphalia',
    founded: 1990,
    website: 'https://www.khm.de'
  },
  {
    id: 'kunsthochschule-kassel',
    name: 'Kunsthochschule Kassel',
    type: 'art',
    lat: 51.3127,
    lng: 9.4797,
    state: 'Hesse',
    founded: 1777,
    website: 'https://www.kunsthochschule-kassel.de'
  },
  {
    id: 'kunsthochschule-mainz',
    name: 'Kunsthochschule Mainz',
    type: 'art',
    lat: 49.9929,
    lng: 8.2473,
    state: 'Rhineland-Palatinate',
    founded: 1757,
    website: 'https://www.kunsthochschule-mainz.de'
  },
  {
    id: 'muthesius',
    name: 'Muthesius Kunsthochschule Kiel',
    type: 'art',
    lat: 54.3233,
    lng: 10.1228,
    state: 'Schleswig-Holstein',
    founded: 1907,
    website: 'https://www.muthesius-kunsthochschule.de'
  },
  {
    id: 'akademie-karlsruhe',
    name: 'Staatliche Akademie der Bildenden Künste Karlsruhe',
    type: 'art',
    lat: 49.0069,
    lng: 8.3983,
    state: 'Baden-Württemberg',
    founded: 1854,
    website: 'https://www.kunstakademie-karlsruhe.de'
  },
  {
    id: 'abk-stuttgart',
    name: 'Staatliche Akademie der Bildenden Künste Stuttgart',
    type: 'art',
    lat: 48.7758,
    lng: 9.1829,
    state: 'Baden-Württemberg',
    founded: 1761,
    website: 'https://www.abk-stuttgart.de'
  },
  {
    id: 'staedelschule',
    name: 'Staatliche Hochschule für Bildende Künste – Städelschule Frankfurt',
    type: 'art',
    lat: 50.1109,
    lng: 8.6821,
    state: 'Hesse',
    founded: 1817,
    website: 'https://www.staedelschule.de'
  },
  {
    id: 'udk-berlin',
    name: 'Universität der Künste Berlin',
    type: 'art',
    lat: 52.5200,
    lng: 13.3285,
    state: 'Berlin',
    founded: 1696,
    website: 'https://www.udk-berlin.de'
  }
]); 