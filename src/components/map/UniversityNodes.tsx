'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Billboard, Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import NodeGlowMaterial, { type NodeGlowMaterialUniforms } from './shaders/NodeGlowMaterial';
import Globe from './Globe';
import GeometricText from './GeometricText';
import { audioSystem } from '../audio/AudioSystem';

export interface University {
  id: string;
  name: string;
  location: [number, number]; // [longitude, latitude]
  type: 'University' | 'University of Applied Sciences' | 'Art Academy' | 'Private Institution' | 'Kunsthochschule';
  programType: 
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
  region: string;
  language: 'German Only' | 'English Only' | 'German & English' | 'English & German' | 'Bilingual';
  description: string;
}

// Export UNIVERSITIES data so it can be used by other components
export const UNIVERSITIES: University[] = [
    {
    id: "1",
        name: "Bauhaus-Universität Weimar",
        location: [11.329, 50.979],
        type: "University",
    programType: "Design & Architecture",
    region: "Thuringia",
    language: "German & English",
        description: "Historic institution known for art, design, and architecture, following the Bauhaus tradition."
    },
    {
    id: "2",
        name: "Burg Giebichenstein Kunsthochschule Halle",
        location: [11.963, 51.489],
        type: "Kunsthochschule",
    programType: "Art & Design",
    region: "Saxony-Anhalt",
    language: "German Only",
        description: "Renowned art and design school with a focus on practical and theoretical artistic education."
    },
    {
    id: "3",
        name: "Hochschule für Bildende Künste Braunschweig",
        location: [10.534, 52.273],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "Lower Saxony",
    language: "German Only",
        description: "Specialized art academy focusing on fine arts, visual communication, and industrial design."
    },
    {
    id: "4",
        name: "Hochschule für Bildende Künste Dresden",
        location: [13.736, 51.052],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "Saxony",
    language: "German Only",
        description: "Leading institution for contemporary art education with strong emphasis on experimental approaches."
    },
    {
    id: "5",
        name: "Hochschule für Bildende Künste Hamburg",
        location: [9.933, 53.571],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "Hamburg",
    language: "German & English",
        description: "Progressive art school known for its interdisciplinary approach and international network."
    },
    {
    id: "6",
        name: "Hochschule für Bildende Künste Saar",
        location: [7.024, 49.234],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "Saarland",
    language: "German Only",
        description: "Notable institution specializing in fine arts and artistic research in the Saarland region."
    },
    {
    id: "7",
        name: "Hochschule für Gestaltung Offenbach am Main",
        location: [8.764, 50.107],
        type: "Kunsthochschule",
    programType: "Design & Media",
    region: "Hesse",
    language: "German Only",
        description: "Innovative design school emphasizing the intersection of art, media, and technology."
    },
    {
    id: "8",
        name: "Hochschule für Gestaltung Schwäbisch Gmünd",
        location: [9.798, 48.801],
        type: "Kunsthochschule",
    programType: "Design",
    region: "Baden-Württemberg",
    language: "German Only",
        description: "Specialized in interaction design, product design, and strategic design thinking."
    },
    {
    id: "9",
        name: "Hochschule für Grafik und Buchkunst Leipzig",
        location: [12.368, 51.339],
        type: "Kunsthochschule",
    programType: "Graphic Design",
    region: "Saxony",
    language: "German Only",
        description: "Historic institution renowned for book art, graphic design, and photography."
    },
    {
    id: "10",
        name: "Hochschule für Künste Bremen",
        location: [8.826, 53.075],
        type: "Kunsthochschule",
    programType: "Multidisciplinary Arts",
    region: "Bremen",
    language: "German & English",
        description: "Multidisciplinary arts university combining music, fine arts, and digital media."
    },
    {
    id: "11",
        name: "Hochschule für Künste im Sozialen Ottersberg",
        location: [9.153, 53.130],
        type: "Kunsthochschule",
    programType: "Art Therapy",
    region: "Lower Saxony",
    language: "German Only",
        description: "Unique institution focusing on art therapy and social artistic practices."
    },
    {
    id: "12",
        name: "Kunstakademie Düsseldorf",
        location: [6.777, 51.233],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "North Rhine-Westphalia",
    language: "German & English",
        description: "Prestigious academy known for producing influential contemporary artists."
    },
    {
    id: "13",
        name: "Kunstakademie Münster",
        location: [7.626, 51.962],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "North Rhine-Westphalia",
    language: "German Only",
        description: "Forward-thinking institution specializing in fine arts and artistic research."
    },
    {
    id: "14",
        name: "Kunsthochschule Berlin-Weißensee",
        location: [13.463, 52.543],
        type: "Kunsthochschule",
    programType: "Art & Design",
    region: "Berlin",
    language: "German & English",
        description: "Berlin-based art school known for its innovative approach to design and fine arts."
    },
    {
    id: "15",
        name: "Kunsthochschule für Medien Köln",
        location: [6.959, 50.935],
        type: "Kunsthochschule",
    programType: "Media Arts",
    region: "North Rhine-Westphalia",
    language: "German & English",
        description: "Leading media arts school focusing on audiovisual arts and digital culture."
    },
    {
    id: "16",
        name: "Kunsthochschule Kassel",
        location: [9.492, 51.318],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "Hesse",
    language: "German Only",
        description: "Distinguished institution known for its connection to documenta art exhibition."
    },
    {
    id: "17",
        name: "Kunsthochschule Mainz",
        location: [8.274, 50.001],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "Rhineland-Palatinate",
    language: "German Only",
        description: "Progressive art school emphasizing contemporary artistic practices and theory."
    },
    {
    id: "18",
        name: "Muthesius Kunsthochschule Kiel",
        location: [10.122, 54.323],
        type: "Kunsthochschule",
    programType: "Art & Design",
    region: "Schleswig-Holstein",
    language: "German Only",
        description: "Specialized in fine arts, spatial strategies, and design innovation."
    },
    {
    id: "19",
        name: "Staatliche Akademie der Bildenden Künste Karlsruhe",
        location: [8.400, 49.014],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "Baden-Württemberg",
    language: "German Only",
        description: "Historic academy with strong traditions in painting and art theory."
    },
    {
    id: "20",
        name: "Staatliche Akademie der Bildenden Künste Stuttgart",
        location: [9.169, 48.789],
        type: "Kunsthochschule",
    programType: "Fine Arts & Conservation",
    region: "Baden-Württemberg",
    language: "German & English",
        description: "Comprehensive art academy offering programs from fine arts to conservation."
    },
    {
    id: "21",
        name: "Staatliche Hochschule für Bildende Künste – Städelschule Frankfurt",
        location: [8.684, 50.115],
        type: "Kunsthochschule",
    programType: "Contemporary Art",
    region: "Hesse",
    language: "German & English",
        description: "Elite institution known for its influential contemporary art program."
    },
    {
    id: "22",
        name: "Universität der Künste Berlin",
        location: [13.324, 52.507],
        type: "University",
    programType: "Multidisciplinary Arts",
    region: "Berlin",
    language: "German & English",
        description: "One of Europe's largest arts universities, covering all artistic disciplines."
    },
    {
    id: "23",
        name: "Bard College Berlin",
        location: [13.465, 52.557],
        type: "University",
    programType: "Liberal Arts",
    region: "Berlin",
    language: "English Only",
        description: "Liberal arts university offering interdisciplinary programs with international focus."
    },
    {
    id: "24",
        name: "Folkwang Universität der Künste",
        location: [7.013, 51.443],
        type: "University",
    programType: "Performing Arts",
    region: "North Rhine-Westphalia",
    language: "German & English",
        description: "Comprehensive arts university known for music, theater, dance, and design."
    },
    {
    id: "25",
        name: "Alanus University of Arts and Social Sciences",
        location: [7.118, 50.737],
        type: "University",
    programType: "Arts & Social Sciences",
    region: "North Rhine-Westphalia",
    language: "German & English",
        description: "Private university combining artistic education with social sciences and pedagogy."
    },
    {
    id: "26",
        name: "Staatliche Akademie der Bildenden Künste München",
        location: [11.576, 48.149],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "Bavaria",
    language: "German Only",
        description: "Prestigious Munich-based academy with rich artistic heritage."
    },
    {
    id: "27",
        name: "Akademie der Bildenden Künste Nürnberg",
        location: [11.077, 49.452],
        type: "Kunsthochschule",
    programType: "Fine Arts",
    region: "Bavaria",
    language: "German Only",
        description: "Historic institution focusing on fine arts and artistic research."
    },
    {
    id: "28",
        name: "Technische Universität Berlin",
        location: [13.326, 52.512],
        type: "University",
    programType: "Engineering & Technology",
    region: "Berlin",
    language: "German & English",
        description: "Leading technical university renowned for engineering and technology research."
    },
    {
    id: "29",
        name: "Hochschule für Bildende Künste Essen",
        location: [7.014, 51.451],
        type: "Kunsthochschule",
    programType: "Contemporary Art",
    region: "North Rhine-Westphalia",
    language: "German Only",
        description: "Notable institution for contemporary art and media practices."
    },
    {
    id: "30",
        name: "Staatliche Hochschule für Gestaltung Karlsruhe",
        location: [8.400, 49.009],
        type: "Kunsthochschule",
    programType: "Media Arts",
    region: "Baden-Württemberg",
    language: "German & English",
        description: "Innovative design school emphasizing theory and practice in media arts."
    },
    {
    id: "31",
        name: "Academy of Visual Arts Frankfurt",
        location: [8.683, 50.116],
        type: "Kunsthochschule",
    programType: "Visual Arts",
    region: "Hesse",
    language: "German & English",
        description: "Contemporary art institution known for its experimental approach."
    },
    {
    id: "32",
        name: "Fachhochschule Potsdam",
        location: [13.064, 52.413],
        type: "University",
    programType: "Design & Architecture",
    region: "Brandenburg",
    language: "German Only",
        description: "Applied sciences university with strong design and architecture programs."
    },
    {
    id: "33",
        name: "Hochschule Darmstadt",
        location: [8.651, 49.867],
        type: "University",
    programType: "Technology & Media",
    region: "Hesse",
    language: "German & English",
        description: "University of applied sciences known for technology and media programs."
    },
    {
    id: "34",
        name: "Hochschule Rhein-Waal",
        location: [6.542, 51.831],
        type: "University",
    programType: "Technology & Sciences",
    region: "North Rhine-Westphalia",
    language: "English & German",
        description: "International university focusing on technology and natural sciences."
    },
    {
    id: "35",
        name: "Technische Universität Chemnitz",
        location: [12.927, 50.841],
        type: "University",
    programType: "Engineering",
    region: "Saxony",
    language: "German & English",
        description: "Technical university specializing in engineering and natural sciences."
    },
    {
    id: "36",
        name: "Hochschule Anhalt",
        location: [12.166, 51.753],
        type: "University",
    programType: "Design & Engineering",
    region: "Saxony-Anhalt",
    language: "German & English",
        description: "University of applied sciences with focus on design and engineering."
    },
    {
    id: "37",
        name: "Universität Trier",
        location: [6.687, 49.746],
        type: "University",
    programType: "Humanities",
    region: "Rhineland-Palatinate",
    language: "German Only",
        description: "Historic university known for humanities and social sciences."
    },
    {
    id: "38",
        name: "Universität Siegen",
        location: [8.023, 50.911],
        type: "University",
    programType: "Engineering & Social Sciences",
    region: "North Rhine-Westphalia",
    language: "German & English",
        description: "Research university with strength in engineering and social sciences."
    },
    {
    id: "39",
        name: "Technische Hochschule Ingolstadt",
        location: [11.425, 48.766],
        type: "University",
    programType: "Technology & Automotive",
    region: "Bavaria",
    language: "German & English",
        description: "Technical university specializing in automotive and technology innovation."
    },
    {
    id: "40",
        name: "Hochschule Fulda",
        location: [9.675, 50.565],
        type: "University",
    programType: "Social & Health Sciences",
    region: "Hesse",
    language: "German & English",
        description: "University of applied sciences focusing on social and health sciences."
  }
];

