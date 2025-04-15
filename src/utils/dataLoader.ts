import { ProcessedUniversity } from '@/stores/schoolStore';

// Interface for the enhanced school data
export interface EnhancedSchoolData {
  statistics: {
    last_updated: string;
    total_schools: number;
    total_programs: number;
  };
  universities: {
    [key: string]: {
      id: string;
      coordinates: {
        lat: number;
        lng: number;
      };
      ranking?: {
        national?: number;
        specialization_rank?: {
          [key: string]: number;
        };
      };
      stats?: {
        students?: number;
        acceptance_rate?: number;
        student_staff_ratio?: number;
        founded?: number;
      };
      city: string;
      state: string;
      type: string;
      programs: Array<{
        name: string;
        degree: string;
        applicationDeadlines: {
          winter?: { start: string; end: string };
          summer?: { start: string; end: string };
        };
        language: string;
        duration: string;
        description?: string;
        specializations?: string[];
      }>;
      website: string;
      description?: string;
    };
  };
}

export async function loadEnhancedData(): Promise<ProcessedUniversity[]> {
  try {
    // Try different paths to find the file
    let response;
    try {
      response = await fetch('/enhanced_german_art_schools.json');
    } catch (error) {
      console.log('First fetch attempt failed, trying alternative path');
      response = await fetch('./data/enhanced_german_art_schools.json');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch enhanced data: ${response.statusText}`);
    }

    const data: EnhancedSchoolData = await response.json();

    // Process the enhanced data into the format we need
    const processedUniversities: ProcessedUniversity[] = Object.entries(data.universities).map(([name, uni]) => {
      // Determine school type based on program types
      let type = uni.type || 'university';
      if (type === 'academy' || type === 'kunsthochschule') {
        type = 'art_academy';
      } else if (type === 'university_of_arts') {
        type = 'art_academy';
      }

      const programTypes = uni.programs.map(p => p.name);

      return {
        id: uni.id,
        name: name,
        location: [uni.coordinates.lat, uni.coordinates.lng],
        type,
        state: uni.state,
        programCount: uni.programs.length,
        website: uni.website,
        programTypes,
        city: uni.city,
        description: uni.description,
        founded: uni.stats?.founded ? uni.stats.founded.toString() : undefined,
        students: uni.stats?.students ? uni.stats.students.toString() : undefined,
        programs: uni.programs
      };
    });

    return processedUniversities;
  } catch (error) {
    console.error('Error loading enhanced data:', error);
    throw error;
  }
}
