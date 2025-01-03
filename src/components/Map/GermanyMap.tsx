import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { School } from '@/types/school';
import { latLongToVector3 } from '@/lib/utils';
import { AcademicSign } from './effects/AcademicSign';
import { ConnectionLines } from './effects/ConnectionLines';
import { StateLabels } from './effects/StateLabels';

interface GermanyMapProps {
  schools: School[];
}

export const GermanyMap: React.FC<GermanyMapProps> = ({ schools }) => {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [hoveredSchool, setHoveredSchool] = useState<School | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Function to handle zooming to a school's location
  const handleSchoolFocus = (school: School) => {
    const position = latLongToVector3(school.lat, school.long, 1.02);
    const targetPosition = new THREE.Vector3(
      position.x * 1.1,
      position.y * 1.1,
      position.z * 1.1
    );
    // Add camera animation logic here
  };

  return (
    <group ref={groupRef}>
      <StateLabels />
      <ConnectionLines schools={schools} selectedSchool={selectedSchool} />
      {schools.map((school) => (
        <AcademicSign
          key={school.name}
          position={latLongToVector3(school.lat, school.long)}
          school={school}
          onLearnMore={() => handleSchoolFocus(school)}
        />
      ))}
    </group>
  );
}; 