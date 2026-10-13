import type { Fee } from '@/lib/taxonomy';

// Interface for the processed university data used within the app
export interface ProcessedUniversity {
  id: string;
  name: string;
  location: [number, number]; // [lat, lng]
  type: string; // Derived from programTypes
  state: string;
  programCount: number;
  website: string;
  programTypes: string[];
  // Additional properties for the info panel
  city?: string;
  description?: string;
  founded?: string;
  coordinates?: { lat: number | null; lng: number | null };
  // Application method
  applicationMethod?: 'uni-assist' | 'direct';
  applicationMethodSource?: { url: string; checked: string };
  // tuition for non-EU students where known (perSemester null = charged, amount not published by us)
  nonEuTuition?: { perSemester: string | null; source: string; checked: string };
  // Researched on official pages (see data/research/): costs, route details, contact
  fees?: Fee[];
  applicationRoute?: { method: string; notes: string; url?: string; scope?: string };
  contact?: { email?: string; phone?: string; url?: string };
  sources?: Record<string, string>;   // field -> official page it came from
  researched?: string;                // date those pages were checked
  // Enhanced data properties
  programs?: Array<{
    name: string;
    degree: string;
    applicationDeadlines: {
      winter?: { start?: string; end: string; cycle?: string };   // a year in the date = one published round
      summer?: { start?: string; end: string; cycle?: string };
    };
    language: string;
    duration: string;
    description?: string;
    specializations?: string[];
    intakes?: Array<'winter' | 'summer'>; // sourced independently of deadline coverage
    searchAliases?: string[]; // official names / former names, not additional degrees
    teachingAreas?: Array<{ name: string; kind: string; source: string }>;
    jointWith?: string[]; // partner school IDs
    jointProgramId?: string; // groups listings of the same joint programme
    jointProfile?: string; // e.g. Media Design MA vs Media Informatics MSc
    applicationMethods?: Array<'direct' | 'uni-assist'>; // sourced handling route for foreign qualifications, not fee exemptions
    applicationRoute?: { method: string; notes: string; url?: string; scope?: string };
    admission?: 'aptitude' | 'open' | 'restricted' | 'aptitude-and-restricted';   // researched; see taxonomy.admissionOf
    admissionSource?: string;
    status?: { status: string; notes?: string };
    otherDeadlines?: Array<{ kind: string; semester: string | null; start: string | null; end: string; recurring: boolean; cycle?: string | null; scope?: string }>;
    requirements?: Array<{ label: string; text: string }>;
    fees?: Fee[];
    sources?: Record<string, string>;
    researched?: string;
  }>;
  stats?: {
    founded?: number;
  };
}

