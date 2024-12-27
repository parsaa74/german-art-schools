export interface GermanState {
  name: string;
  color: string;
  labelPosition: [number, number];
  coordinates: [number, number][];
  population: number;
  capital: string;
}

export const germanStates: GermanState[] = [
  {
    name: 'Bavaria',
    color: '#4a90e2',
    labelPosition: [48.7904, 11.4979],
    population: 13124737,
    capital: 'Munich',
    coordinates: [
      [47.2703, 10.1794],
      [47.4162, 10.8989],
      [47.5802, 12.1006],
      [47.7022, 13.0084],
      [48.7775, 13.8333],
      [49.1166, 12.4333],
      [50.2666, 11.9833],
      [50.5666, 12.3666],
      [50.3166, 11.2666],
      [49.7916, 10.1333],
      [49.3516, 9.5666],
      [48.6833, 10.1666],
      [47.2703, 10.1794]
    ]
  },
  {
    name: 'North Rhine-Westphalia',
    color: '#50e3c2',
    labelPosition: [51.4332, 7.6616],
    population: 17925570,
    capital: 'Düsseldorf',
    coordinates: [
      [51.8433, 6.1563],
      [52.5283, 7.2167],
      [52.1583, 8.4833],
      [51.2016, 9.4166],
      [50.3233, 7.6133],
      [50.3633, 6.2433],
      [51.0516, 5.9566],
      [51.8433, 6.1563]
    ]
  },
  // ... Add all 16 German states with their coordinates
];

export const majorRivers = [
  {
    name: 'Rhine',
    color: '#4488ff',
    width: 2,
    coordinates: [
      [47.6667, 8.6167], // Lake Constance
      [49.0000, 8.3833], // Karlsruhe
      [50.0667, 8.6167], // Frankfurt
      [51.2167, 6.7667], // Düsseldorf
      [51.9667, 6.6833]  // Netherlands border
    ]
  },
  {
    name: 'Elbe',
    color: '#4488ff',
    width: 2,
    coordinates: [
      [50.7833, 14.2333], // Czech border
      [51.0500, 13.7333], // Dresden
      [51.8833, 12.4333], // Dessau
      [53.5500, 9.9833],  // Hamburg
      [53.8833, 8.7000]   // North Sea
    ]
  },
  // Add more rivers...
];

export const majorLakes = [
  {
    name: 'Lake Constance',
    color: '#4488ff',
    coordinates: [
      [47.4833, 9.0333],
      [47.5833, 9.4333],
      [47.6500, 9.3333],
      [47.7000, 8.9833],
      [47.4833, 9.0333]
    ]
  },
  // Add more lakes...
];

export const majorCities = [
  {
    name: 'Berlin',
    coordinates: [52.5200, 13.4050],
    isCapital: true,
    population: 3669495
  },
  {
    name: 'Hamburg',
    coordinates: [53.5511, 9.9937],
    isCapital: false,
    population: 1841179
  },
  // Add more cities...
]; 