// Enhanced color palette with Tim Rodenbroeker's style
const INSTITUTION_COLORS = {
  'University': ['#ffffff', '#2196f3'],
  'University of Applied Sciences': ['#ffffff', '#64ffda'],
  'Art Academy': ['#ffffff', '#ff6b8b'],
  'Private Institution': ['#ffffff', '#bb86fc'],
  'Kunsthochschule': ['#ffffff', '#ff4081']
} as const;

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function latLngToVector3(lat: number, lng: number, radius: number, id: string): THREE.Vector3 {
  // Use university ID as a stable seed for randomization
  const seed = parseInt(id, 10) || 0;
  
  // Generate uniform points on a sphere using Fibonacci spiral
  const golden_ratio = (1 + Math.sqrt(5)) / 2;
  const i = seed % UNIVERSITIES.length; // Use ID for stable indexing
  
  // Calculate position using Fibonacci spiral
  const theta = 2 * Math.PI * i / golden_ratio;
  const phi = Math.acos(1 - 2 * (i + 0.5) / UNIVERSITIES.length);

  // Add controlled but stable randomization
  const randTheta = theta + (seededRandom(seed) - 0.5) * Math.PI / 2;
  const randPhi = phi + (seededRandom(seed + 1) - 0.5) * Math.PI / 4;

  // Convert to Cartesian coordinates
  const x = -(radius * Math.sin(randPhi) * Math.cos(randTheta));
  const z = radius * Math.sin(randPhi) * Math.sin(randTheta);
  const y = radius * Math.cos(randPhi);

  return new THREE.Vector3(x, y, z);
}

