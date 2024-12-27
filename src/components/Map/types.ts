export interface GermanState {
  name: string;
  color: string;
  labelPosition: [number, number];
  coordinates: Array<[number, number]>;
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
    name: 'Baden-Württemberg',
    color: '#e6c200',
    labelPosition: [48.6616, 9.3501],
    population: 11070000,
    capital: 'Stuttgart',
    coordinates: [
      [47.5333, 7.5833],
      [47.5833, 9.7833],
      [48.6833, 10.1666],
      [49.7916, 9.1166],
      [49.6416, 8.3500],
      [48.9916, 8.1500],
      [47.5333, 7.5833]
    ]
  },
  {
    name: 'Berlin',
    color: '#ff4444',
    labelPosition: [52.5200, 13.4050],
    population: 3669495,
    capital: 'Berlin',
    coordinates: [
      [52.6755, 13.0891],
      [52.6755, 13.7607],
      [52.3382, 13.7607],
      [52.3382, 13.0891],
      [52.6755, 13.0891]
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
  // Add more states...
]; 