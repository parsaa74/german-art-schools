// German Art Movements Timeline and Data
// This file contains information about major German art movements
// to enhance the visualization with historical context

export interface ArtMovement {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  description: string;
  color: string; // Primary color associated with the movement
  accentColor: string; // Secondary color
  characteristics: string[]; // Key visual characteristics
  keySchools?: string[]; // Schools associated with this movement
}

export const germanArtMovements: ArtMovement[] = [
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    startYear: 1919,
    endYear: 1933,
    description: 'The Bauhaus was a German art school operational from 1919 to 1933 that combined crafts and the fine arts, famous for its approach to design.',
    color: '#E53935', // Red
    accentColor: '#FFC107', // Yellow
    characteristics: ['Geometric forms', 'Functionality', 'Minimalism', 'Primary colors'],
    keySchools: ['Bauhaus-Universität Weimar', 'Hochschule für Gestaltung Offenbach']
  },
  {
    id: 'expressionism',
    name: 'German Expressionism',
    startYear: 1905,
    endYear: 1937,
    description: 'German Expressionism consisted of a number of related creative movements in Germany before the First World War that reached a peak in Berlin during the 1920s.',
    color: '#5D4037', // Brown
    accentColor: '#4CAF50', // Green
    characteristics: ['Distortion', 'Emotional intensity', 'Bold colors', 'Angular forms'],
    keySchools: ['Kunstakademie Düsseldorf', 'Hochschule für Grafik und Buchkunst Leipzig']
  },
  {
    id: 'neue_sachlichkeit',
    name: 'Neue Sachlichkeit',
    startYear: 1919,
    endYear: 1933,
    description: 'New Objectivity was a movement in German art that arose during the 1920s as a reaction against expressionism.',
    color: '#455A64', // Blue Grey
    accentColor: '#9E9E9E', // Grey
    characteristics: ['Realism', 'Social criticism', 'Precision', 'Objectivity'],
    keySchools: ['Kunstakademie Düsseldorf', 'Universität der Künste Berlin']
  },
  {
    id: 'dada',
    name: 'Dada',
    startYear: 1916,
    endYear: 1924,
    description: 'Dada or Dadaism was an art movement of the European avant-garde in the early 20th century, with early centers in Zürich, Switzerland, and Berlin, Germany.',
    color: '#212121', // Black
    accentColor: '#F44336', // Red
    characteristics: ['Anti-art', 'Irrationality', 'Protest', 'Collage'],
    keySchools: ['Universität der Künste Berlin', 'Hochschule für Künste Bremen']
  },
  {
    id: 'fluxus',
    name: 'Fluxus',
    startYear: 1960,
    endYear: 1978,
    description: 'Fluxus was an international, interdisciplinary community of artists, composers, designers and poets that took shape in the 1960s and 1970s.',
    color: '#673AB7', // Deep Purple
    accentColor: '#FFEB3B', // Yellow
    characteristics: ['Intermedia', 'Experimental', 'Performance', 'Anti-commercialism'],
    keySchools: ['Kunsthochschule für Medien Köln', 'Hochschule für Grafik und Buchkunst Leipzig']
  },
  {
    id: 'zero_group',
    name: 'Zero Group',
    startYear: 1957,
    endYear: 1966,
    description: 'The Zero Group was an international art movement founded by Heinz Mack and Otto Piene that focused on light and movement.',
    color: '#2196F3', // Blue
    accentColor: '#FFFFFF', // White
    characteristics: ['Light art', 'Kinetic art', 'Monochrome', 'Minimalism'],
    keySchools: ['Kunstakademie Düsseldorf', 'Staatliche Hochschule für Gestaltung Karlsruhe']
  },
  {
    id: 'neue_wilde',
    name: 'Neue Wilde',
    startYear: 1977,
    endYear: 1987,
    description: 'The Neue Wilde (New Wild Ones) were a group of German and Austrian artists who rejected conceptual art and minimal art in favor of emotional, figurative painting.',
    color: '#FF9800', // Orange
    accentColor: '#9C27B0', // Purple
    characteristics: ['Expressive', 'Figurative', 'Vibrant colors', 'Spontaneity'],
    keySchools: ['Hochschule für Bildende Künste Dresden', 'Universität der Künste Berlin']
  }
];

// Map a school to its associated art movements
export function getSchoolArtMovements(schoolName: string): ArtMovement[] {
  return germanArtMovements.filter(movement => 
    movement.keySchools?.includes(schoolName)
  );
}

// Get an art movement based on a school's founding year
export function getArtMovementByFoundingYear(foundingYear: number): ArtMovement | undefined {
  return germanArtMovements.find(movement => 
    foundingYear >= movement.startYear && foundingYear <= movement.endYear
  );
}

// Get color scheme based on school type and founding year
export function getSchoolColorScheme(type: string, foundingYear?: number): {primary: string, secondary: string} {
  // Default colors based on school type
  const defaultColors: Record<string, {primary: string, secondary: string}> = {
    university: {primary: '#2979FF', secondary: '#5D9DFF'},
    art_academy: {primary: '#5D9DFF', secondary: '#85B8FF'},
    design_school: {primary: '#4D9EFF', secondary: '#4D9EFF'},
    music_academy: {primary: '#85B8FF', secondary: '#A7CBFF'},
    film_school: {primary: '#3D8BFF', secondary: '#3D8BFF'},
  };
  
  // If we have a founding year, try to match it to an art movement
  if (foundingYear) {
    const movement = getArtMovementByFoundingYear(foundingYear);
    if (movement) {
      return {
        primary: movement.color,
        secondary: movement.accentColor
      };
    }
  }
  
  return defaultColors[type] || defaultColors.university;
}

// Get a pattern style based on school specializations
export function getPatternStyle(specializations: string[]): string {
  if (specializations.some(s => s.toLowerCase().includes('design') || s.toLowerCase().includes('bauhaus'))) {
    return 'bauhaus';
  }
  if (specializations.some(s => s.toLowerCase().includes('expressionism') || s.toLowerCase().includes('painting'))) {
    return 'expressionism';
  }
  if (specializations.some(s => s.toLowerCase().includes('media') || s.toLowerCase().includes('digital'))) {
    return 'zero_group';
  }
  if (specializations.some(s => s.toLowerCase().includes('performance') || s.toLowerCase().includes('acting'))) {
    return 'fluxus';
  }
  
  return 'default';
}
