export interface School {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  programs: string[];
  professors: string[];
  website?: string;
  description?: string;
} 