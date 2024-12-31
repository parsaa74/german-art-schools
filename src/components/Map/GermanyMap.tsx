import React, { useEffect, useRef, useMemo, useState, Suspense } from 'react';
import { Line, Sphere, Text, Html, OrbitControls } from '@react-three/drei';
import { useThree, useLoader } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { geoGraticule10, geoOrthographic } from 'd3-geo';
import gsap from 'gsap';
import { ColorFlowMaterial } from './effects/ColorFlow';
import { SchoolParticle } from './effects/SchoolParticles';
import { ConnectionLines } from './effects/ConnectionLines';
import { schools } from '@/data/schools';
import { latLongToVector3 } from '@/lib/utils';

// Define texture URLs
const EARTH_TEXTURE_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';
const EARTH_NORMAL_MAP_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg';
const EARTH_SPECULAR_MAP_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg';

interface GermanyMapProps {
  radius?: number;
  color?: string;
  width?: number;
}

interface StateDetails {
  name: string;
  capital: string;
  population: number;
  area: number;
  description: string;
}

// Define state colors for better visualization
const STATE_COLORS = {
  'Baden-Württemberg': '#e6c200',
  'Bavaria': '#4a90e2',
  'Berlin': '#ff4444',
  'Brandenburg': '#ff8c42',
  'Bremen': '#00bcd4',
  'Hamburg': '#2196f3',
  'Hesse': '#9c27b0',
  'Lower Saxony': '#4caf50',
  'Mecklenburg-Vorpommern': '#795548',
  'North Rhine-Westphalia': '#50e3c2',
  'Rhineland-Palatinate': '#ff5722',
  'Saarland': '#607d8b',
  'Saxony': '#673ab7',
  'Saxony-Anhalt': '#3f51b5',
  'Schleswig-Holstein': '#009688',
  'Thuringia': '#8bc34a'
};

const MAJOR_CITIES = [
  { name: 'Berlin', coordinates: [52.5200, 13.4050], population: 3669495 },
  { name: 'Hamburg', coordinates: [53.5511, 9.9937], population: 1841179 },
  { name: 'Munich', coordinates: [48.1351, 11.5820], population: 1471508 },
  { name: 'Cologne', coordinates: [50.9375, 6.9603], population: 1085664 },
  { name: 'Frankfurt', coordinates: [50.1109, 8.6821], population: 753056 },
  { name: 'Stuttgart', coordinates: [48.7758, 9.1829], population: 634830 },
  { name: 'Düsseldorf', coordinates: [51.2277, 6.7735], population: 619294 },
  { name: 'Leipzig', coordinates: [51.3397, 12.3731], population: 587857 },
  { name: 'Dresden', coordinates: [51.0504, 13.7373], population: 556780 }
];

const MAJOR_RIVERS = [
  {
    name: 'Rhine',
    coordinates: [
      [47.6667, 8.6167], // Lake Constance
      [49.0000, 8.3833], // Karlsruhe
      [50.0667, 8.6167], // Frankfurt
      [51.2167, 6.7667], // Düsseldorf
      [51.9667, 6.6833]  // Netherlands border
    ]
  },
  {
    name: 'Elbe',
    coordinates: [
      [50.7833, 14.2333], // Czech border
      [51.0500, 13.7333], // Dresden
      [51.8833, 12.4333], // Dessau
      [53.5500, 9.9833],  // Hamburg
      [53.8833, 8.7000]   // North Sea
    ]
  },
  {
    name: 'Danube',
    coordinates: [
      [48.0167, 9.5000],  // Source
      [48.5833, 10.5000], // Ulm
      [48.7667, 11.4333], // Ingolstadt
      [48.9333, 12.1167], // Regensburg
      [48.5667, 13.4333]  // Passau
    ]
  }
];

// Add state details
const STATE_DETAILS: Record<string, StateDetails> = {
  'Bavaria': {
    name: 'Bavaria',
    capital: 'Munich',
    population: 13124737,
    area: 70550,
    description: 'Largest German state by area, known for Oktoberfest and Alps'
  },
  'Berlin': {
    name: 'Berlin',
    capital: 'Berlin',
    population: 3669495,
    area: 891,
    description: 'German capital and cultural center'
  },
  // Add details for other states...
};