interface UniversityPosition {
    position: THREE.Vector3;
    id: string;
}

interface UniversityNodesProps {
    radius: number;
    filteredUniversities: University[];
    onHover?: (universityName: string | null) => void;
}

function UniversityNode({ 
  position, 
  university, 
  material, 
  isFiltered, 
  isHovered,
  onHover 
}: {
  position: THREE.Vector3;
  university: University;
  material: THREE.ShaderMaterial;
  isFiltered: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}) {
  const nodeRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);
  const currentScale = useRef(1);
  const targetScale = useRef(1);

  useFrame((state, delta) => {
    time.current += delta;

    if (nodeRef.current) {
      // Enhanced floating movement
      const floatOffset = Math.sin(time.current + parseInt(university.id) * 0.5) * 0.08;
      nodeRef.current.position.y = position.y + floatOffset;

      // Audio-reactive scale with larger base size
      const audioIntensity = audioSystem.getAudioIntensity();
      const bands = audioSystem.getFrequencyBands();
      
      // Calculate target scale based on state with increased base size
      targetScale.current = 1.5; // Increased base size
      if (isHovered) targetScale.current *= 1.6;
      if (isFiltered) targetScale.current *= 0.9;
      targetScale.current *= (1 + audioIntensity * 0.3);
      
      // Enhanced smooth scale transition
      const springStrength = 0.15;
      const dampening = 0.8;
      currentScale.current += (targetScale.current - currentScale.current) * springStrength;
      currentScale.current *= dampening;
      
      nodeRef.current.scale.setScalar(currentScale.current);

      // Update material uniforms with enhanced glow
      if (material.uniforms) {
        material.uniforms.time.value = time.current;
        material.uniforms.isHovered.value = isHovered ? 1 : 0;
        material.uniforms.audioIntensity.value = audioIntensity * 1.5; // Enhanced audio reactivity
        material.uniforms.audioHighBand.value = bands.high * 1.2;
        material.uniforms.audioMidBand.value = bands.mid * 1.2;
        material.uniforms.audioLowBand.value = bands.low * 1.2;
      }
    }
  });

  return (
    <group>
      <mesh
        ref={nodeRef}
        position={position}
        onClick={(e) => {
          e.stopPropagation();
          onHover(!isHovered);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(false);
        }}
      >
        <sphereGeometry args={[0.18, 32, 32]} />
        <primitive object={material} attach="material" />
      </mesh>

      {isHovered && (
        <Billboard
          follow={true}
          position={position.clone().add(new THREE.Vector3(0, 0.5, 0))}
        >
          <group scale={isHovered ? 1.4 : 1}>
            <GeometricText
              fontSize={0.2}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              isHovered={isHovered}
              onHover={(hovered) => onHover(hovered)}
              universityData={university}
            >
              {university.name}
            </GeometricText>
          </group>
        </Billboard>
      )}
    </group>
  );
}

