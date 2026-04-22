export interface ProgramDeadline {
  start: string;
  end: string;
}

export interface ProgramApplicationDeadlines {
  winter?: ProgramDeadline;
  summer?: ProgramDeadline;
}

export interface FacultyMember {
  name: string;
  title?: string;
  role?: string;
  profileUrl?: string;
  specializations?: string[];
}

export interface ProgramDetails {
  programUrl?: string;
  applicationUrl?: string;
  faculty?: FacultyMember[];
  tuitionEuroPerSemester?: number | null;
  capacity?: number | null;
  studentsEnrolled?: number | null;
  languageRequirements?: string;
  portfolioRequired?: boolean | null;
  extractedAt?: string;
  sourceUrl?: string;
}

export interface Program {
  program_id: string;
  schoolId: string;
  schoolName: string;
  name: string;
  degree: string;
  applicationDeadlines?: ProgramApplicationDeadlines;
  language?: string;
  duration?: string;
  description?: string;
  specializations?: string[];
  details?: ProgramDetails;
}

export interface ProgramEmbedding {
  program_id: string;
  vector: number[];
  model: string;
  dim: number;
  createdAt: string;
}

export interface ProgramEdge {
  src: string;
  dst: string;
  weight: number;
}

export interface ProgramGraph {
  createdAt: string;
  model: string;
  k: number;
  threshold: number;
  edges: ProgramEdge[];
}