interface Feature {
  properties: {
    name: string;
    center: [number, number];
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface Coordinate {
  lat: number;
  lng: number;
}

interface BillboardTextProps {
  text: string;
  color: string;
  fontSize: number;
  outlineWidth: number;
  outlineColor: string;
}

const BillboardText: React.FC<BillboardTextProps> = ({ 
  text, 
  color, 
  fontSize, 
  outlineWidth, 
  outlineColor 
}) => {
  return (
    <Html
      center
      style={{
        color: color,
        fontSize: `${fontSize}em`,
        fontWeight: 'bold',
        textShadow: `${outlineWidth}px ${outlineWidth}px ${outlineColor}`,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        userSelect: 'none',
        transform: 'scale(0.5)',
      }}
    >
      {text}
    </Html>
  );
};

const AnimatedState: React.FC<{
  feature: Feature;
  color: string;
  onClick: () => void;
  isHovered: boolean;
  onHover: (value: boolean) => void;
}> = ({ feature, color, onClick, isHovered, onHover }) => {
  const { scale } = useSpring({
    scale: isHovered ? 1.1 : 1,
    config: { tension: 170, friction: 26 }
  });

  const points = useMemo(() => {
    const coordinates = feature.geometry.type === 'Polygon' 
      ? [feature.geometry.coordinates] 
      : feature.geometry.coordinates;

    return coordinates.flatMap(polygon =>
      polygon.flatMap(ring =>
        (ring as [number, number][]).map(([lng, lat]) => latLongToVector3(lat, lng, 1, 0.001))
      )
    );
  }, [feature]);

  return (
    <animated.group scale={scale}>
      <Line
        points={points}
        color={color}
        lineWidth={2}
        transparent
        opacity={isHovered ? 1 : 0.7}
        onClick={onClick}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      />
    </animated.group>
  );
};

const Earth: React.FC<{ radius: number }> = ({ radius }) => {
  const earthRef = useRef<THREE.Group>(null);
  const [earthTexture, normalMap, specularMap] = useLoader(THREE.TextureLoader, [
    EARTH_TEXTURE_URL,
    EARTH_NORMAL_MAP_URL,
    EARTH_SPECULAR_MAP_URL
  ]);

  // Correct Germany's center coordinates
  const GERMANY_CENTER = {
    lat: 51.1657,
    lng: 10.4515
  };

  useEffect(() => {
    if (earthRef.current) {
      // Position Germany at the center of view
      earthRef.current.rotation.y = -(GERMANY_CENTER.lng * Math.PI / 180);
      earthRef.current.rotation.x = (GERMANY_CENTER.lat * Math.PI / 180);
    }
  }, []);

  return (
    <group ref={earthRef}>
      <Sphere args={[radius, 64, 64]}>
        <meshPhongMaterial
          map={earthTexture}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={5}
          specular={new THREE.Color('#333333')}
        />
      </Sphere>
    </group>
  );
};

const GermanyMap: React.FC<GermanyMapProps> = ({
  radius = 1,
  color = '#ffffff',
  width = 0.5,
}) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const borderRef = useRef<THREE.Group>(null);
  const graticuleRef = useRef<THREE.Group>(null);
  const { camera, size } = useThree();

  // Create graticules (latitude/longitude lines)
  const graticulePoints = useMemo(() => {
    return geoGraticule10().coordinates.map(coords =>
      coords.map(([lon, lat]) => latLongToVector3(lat, lon))
    );
  }, [radius]);

  const getStateCentroid = (coordinates: number[][][]): Coordinate => {
    try {
      let totalLat = 0;
      let totalLng = 0;
      let pointCount = 0;

      // Safely handle nested coordinate arrays
      coordinates.forEach(polygon => {
        if (Array.isArray(polygon)) {
          polygon.forEach(ring => {
            if (Array.isArray(ring)) {
              ring.forEach(coord => {
                if (Array.isArray(coord) && coord.length >= 2) {
                  const [lng, lat] = coord;
                  if (typeof lat === 'number' && typeof lng === 'number') {
                    totalLat += lat;
                    totalLng += lng;
                    pointCount++;
                  }
                }
              });
            }
          });
        }
      });

      if (pointCount === 0) {
        // Default to Germany's center if no valid coordinates
        return {
          lat: 51.1657,
          lng: 10.4515
        };
      }

      return {
        lat: totalLat / pointCount,
        lng: totalLng / pointCount
      };
    } catch (error) {
      console.error('Error calculating state centroid:', error);
      // Return Germany's center as fallback
      return {
        lat: 51.1657,
        lng: 10.4515
      };
    }
  };

  const onStateClick = (stateName: string, coordinates: number[][][]) => {
    setSelectedState(stateName);
    setShowDetails(true);

    try {
      // Calculate centroid for camera focus
      const { lat, lng } = getStateCentroid(coordinates);
      const targetPosition = latLongToVector3(lat, lng, 0.1);

      // Animate camera to focus on state
      gsap.to(camera.position, {
        x: targetPosition.x * 1.5,
        y: targetPosition.y * 1.5,
        z: targetPosition.z * 1.5,
        duration: 1,
        ease: 'power2.inOut',
        onComplete: () => {
          // Additional animations or callbacks
        }
      });
    } catch (error) {
      console.error('Error handling state click:', error);
    }
  };

  const projection = useMemo(() => {
    return geoOrthographic()
      .scale(radius * 100)
      .translate([size.width / 2, size.height / 2])
      .clipAngle(90);
  }, [radius, size]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/4_niedrig.geo.json')
      .then(response => response.json())
      .then(germanyData => {
        const processedFeatures = germanyData.features.map((feature: any) => {
          try {
            const coordinates = feature.geometry.type === 'Polygon'
              ? [feature.geometry.coordinates]
              : feature.geometry.coordinates;

            const center = getStateCentroid(coordinates);
            
            return {
              ...feature,
              properties: {
                ...feature.properties,
                center: [center.lng, center.lat] as [number, number]
              }
            };
          } catch (error) {
            console.error('Error processing feature:', error);
            return feature;
          }
        });
        setFeatures(processedFeatures);
      })
      .catch(error => {
        console.error('Error fetching GeoJSON:', error);
      });
  }, []);

