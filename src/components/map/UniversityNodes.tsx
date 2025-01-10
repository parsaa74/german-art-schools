'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Text, Billboard, Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { animated, useSpring } from '@react-spring/three';

interface University {
  name: string;
  location: [number, number]; // [longitude, latitude]
  type: 'University' | 'Hochschule' | 'Kunsthochschule' | 'Akademie';
  description: string;
}

const UNIVERSITIES: University[] = [
    {
        name: "Bauhaus-Universität Weimar",
        location: [11.329, 50.979],
        type: "University",
        description: "Historic institution known for art, design, and architecture, following the Bauhaus tradition."
    },
    {
        name: "Burg Giebichenstein Kunsthochschule Halle",
        location: [11.963, 51.489],
        type: "Kunsthochschule",
        description: "Renowned art and design school with a focus on practical and theoretical artistic education."
    },
    {
        name: "Hochschule für Bildende Künste Braunschweig",
        location: [10.534, 52.273],
        type: "Kunsthochschule",
        description: "Specialized art academy focusing on fine arts, visual communication, and industrial design."
    },
    {
        name: "Hochschule für Bildende Künste Dresden",
        location: [13.736, 51.052],
        type: "Kunsthochschule",
        description: "Leading institution for contemporary art education with strong emphasis on experimental approaches."
    },
    {
        name: "Hochschule für Bildende Künste Hamburg",
        location: [9.933, 53.571],
        type: "Kunsthochschule",
        description: "Progressive art school known for its interdisciplinary approach and international network."
    },
    {
        name: "Hochschule für Bildende Künste Saar",
        location: [7.024, 49.234],
        type: "Kunsthochschule",
        description: "Notable institution specializing in fine arts and artistic research in the Saarland region."
    },
    {
        name: "Hochschule für Gestaltung Offenbach am Main",
        location: [8.764, 50.107],
        type: "Kunsthochschule",
        description: "Innovative design school emphasizing the intersection of art, media, and technology."
    },
    {
        name: "Hochschule für Gestaltung Schwäbisch Gmünd",
        location: [9.798, 48.801],
        type: "Kunsthochschule",
        description: "Specialized in interaction design, product design, and strategic design thinking."
    },
    {
        name: "Hochschule für Grafik und Buchkunst Leipzig",
        location: [12.368, 51.339],
        type: "Kunsthochschule",
        description: "Historic institution renowned for book art, graphic design, and photography."
    },
    {
        name: "Hochschule für Künste Bremen",
        location: [8.826, 53.075],
        type: "Kunsthochschule",
        description: "Multidisciplinary arts university combining music, fine arts, and digital media."
    },
    {
        name: "Hochschule für Künste im Sozialen Ottersberg",
        location: [9.153, 53.130],
        type: "Kunsthochschule",
        description: "Unique institution focusing on art therapy and social artistic practices."
    },
    {
        name: "Kunstakademie Düsseldorf",
        location: [6.777, 51.233],
        type: "Kunsthochschule",
        description: "Prestigious academy known for producing influential contemporary artists."
    },
    {
        name: "Kunstakademie Münster",
        location: [7.626, 51.962],
        type: "Kunsthochschule",
        description: "Forward-thinking institution specializing in fine arts and artistic research."
    },
    {
        name: "Kunsthochschule Berlin-Weißensee",
        location: [13.463, 52.543],
        type: "Kunsthochschule",
        description: "Berlin-based art school known for its innovative approach to design and fine arts."
    },
    {
        name: "Kunsthochschule für Medien Köln",
        location: [6.959, 50.935],
        type: "Kunsthochschule",
        description: "Leading media arts school focusing on audiovisual arts and digital culture."
    },
    {
        name: "Kunsthochschule Kassel",
        location: [9.492, 51.318],
        type: "Kunsthochschule",
        description: "Distinguished institution known for its connection to documenta art exhibition."
    },
    {
        name: "Kunsthochschule Mainz",
        location: [8.274, 50.001],
        type: "Kunsthochschule",
        description: "Progressive art school emphasizing contemporary artistic practices and theory."
    },
    {
        name: "Muthesius Kunsthochschule Kiel",
        location: [10.122, 54.323],
        type: "Kunsthochschule",
        description: "Specialized in fine arts, spatial strategies, and design innovation."
    },
    {
        name: "Staatliche Akademie der Bildenden Künste Karlsruhe",
        location: [8.400, 49.014],
        type: "Kunsthochschule",
        description: "Historic academy with strong traditions in painting and art theory."
    },
    {
        name: "Staatliche Akademie der Bildenden Künste Stuttgart",
        location: [9.169, 48.789],
        type: "Kunsthochschule",
        description: "Comprehensive art academy offering programs from fine arts to conservation."
    },
    {
        name: "Staatliche Hochschule für Bildende Künste – Städelschule Frankfurt",
        location: [8.684, 50.115],
        type: "Kunsthochschule",
        description: "Elite institution known for its influential contemporary art program."
    },
    {
        name: "Universität der Künste Berlin",
        location: [13.324, 52.507],
        type: "University",
        description: "One of Europe's largest arts universities, covering all artistic disciplines."
    },
    {
        name: "Bard College Berlin",
        location: [13.465, 52.557],
        type: "University",
        description: "Liberal arts university offering interdisciplinary programs with international focus."
    },
    {
        name: "Folkwang Universität der Künste",
        location: [7.013, 51.443],
        type: "University",
        description: "Comprehensive arts university known for music, theater, dance, and design."
    },
    {
        name: "Alanus University of Arts and Social Sciences",
        location: [7.118, 50.737],
        type: "University",
        description: "Private university combining artistic education with social sciences and pedagogy."
    },
    {
        name: "Staatliche Akademie der Bildenden Künste München",
        location: [11.576, 48.149],
        type: "Kunsthochschule",
        description: "Prestigious Munich-based academy with rich artistic heritage."
    },
    {
        name: "Akademie der Bildenden Künste Nürnberg",
        location: [11.077, 49.452],
        type: "Kunsthochschule",
        description: "Historic institution focusing on fine arts and artistic research."
    },
    {
        name: "Technische Universität Berlin",
        location: [13.326, 52.512],
        type: "University",
        description: "Leading technical university renowned for engineering and technology research."
    },
    {
        name: "Hochschule für Bildende Künste Essen",
        location: [7.014, 51.451],
        type: "Kunsthochschule",
        description: "Notable institution for contemporary art and media practices."
    },
    {
        name: "Staatliche Hochschule für Gestaltung Karlsruhe",
        location: [8.400, 49.009],
        type: "Kunsthochschule",
        description: "Innovative design school emphasizing theory and practice in media arts."
    },
    {
        name: "Academy of Visual Arts Frankfurt",
        location: [8.683, 50.116],
        type: "Kunsthochschule",
        description: "Contemporary art institution known for its experimental approach."
    },
    {
        name: "Fachhochschule Potsdam",
        location: [13.064, 52.413],
        type: "University",
        description: "Applied sciences university with strong design and architecture programs."
    },
    {
        name: "Hochschule Darmstadt",
        location: [8.651, 49.867],
        type: "University",
        description: "University of applied sciences known for technology and media programs."
    },
    {
        name: "Hochschule Rhein-Waal",
        location: [6.542, 51.831],
        type: "University",
        description: "International university focusing on technology and natural sciences."
    },
    {
        name: "Technische Universität Chemnitz",
        location: [12.927, 50.841],
        type: "University",
        description: "Technical university specializing in engineering and natural sciences."
    },
    {
        name: "Hochschule Anhalt",
        location: [12.166, 51.753],
        type: "University",
        description: "University of applied sciences with focus on design and engineering."
    },
    {
        name: "Universität Trier",
        location: [6.687, 49.746],
        type: "University",
        description: "Historic university known for humanities and social sciences."
    },
    {
        name: "Universität Siegen",
        location: [8.023, 50.911],
        type: "University",
        description: "Research university with strength in engineering and social sciences."
    },
    {
        name: "Technische Hochschule Ingolstadt",
        location: [11.425, 48.766],
        type: "University",
        description: "Technical university specializing in automotive and technology innovation."
    },
    {
        name: "Hochschule Fulda",
        location: [9.675, 50.565],
        type: "University",
        description: "University of applied sciences focusing on social and health sciences."
    },
    {
        name: "Universität Passau",
        location: [13.452, 48.567],
        type: "University",
        description: "Known for international studies and computer science programs."
    }
];

