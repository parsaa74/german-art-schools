import { SchoolID, WorkID } from './common';

interface StudentProfile {
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

export type { StudentProfile };