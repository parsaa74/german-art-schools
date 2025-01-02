import React, { useEffect, useState, Suspense } from 'react';
import { Line, Text, Billboard } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { AcademicSign } from './effects/AcademicSign';
import { ConnectionLines } from './effects/ConnectionLines';
import { schools } from '@/data/schools';
import { School } from '@/types/school';
import { latLongToVector3 } from '@/lib/utils';
import { SchoolDetails } from '@/components/SchoolDetails';
import { AnimatePresence } from 'framer-motion';

interface Feature {
  properties: {
    name: string;
    center: [number, number];
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: Array<Array<[number, number]>> | Array<Array<Array<[number, number]>>>;
  };
}

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

  const points = React.useMemo(() => {
    const coordinates = feature.geometry.type === 'Polygon' 
      ? [feature.geometry.coordinates as Array<Array<[number, number]>>]
      : feature.geometry.coordinates as Array<Array<Array<[number, number]>>>;

    return coordinates.flatMap(polygon =>
      polygon.flatMap(ring =>
        ring.map(([lng, lat]) => latLongToVector3(lat, lng, 1.02))
      )
    );
  }, [feature]);

  return (
    <animated.group scale={scale}>
      <Line
        points={points}
        color={color}
        lineWidth={1}
        transparent
        opacity={isHovered ? 1 : 0.7}
        onClick={onClick}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      />
    </animated.group>
  );
};

const GermanyMap: React.FC = () => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const { camera } = useThree();

  // Function to handle zooming to a school's location
  const handleSchoolFocus = (school: School) => {
    const position = latLongToVector3(school.lat, school.lng, 1.02);
    const targetPosition = new THREE.Vector3(
      position.x * 1.1,
      position.y * 1.1,
      position.z * 1.1
    );
    
    // Animate camera position
    const duration = 1000;
    const startPosition = camera.position.clone();
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      camera.lookAt(position);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/isellsoap/deutschlandGeoJSON/main/2_bundeslaender/4_niedrig.geo.json')
      .then(response => response.json())
      .then(germanyData => {
        const processedFeatures = germanyData.features.map((feature: any) => {
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
        });
        setFeatures(processedFeatures);
      })
      .catch(error => {
        console.error('Error fetching GeoJSON:', error);
      });
  }, []);

  const getStateCentroid = (coordinates: Array<Array<Array<[number, number]>>> | Array<Array<[number, number]>>): { lat: number; lng: number } => {
    let totalLat = 0;
    let totalLng = 0;
    let pointCount = 0;

    // Handle both Polygon and MultiPolygon types
    const processCoordinates = (coords: Array<[number, number]>) => {
      coords.forEach(([lng, lat]) => {
        totalLat += lat;
        totalLng += lng;
        pointCount++;
      });
    };

    if (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0]) && Array.isArray(coordinates[0][0][0])) {
      // MultiPolygon
      (coordinates as Array<Array<Array<[number, number]>>>).forEach(polygon => {
        polygon.forEach(ring => processCoordinates(ring));
      });
    } else {
      // Polygon
      (coordinates as Array<Array<[number, number]>>).forEach(ring => processCoordinates(ring));
    }

    return {
      lat: totalLat / pointCount,
      lng: totalLng / pointCount
    };
  };

  const onStateClick = (feature: Feature) => {
    const coordinates = feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates as Array<Array<[number, number]>>
      : feature.geometry.coordinates as Array<Array<Array<[number, number]>>>;

    const centroid = getStateCentroid(coordinates);
    const position = latLongToVector3(centroid.lat, centroid.lng, 1.02);
    
    // Animate camera to state centroid
    const targetPosition = new THREE.Vector3(
      position.x * 1.5,
      position.y * 1.5,
      position.z * 1.5
    );
    
    const duration = 1000;
    const startPosition = camera.position.clone();
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      camera.lookAt(position);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  return (
    <>
      <group>
        <Suspense fallback={null}>
          {/* Germany states */}
          {features.map((feature) => (
            <AnimatedState
              key={feature.properties.name}
              feature={feature}
              color={STATE_COLORS[feature.properties.name as keyof typeof STATE_COLORS] || '#ffffff'}
              onClick={() => onStateClick(feature)}
              isHovered={hoveredState === feature.properties.name}
              onHover={(value) => setHoveredState(value ? feature.properties.name : null)}
            />
          ))}

          {/* School signs */}
          {schools.map((school) => (
            <AcademicSign
              key={school.id}
              position={latLongToVector3(school.lat, school.lng, 1.02)}
              school={school}
              onLearnMore={() => {
                handleSchoolFocus(school);
                setSelectedSchool(school);
              }}
            />
          ))}

          {/* Connection lines */}
          <ConnectionLines schools={schools} />

          {/* State labels */}
          {features.map((feature) => {
            const center = feature.properties.center;
            if (!center) return null;
            
            const position = latLongToVector3(center[1], center[0], 1.02);
            return (
              <group key={feature.properties.name} position={position}>
                <Billboard follow={true}>
                  <Text
                    fontSize={0.006}
                    color={hoveredState === feature.properties.name ? '#ffffff' : '#cccccc'}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.0002}
                    outlineColor="#000000"
                  >
                    {feature.properties.name}
                  </Text>
                </Billboard>
              </group>
            );
          })}
        </Suspense>
      </group>

      {/* School Details Modal */}
      <AnimatePresence>
        {selectedSchool && (
          <SchoolDetails
            school={selectedSchool}
            onClose={() => setSelectedSchool(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

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

export default GermanyMap; 