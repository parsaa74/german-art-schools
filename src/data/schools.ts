import { School } from '@/types';

export const schools: School[] = [
  {
    id: '1',
    name: 'Kunstakademie Münster',
    lat: 51.9607,
    lng: 7.6261,
    city: 'Münster',
    state: 'North Rhine-Westphalia',
    type: 'academy',
    professors: ['Prof. Dr. Claudia Blümle', 'Prof. Daniele Buetti'],
    programs: [
      {
        name: 'Fine Arts',
        degree: 'Bachelor of Fine Arts',
        applicationDeadlines: {
          winter: {
            start: '1 June',
            end: '15 July'
          }
        },
        professors: [
          {
            name: 'Prof. Dr. Claudia Blümle',
            email: 'claudia.bluemle@kunstakademie-muenster.de'
          },
          {
            name: 'Prof. Daniele Buetti',
            email: 'daniele.buetti@kunstakademie-muenster.de'
          }
        ],
        tuitionFees: 'None',
        language: 'German',
        duration: '8 semesters',
        description: 'Comprehensive fine arts program with focus on practical and theoretical artistic education.',
        specializations: ['Painting', 'Sculpture', 'Installation Art']
      },
      {
        name: 'Art Education',
        degree: 'Master of Education',
        applicationDeadlines: {
          winter: {
            start: '1 June',
            end: '15 July'
          }
        },
        professors: [
          {
            name: 'Prof. Dr. Claudia Blümle',
            email: 'claudia.bluemle@kunstakademie-muenster.de'
          }
        ],
        tuitionFees: 'None',
        language: 'German',
        duration: '4 semesters',
        description: 'Advanced program preparing students for teaching art in schools and other educational institutions.',
        specializations: ['Art Pedagogy', 'Art History', 'Art Theory']
      }
    ],
    website: 'https://www.kunstakademie-muenster.de',
    description: 'Academy of Fine Arts in Münster'
  },
  {
    id: '2',
    name: 'Academy of Fine Arts Nuremberg',
    lat: 49.4521,
    lng: 11.0767,
    city: 'Nuremberg',
    state: 'Bavaria',
    type: 'academy',
    professors: ['Prof. Michael Hakimi', 'Prof. Christine Rebet'],
    programs: [
      {
        name: 'Fine Arts',
        degree: 'Diploma in Fine Arts',
        applicationDeadlines: {
          winter: {
            start: '1 May',
            end: '30 June'
          }
        },
        professors: [
          {
            name: 'Prof. Michael Hakimi',
            email: 'michael.hakimi@adbk-nuernberg.de'
          }
        ],
        tuitionFees: 'None',
        language: 'German',
        duration: '10 semesters',
        description: 'Comprehensive fine arts education with emphasis on individual artistic development.',
        specializations: ['Painting', 'Sculpture', 'New Media']
      },
      {
        name: 'Art Education',
        degree: 'Master of Education',
        applicationDeadlines: {
          winter: {
            start: '1 May',
            end: '30 June'
          }
        },
        professors: [
          {
            name: 'Prof. Christine Rebet',
            email: 'christine.rebet@adbk-nuernberg.de'
          }
        ],
        tuitionFees: 'None',
        language: 'German',
        duration: '4 semesters',
        description: 'Program focused on art education and pedagogy.',
        specializations: ['Art Pedagogy', 'Art History']
      }
    ],
    website: 'https://www.adbk-nuernberg.de',
    description: 'One of the oldest art academies in Central Europe'
  },
  {
    id: '3',
    name: 'University of Design Offenbach',
    lat: 50.1055,
    lng: 8.7623,
    city: 'Offenbach',
    state: 'Hesse',
    type: 'university',
    professors: ['Prof. Dr. Marc Ries', 'Prof. Frank Georg Zebner'],
    programs: [
      {
        name: 'Visual Communication',
        degree: 'Bachelor of Arts',
        applicationDeadlines: {
          winter: {
            start: '1 June',
            end: '15 July'
          }
        },
        professors: [
          {
            name: 'Prof. Dr. Marc Ries',
            email: 'marc.ries@hfg-offenbach.de'
          }
        ],
        tuitionFees: 'None',
        language: 'German',
        duration: '8 semesters',
        description: 'Program covering all aspects of visual communication and design.',
        specializations: ['Graphic Design', 'Typography', 'Digital Media']
      },
      {
        name: 'Product Design',
        degree: 'Bachelor of Arts',
        applicationDeadlines: {
          winter: {
            start: '1 June',
            end: '15 July'
          }
        },
        professors: [
          {
            name: 'Prof. Frank Georg Zebner',
            email: 'frank.zebner@hfg-offenbach.de'
          }
        ],
        tuitionFees: 'None',
        language: 'German',
        duration: '8 semesters',
        description: 'Comprehensive product design program with focus on innovation and sustainability.',
        specializations: ['Industrial Design', 'Furniture Design', 'Sustainable Design']
      }
    ],
    website: 'https://www.hfg-offenbach.de',
    description: 'University focusing on design, art and media'
  },
  {
    id: '4',
    name: 'Film University Babelsberg',
    lat: 52.3906,
    lng: 13.1256,
    city: 'Potsdam',
    state: 'Brandenburg',
    type: 'university',
    professors: ['Prof. Dr. Johannes Siebler', 'Prof. Barbara Albert'],
    programs: [
      {
        name: 'Film Directing',
        degree: 'Bachelor of Arts',
        applicationDeadlines: {
          winter: {
            start: '1 May',
            end: '30 June'
          }
        },
        professors: [
          {
            name: 'Prof. Dr. Johannes Siebler',
            email: 'johannes.siebler@filmuniversitaet.de'
          }
        ],
        tuitionFees: 'None',
        language: 'German',
        duration: '8 semesters',
        description: 'Comprehensive film directing program with hands-on experience.',
        specializations: ['Feature Films', 'Documentary', 'Television']
      },
      {
        name: 'Film Production',
        degree: 'Bachelor of Arts',
        applicationDeadlines: {
          winter: {
            start: '1 May',
            end: '30 June'
          }
        },
        professors: [
          {
            name: 'Prof. Barbara Albert',
            email: 'barbara.albert@filmuniversitaet.de'
          }
        ],
        tuitionFees: 'None',
        language: 'German',
        duration: '8 semesters',
        description: 'Program focused on all aspects of film production.',
        specializations: ['Production Management', 'Creative Producing', 'International Co-production']
      }
    ],
    website: 'https://www.filmuniversitaet.de',
    description: 'Germany\'s largest and oldest film school'
  }
];

export default schools; 