  // Ensure textures are loaded before rendering
  const [earthTexture, normalMap, specularMap] = useLoader(THREE.TextureLoader, [
    EARTH_TEXTURE_URL,
    EARTH_NORMAL_MAP_URL,
    EARTH_SPECULAR_MAP_URL
  ]);

  // Update camera settings
  useEffect(() => {
    if (camera) {
      camera.near = 0.001;  // Much closer near plane
      camera.far = 1000;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return (
    <group>
      <OrbitControls 
        minDistance={0.1}  // Allow much closer zoom
        maxDistance={10}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
      <Suspense fallback={null}>
        {/* Earth base with textures */}
        <group>
          <Sphere args={[radius, 64, 64]}>
            <meshPhongMaterial
              map={earthTexture}
              normalMap={normalMap}
              specularMap={specularMap}
              shininess={5}
              specular={new THREE.Color('#333333')}
            />
          </Sphere>
        </group>

        {/* Germany states */}
        {features.map((feature) => (
          <AnimatedState
            key={feature.properties.name}
            feature={feature}
            color={STATE_COLORS[feature.properties.name as keyof typeof STATE_COLORS] || color}
            onClick={() => onStateClick(feature.properties.name, feature.geometry.coordinates)}
            isHovered={hoveredState === feature.properties.name}
            onHover={(value) => setHoveredState(value ? feature.properties.name : null)}
          />
        ))}

        {/* Add school particles */}
        {schools.map((school) => (
          <SchoolParticle
            key={school.id}
            position={latLongToVector3(school.lat, school.lng, 1.02)}
            type={school.type}
            school={school}
          />
        ))}

        {/* Add connection lines */}
        <ConnectionLines schools={schools} />

        {/* Enhanced lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={1} castShadow />
        <pointLight position={[-5, -3, -5]} intensity={0.5} />

        {/* Updated state labels with better visibility */}
        {features.map((feature) => {
          const center = feature.properties.center;
          if (!center) return null;
          
          const position = latLongToVector3(center[1], center[0], 1.02);
          return (
            <group key={feature.properties.name} position={position}>
              <BillboardText 
                text={feature.properties.name}
                color={hoveredState === feature.properties.name ? '#ffffff' : '#cccccc'}
                fontSize={0.8}
                outlineWidth={1}
                outlineColor="#000000"
              />
            </group>
          );
        })}

        {/* Major cities */}
        {MAJOR_CITIES.map(city => (
          <group key={city.name} position={latLongToVector3(city.coordinates[0], city.coordinates[1], 0.002)}>
            <mesh>
              <sphereGeometry args={[0.005 * Math.log10(city.population / 100000), 16, 16]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <Text
              position={[0, 0.02, 0]}
              fontSize={0.02}
              color="#ffffff"
              anchorX="center"
              anchorY="bottom"
            >
              {city.name}
            </Text>
          </group>
        ))}

        {/* Rivers */}
        {MAJOR_RIVERS.map(river => (
          <Line
            key={river.name}
            points={river.coordinates.map(([lat, lng]) => latLongToVector3(lat, lng, 0.001))}
            color="#4488ff"
            lineWidth={1}
            transparent
            opacity={0.5}
          />
        ))}
      </Suspense>
    </group>
  );
};

export default GermanyMap; 