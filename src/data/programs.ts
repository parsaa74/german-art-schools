import { Program, School } from '@/types/school';

export const programsData: Record<string, Program[]> = {
  'Bauhaus-Universität Weimar': [
    {
      name: 'Master of Science in Human-Computer Interaction (HCI)',
      degree: 'Master of Science (MSc)',
      applicationDeadlines: {
        winter: {
          start: '15 July',
          end: '30 September'
        },
        summer: {
          start: '15 January',
          end: '31 March'
        }
      },
      professors: [
        {
          name: 'Prof. Dr. Eva Hornecker',
          email: 'eva.hornecker@uni-weimar.de',
        }
      ],
      tuitionFees: 'None',
      language: 'English',
      duration: '4 semesters',
      description: 'Research-oriented program with opportunities to participate in interdisciplinary projects. State-of-the-art facilities, including modern laboratories and equipment.',
      specializations: ['Human-Computer Interaction', 'User Experience Design', 'Interactive Systems']
    }
  ],
  'University of Siegen': [
    {
      name: 'Master of Science in Human-Computer Interaction',
      degree: 'Master of Science (MSc)',
      applicationDeadlines: {
        winter: {
          start: '1 May',
          end: '1 June'
        },
        summer: {
          start: '1 November',
          end: '1 December'
        }
      },
      professors: [
        {
          name: 'Prof. Dr. Marc Hassenzahl',
          email: 'marc.hassenzahl@uni-siegen.de',
        },
        {
          name: 'Prof. Dr. Thomas Ludwig',
          email: 'thomas.ludwig@uni-siegen.de',
        }
      ],
      tuitionFees: 'None',
      language: 'English',
      duration: '4 semesters',
      description: 'The program focuses on interactive technologies, user-centered design, and usability engineering. Emphasis on qualitative empirical methods and integration of organizational and technology development processes.',
      specializations: ['Interactive Technologies', 'User-Centered Design', 'Usability Engineering']
    }
  ],
  'Technische Hochschule Ingolstadt': [
    {
      name: 'Master of Science in User Experience Design',
      degree: 'Master of Science (MSc)',
      applicationDeadlines: {
        summer: {
          start: '15 October',
          end: '15 November'
        },
        winter: {
          start: '2 May',
          end: '15 June'
        }
      },
      professors: [
        {
          name: 'Prof. Dr. Markus Helfert',
          email: 'markus.helfert@thi.de',
        },
        {
          name: 'Prof. Dr. Martina Ziefle',
          email: 'martina.ziefle@thi.de',
        }
      ],
      tuitionFees: 'None',
      language: 'English',
      duration: '4 semesters',
      description: 'The program focuses on the design and development of user-friendly interfaces and experiences. Emphasis on interdisciplinary approaches combining design, psychology, and computer science.',
      specializations: ['User Experience Design', 'Interface Design', 'Human-Computer Interaction']
    }
  ],
  'Universität Bremen': [
    {
      name: 'Master of Science in Digital Media',
      degree: 'Master of Science (MSc)',
      applicationDeadlines: {
        winter: {
          start: '1 June',
          end: '15 July'
        }
      },
      professors: [
        {
          name: 'Prof. Dr. Rainer Malaka',
          email: 'rainer.malaka@uni-bremen.de',
        },
        {
          name: 'Prof. Dr. Claudia Müller-Birn',
          email: 'claudia.mueller-birn@uni-bremen.de',
        }
      ],
      tuitionFees: 'None',
      language: 'English',
      duration: '4 semesters',
      description: 'Joint program with University of the Arts Bremen, focusing on the intersection of art, design, and technology in digital media. Offers specializations in Media Informatics and Media Design.',
      specializations: ['Media Informatics', 'Media Design', 'Digital Media']
    }
  ]
};

// Now let's update the schools data to include these programs
export const updateSchoolsWithPrograms = (schools: School[]): School[] => {
  return schools.map(school => ({
    ...school,
    programs: programsData[school.name] || []
  }));
}; 