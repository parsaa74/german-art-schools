// Basic type aliases
export type SchoolID = string;
export type WorkID = string;

// Third-party module declarations
declare module 'negotiator';
declare module '@formatjs/intl-localematcher';

// School related interfaces
export interface School {
  id: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  type: 'university' | 'academy' | 'college';
  programs: Program[];
  professors: string[];
  website?: string;
  description?: string;
  logo?: string;
  founded?: number;
  studentCount?: number;
}

export interface Program {
  name: string;
  degree: string;
  applicationDeadlines?: {
    winter?: {
      start: string;
      end: string;
    };
    summer?: {
      start: string;
      end: string;
    };
  };
  professors?: Array<{
    name: string;
    email: string;
    position?: string;
  }>;
  tuitionFees?: string;
  language: string | string[];
  duration: string | number;
  description?: string;
  specializations?: string[];
  requirements?: string[];
  link?: string;
  id?: string;
}

// Map data interfaces
export interface StateData {
  id: string;
  name: string;
  path: string;
  population: number;
}

// Student profile interfaces
export interface StudentProfile {
  basics: {
    id: string;
    name: string;
    avatar: string;
    currentSchool: SchoolID;
    program: string;
    yearStarted: Date;
    expectedGraduation: Date;
    languages: string[];
    contactEmail: string;
  };
  
  education: {
    school: SchoolID;
    program: string;
    period: {
      start: Date;
      end: Date | null;
    };
    status: 'Current' | 'Completed' | 'Transferred';
    achievements: string[];
    coursework: string[];
  }[];
  
  portfolio: {
    works: {
      id: WorkID;
      title: string;
      thumbnail: string;
      medium: string[];
      year: number;
    }[];
    socialLinks: {
      instagram?: string;
      behance?: string;
      artstation?: string;
      personalWebsite?: string;
    };
    featuredWork?: WorkID;
  };
  
  interests: {
    artStyles: string[];
    mediums: string[];
    subjects: string[];
    techniques: string[];
  };
  
  collaborationStatus: {
    status: 'Open' | 'Busy' | 'Not Available';
    projectInterests: string[];
    availableHours: number;
    preferredRoles: string[];
  };
} 