interface InfoBox {
  name: string;
  position: THREE.Vector3;
  type: string;
  description: string;
}

interface UniversityNodesProps {
  radius: number;
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  // Map German coordinates to global coordinates
  const globalLat = ((lat - 47) / (55 - 47)) * 180 - 90; // Map German latitudes (47-55) to global (-90 to 90)
  const globalLng = ((lng - 6) / (15 - 6)) * 360 - 180;  // Map German longitudes (6-15) to global (-180 to 180)

  // Add randomization for better distribution
  const randomLat = globalLat + (Math.random() - 0.5) * 120; // Spread across ±60 degrees from mapped position
  const randomLng = globalLng + (Math.random() - 0.5) * 240; // Spread across ±120 degrees from mapped position

  // Convert to spherical coordinates
  const phi = (90 - randomLat) * (Math.PI / 180);
  const theta = (randomLng + 180) * (Math.PI / 180);

  // Convert to Cartesian coordinates
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

export default function UniversityNodes({ radius }: UniversityNodesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<InfoBox | null>(null);
  const [hoverUniversity, setHoverUniversity] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Create materials for different university types
  const materials = useMemo(() => ({
    University: new THREE.MeshStandardMaterial({ 
      color: '#00ffd5',
      emissive: '#00ffd5',
      emissiveIntensity: 2,
      metalness: 0.5,
      roughness: 0.2,
    }),
    Kunsthochschule: new THREE.MeshStandardMaterial({ 
      color: '#ff00ff',
      emissive: '#ff00ff',
      emissiveIntensity: 2,
      metalness: 0.5,
      roughness: 0.2,
    }),
    Hochschule: new THREE.MeshStandardMaterial({ 
      color: '#ffff00',
      emissive: '#ffff00',
      emissiveIntensity: 2,
      metalness: 0.5,
      roughness: 0.2,
    }),
    Akademie: new THREE.MeshStandardMaterial({ 
      color: '#00ff00',
      emissive: '#00ff00',
      emissiveIntensity: 2,
      metalness: 0.5,
      roughness: 0.2,
    }),
  }), []);

  // Create instance data
  const { instanceData, nodePositions } = useMemo(() => {
    const instanceData = UNIVERSITIES.map(university => {
      const position = latLngToVector3(university.location[1], university.location[0], radius);
      return {
        position,
        university,
      };
    });

    const nodePositions = new Map(
      instanceData.map(({ university, position }) => [university.name, position])
    );

    return { instanceData, nodePositions };
  }, [radius]);

  // Animation for info box
  const infoBoxSpring = useSpring({
    scale: selectedUniversity ? 1 : 0,
    opacity: selectedUniversity ? 1 : 0,
    config: { tension: 280, friction: 60 },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <group ref={groupRef}>
      {Object.entries(materials).map(([type, material]) => (
        <Instances key={type} limit={UNIVERSITIES.length} range={UNIVERSITIES.length}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <primitive object={material} attach="material" />
          
          {instanceData
            .filter(({ university }) => university.type === type)
            .map(({ position, university }) => (
              <Instance
                key={university.name}
                position={position}
                onClick={() => setSelectedUniversity({
                  name: university.name,
                  position: position.clone().multiplyScalar(1.1),
                  type: university.type,
                  description: university.description,
                })}
                onPointerOver={() => setHoverUniversity(university.name)}
                onPointerOut={() => setHoverUniversity(null)}
              />
            ))}
        </Instances>
      ))}

      {/* Render info box */}
      {selectedUniversity && (
        <animated.group
          position={selectedUniversity.position}
          scale={infoBoxSpring.scale}
        >
          <Billboard>
            <mesh position={[0, 0, -0.05]}>
              <boxGeometry args={[2.2, 1.2, 0.1]} />
              <shaderMaterial
                uniforms={{
                  color: { value: new THREE.Color('#000000') },
                  opacity: { value: 0.8 },
                  radius: { value: 0.1 },
                }}
                vertexShader={`
                  varying vec2 vUv;
                  varying vec3 vPosition;
                  void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                  }
                `}
                fragmentShader={`
                  uniform vec3 color;
                  uniform float opacity;
                  uniform float radius;
                  varying vec2 vUv;
                  varying vec3 vPosition;

                  float roundedBoxSDF(vec2 centerPosition, vec2 size, float radius) {
                    return length(max(abs(centerPosition) - size + radius, 0.0)) - radius;
                  }

                  void main() {
                    vec2 centerPosition = vUv * 2.0 - 1.0;
                    float distance = roundedBoxSDF(centerPosition, vec2(1.0, 0.5), radius);
                    float smoothedAlpha = 1.0 - smoothstep(-0.01, 0.01, distance);
                    gl_FragColor = vec4(color, smoothedAlpha * opacity);
                  }
                `}
                transparent
                depthWrite={false}
              />
            </mesh>
            
            <Text
              position={[0, 0.3, 0]}
              fontSize={0.12}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.004}
              outlineColor="#000000"
              outlineOpacity={0.8}
              maxWidth={2}
            >
              {selectedUniversity.name}
            </Text>
            
            <Text
              position={[0, 0.1, 0]}
              fontSize={0.09}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.003}
              outlineColor="#000000"
              outlineOpacity={0.8}
            >
              {selectedUniversity.type}
            </Text>
            
            <Text
              position={[0, -0.2, 0]}
              fontSize={0.07}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.002}
              outlineColor="#000000"
              outlineOpacity={0.8}
              maxWidth={1.8}
            >
              {selectedUniversity.description}
            </Text>
          </Billboard>
        </animated.group>
      )}
    </group>
  );
}