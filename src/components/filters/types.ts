export type ProgramType = 
  | 'Design'
  | 'Design & Architecture'
  | 'Art & Design'
  | 'Fine Arts'
  | 'Media Arts'
  | 'Design & Media'
  | 'Graphic Design'
  | 'Multidisciplinary Arts'
  | 'Art Therapy'
  | 'Contemporary Art'
  | 'Visual Arts'
  | 'Technology & Media'
  | 'Technology & Sciences'
  | 'Engineering'
  | 'Design & Engineering'
  | 'Humanities'
  | 'Engineering & Social Sciences'
  | 'Technology & Automotive'
  | 'Social & Health Sciences'
  | 'Liberal Arts'
  | 'Performing Arts'
  | 'Arts & Social Sciences'
  | 'Engineering & Technology'
  | 'Fine Arts & Conservation';

export type Region = 
  | 'Baden-Württemberg'
  | 'Bavaria'
  | 'Berlin'
  | 'Brandenburg'
  | 'Bremen'
  | 'Hamburg'
  | 'Hesse'
  | 'Lower Saxony'
  | 'North Rhine-Westphalia'
  | 'Rhineland-Palatinate'
  | 'Saxony'
  | 'Saxony-Anhalt'
  | 'Saarland'
  | 'Schleswig-Holstein'
  | 'Thuringia';

export type InstitutionType = 
  | 'University' 
  | 'University of Applied Sciences' 
  | 'Art Academy' 
  | 'Private Institution'
  | 'Kunsthochschule';

export type Language = 
  | 'German Only' 
  | 'English Only' 
  | 'German & English'
  | 'English & German'
  | 'Bilingual';

export interface FilterState {
  programTypes: ProgramType[];
  regions: Region[];
  institutionTypes: InstitutionType[];
  language: Language | null;
}

export interface FilterOption<T> {
  value: T;
  label: string;
  count?: number;
}

export interface FilterGroupProps<T> {
  category: string;
  options: FilterOption<T>[];
  selectedValues: T[];
  onChange: (values: T[]) => void;
  multiSelect?: boolean;
}

export interface FilterSystemProps {
  nodes: any[]; // Replace with your node type
  onFilterChange: (filteredNodes: any[]) => void; // Replace with your node type
} 