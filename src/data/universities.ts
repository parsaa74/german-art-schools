import { Program } from '@/types/school';

export interface ApplicationDeadlines {
  winter?: string;
  summer?: string;
}

export interface University {
  id: string;
  name: string;
  location: [number, number];
  type: 'University' | 'University of Applied Sciences' | 'Art Academy' | 'Private Institution' | 'Kunsthochschule';
  programs: Array<{
    name: string;
    degree: string;
    applicationDeadlines: ApplicationDeadlines;
    tuitionFees: string;
    language: string;
    duration: string;
    description: string;
    requirements: string[];
  }>;
  description: string;
  website: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
}

export const universities: University[] = [
  {
    id: "1",
    name: "Bauhaus-Universität Weimar",
    location: [11.329, 50.979],
    type: "University",
    programs: [
      {
        name: "Architecture",
        degree: "Master of Architecture",
        applicationDeadlines: {
          winter: "July 15"
        },
        tuitionFees: "€1,500 per semester",
        language: "German, some courses in English",
        duration: "4 semesters",
        description: "Advanced architectural studies with focus on sustainable design and urban planning",
        requirements: [
          "Bachelor's degree in Architecture or equivalent",
          "Portfolio of work",
          "German language proficiency (B2)"
        ]
      }
    ],
    description: "Historic institution known for art, design, and architecture, following the Bauhaus tradition.",
    website: "https://www.uni-weimar.de",
    contact: {
      email: "info@uni-weimar.de",
      phone: "+49 3643 58-0",
      address: "Geschwister-Scholl-Straße 8, 99423 Weimar, Germany"
    }
  },
  {
    id: "2",
    name: "Burg Giebichenstein Kunsthochschule Halle",
    location: [11.963, 51.489],
    type: "Kunsthochschule",
    programs: [
      {
        name: "Fine Arts",
        degree: "Diploma in Fine Arts",
        applicationDeadlines: {
          winter: "June 1"
        },
        tuitionFees: "€500 per semester",
        language: "German",
        duration: "8 semesters",
        description: "Traditional fine arts program with emphasis on practical skills",
        requirements: [
          "Portfolio review",
          "Entrance examination",
          "German language proficiency (B2)"
        ]
      }
    ],
    description: "Renowned art and design school with a focus on practical and theoretical artistic education.",
    website: "https://www.burg-halle.de",
    contact: {
      email: "info@burg-halle.de",
      phone: "+49 345 7751-50",
      address: "Neuwerk 7, 06108 Halle (Saale), Germany"
    }
  },
  {
    id: "3",
    name: "Hochschule für Bildende Künste Dresden",
    location: [13.736, 51.052],
    type: "Kunsthochschule",
    programs: [
      {
        name: "Visual Arts",
        degree: "Diploma in Visual Arts",
        applicationDeadlines: {
          winter: "March 31"
        },
        tuitionFees: "€300 per semester",
        language: "German",
        duration: "10 semesters",
        description: "Comprehensive visual arts program with focus on contemporary practices",
        requirements: [
          "Portfolio submission",
          "Artistic aptitude test",
          "German language proficiency (B2)"
        ]
      }
    ],
    description: "Leading institution for contemporary art education with strong emphasis on experimental approaches.",
    website: "https://www.hfbk-dresden.de",
    contact: {
      email: "info@hfbk-dresden.de",
      phone: "+49 351 4402-0",
      address: "Brühlsche Terrasse 1, 01067 Dresden, Germany"
    }
  },
  {
    id: "kunstakademie-dusseldorf",
    name: "Kunstakademie Düsseldorf",
    location: [6.777, 51.233],
    type: "Kunsthochschule",
    description: "Prestigious academy known for producing influential contemporary artists.",
    programs: [
      {
        name: "Painting",
        degree: "Diploma in Fine Arts",
        applicationDeadlines: {
          winter: "April 30"
        },
        tuitionFees: "€300 per semester",
        language: "German",
        duration: "10 semesters",
        description: "Renowned painting program with emphasis on contemporary practices",
        requirements: [
          "Portfolio submission",
          "Artistic aptitude test",
          "German language proficiency (B2)"
        ]
      }
    ],
    website: "https://www.kunstakademie-duesseldorf.de",
    contact: {
      email: "info@kunstakademie-duesseldorf.de",
      phone: "+49 211 1396-219",
      address: "Eiskellerstraße 1, 40213 Düsseldorf, Germany"
    }
  },
  {
    id: "udk-berlin",
    name: "Universität der Künste Berlin",
    location: [13.324, 52.507],
    type: "University",
    description: "One of Europe's largest arts universities, covering all artistic disciplines.",
    programs: [
      {
        name: "Sound Studies",
        degree: "Master of Arts",
        applicationDeadlines: {
          winter: "May 31"
        },
        tuitionFees: "€300 per semester",
        language: "German and English",
        duration: "4 semesters",
        description: "Experimental sound art and acoustic design program",
        requirements: [
          "Bachelor's degree in related field",
          "Portfolio of work",
          "German or English language proficiency (B2)"
        ]
      },
      {
        name: "Visual Arts",
        degree: "Bachelor of Fine Arts",
        applicationDeadlines: {
          winter: "March 31"
        },
        tuitionFees: "€300 per semester",
        language: "German",
        duration: "8 semesters",
        description: "Comprehensive visual arts program with various specializations",
        requirements: [
          "Portfolio submission",
          "Artistic aptitude test",
          "German language proficiency (B2)"
        ]
      }
    ],
    website: "https://www.udk-berlin.de",
    contact: {
      email: "info@udk-berlin.de",
      phone: "+49 30 3185-0",
      address: "Einsteinufer 43-53, 10587 Berlin, Germany"
    }
  },
  {
    id: "4",
    name: "Hochschule für Bildende Künste Hamburg",
    location: [9.933, 53.571],
    type: "Kunsthochschule",
    programs: [
      {
        name: "Visual Communication",
        degree: "Diploma in Fine Arts",
        applicationDeadlines: {
          winter: "February 1"
        },
        tuitionFees: "€300 per semester",
        language: "German",
        duration: "10 semesters",
        description: "Innovative program combining traditional and digital visual communication",
        requirements: [
          "Portfolio review",
          "Entrance examination",
          "German language proficiency (B2)"
        ]
      }
    ],
    description: "Progressive art school known for its interdisciplinary approach and international network.",
    website: "https://www.hfbk-hamburg.de",
    contact: {
      email: "info@hfbk-hamburg.de",
      phone: "+49 40 428989-0",
      address: "Lerchenfeld 2, 22081 Hamburg, Germany"
    }
  },
  {
    id: "5",
    name: "Kunstakademie Düsseldorf",
    location: [6.777, 51.233],
    type: "Kunsthochschule",
    programs: [
      {
        name: "Fine Arts",
        degree: "Diploma in Fine Arts",
        applicationDeadlines: {
          winter: "May 1",
          summer: "December 1"
        },
        tuitionFees: "€300 per semester",
        language: "German",
        duration: "10 semesters",
        description: "Prestigious fine arts program with emphasis on individual artistic development",
        requirements: [
          "Portfolio submission",
          "Artistic aptitude test",
          "German language proficiency (B2)"
        ]
      }
    ],
    description: "Prestigious academy known for producing influential contemporary artists.",
    website: "https://www.kunstakademie-duesseldorf.de",
    contact: {
      email: "info@kunstakademie-duesseldorf.de",
      phone: "+49 211 1396-219",
      address: "Eiskellerstraße 1, 40213 Düsseldorf, Germany"
    }
  },
  {
    id: "hfbk-hamburg",
    name: "Hochschule für Bildende Künste Hamburg",
    location: [9.933, 53.571],
    type: "Kunsthochschule",
    programs: [
      {
        name: "Visual Communication",
        degree: "Diploma in Fine Arts",
        applicationDeadlines: {
          winter: "April 30"
        },
        tuitionFees: "€300 per semester",
        language: "German",
        duration: "10 semesters",
        description: "Innovative program combining traditional and digital visual communication",
        requirements: [
          "Portfolio review",
          "Entrance examination",
          "German language proficiency (B2)"
        ]
      }
    ],
    description: "Progressive art school known for its interdisciplinary approach and international network.",
    website: "https://www.hfbk-hamburg.de",
    contact: {
      email: "info@hfbk-hamburg.de",
      phone: "+49 40 428989-0",
      address: "Lerchenfeld 2, 22081 Hamburg, Germany"
    }
  },
  {
    id: "kunstakademie-munchen",
    name: "Akademie der Bildenden Künste München",
    location: [11.576, 48.137],
    type: "Kunsthochschule",
    programs: [
      {
        name: "Fine Arts",
        degree: "Diploma in Fine Arts",
        applicationDeadlines: {
          winter: "May 15"
        },
        tuitionFees: "€300 per semester",
        language: "German",
        duration: "10 semesters",
        description: "Prestigious fine arts program with emphasis on individual artistic development",
        requirements: [
          "Portfolio submission",
          "Artistic aptitude test",
          "German language proficiency (B2)"
        ]
      }
    ],
    description: "Prestigious academy known for producing influential contemporary artists.",
    website: "https://www.kunstakademie-munchen.de",
    contact: {
      email: "info@kunstakademie-munchen.de",
      phone: "+49 89 5585-100",
      address: "Amalienstrasse 33, 80799 Munich, Germany"
    }
  },
  {
    id: "kunsthochschule-berlin",
    name: "Kunsthochschule Berlin-Weißensee",
    location: [13.324, 52.507],
    type: "Kunsthochschule",
    programs: [
      {
        name: "Visual Arts",
        degree: "Diploma in Visual Arts",
        applicationDeadlines: {
          winter: "March 31"
        },
        tuitionFees: "€300 per semester",
        language: "German",
        duration: "10 semesters",
        description: "Comprehensive visual arts program with focus on contemporary practices",
        requirements: [
          "Portfolio submission",
          "Artistic aptitude test",
          "German language proficiency (B2)"
        ]
      }
    ],
    description: "Leading institution for contemporary art education with strong emphasis on experimental approaches.",
    website: "https://www.kunsthochschule-berlin.de",
    contact: {
      email: "info@kunsthochschule-berlin.de",
      phone: "+49 30 2063-200",
      address: "Weißenseer Strasse 11, 10785 Berlin, Germany"
    }
  }
]; 