export default function UniversityNodes({ radius, filteredUniversities = UNIVERSITIES, onHover }: UniversityNodesProps) {
  const [hoveredUniversity, setHoveredUniversity] = useState<University | null>(null);
  const [visibleNodes, setVisibleNodes] = useState<University[]>([]);
  const time = useRef(0);

  // Calculate node positions
  const nodePositions = useMemo(() => {
    try {
      return filteredUniversities.reduce((acc, uni) => {
        const position = latLngToVector3(uni.location[1], uni.location[0], radius, uni.id);
        acc[uni.id] = position;
        return acc;
      }, {} as Record<string, THREE.Vector3>);
    } catch (error) {
      console.error('Error calculating node positions:', error);
      return {};
    }
  }, [radius, filteredUniversities]);

  // Create materials for each institution type
  const materials = useMemo(() => {
    return Object.entries(INSTITUTION_COLORS).map(([type, [baseColor, glowColor]]) => {
      const material = new NodeGlowMaterial();
      material.baseColor = new THREE.Color(baseColor);
      material.glowColor = new THREE.Color(glowColor);
      return { type, material };
    });
  }, []);

  // Update materials with audio reactivity
  useFrame((state, delta) => {
    time.current += delta;
    
    materials.forEach(({ material }) => {
      material.time = time.current;
      
      const audioIntensity = audioSystem.getAudioIntensity();
      const bands = audioSystem.getFrequencyBands();
      
      material.audioIntensity = audioIntensity;
      material.audioHighBand = bands.high;
      material.audioMidBand = bands.mid;
      material.audioLowBand = bands.low;
    });
  });

  return (
    <group>
      {materials.map(({ type, material }) => (
        <group key={type}>
          {filteredUniversities
            .filter(uni => uni.type === type)
            .map(university => {
              const position = nodePositions[university.id];
              if (!position) return null;

              return (
                <UniversityNode
                  key={university.id}
                  position={position}
                  university={university}
                  material={material}
                  isFiltered={filteredUniversities.includes(university)}
                  isHovered={hoveredUniversity?.id === university.id}
                  onHover={(hovered) => {
                    setHoveredUniversity(hovered ? university : null);
                    onHover?.(hovered ? university.name : null);
                  }}
                />
              );
            })}
        </group>
      ))}
    </group>
  );
}