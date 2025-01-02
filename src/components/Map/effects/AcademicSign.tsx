import React, { useState, useCallback } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ThreeEvent } from '@react-three/fiber';
import { School } from '@/types/school';
import UniversityTooltip from './UniversityTooltip';

interface AcademicSignProps {
  position: Vector3;
  school: School;
  onLearnMore: () => void;
}

export const AcademicSign: React.FC<AcademicSignProps> = ({ position, school, onLearnMore }) => {
  const [hovered, setHovered] = useState(false);
  const [cameraDistance, setCameraDistance] = useState(10);
  const { camera } = useThree();

  useFrame(() => {
    setCameraDistance(camera.position.length());
  });

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
  }, []);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
  }, []);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onLearnMore();
  }, [onLearnMore]);

  const universityData = {
    name: school.name,
    program: school.type,
    location: school.state,
    degree: `${school.programs.length} Programs Available`
  };

  const tooltipPosition: [number, number, number] = [0, 0.02, 0];

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        scale={[1, 1, 1]}
      >
        <sphereGeometry args={[0.008, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? '#ffffff' : '#aaaaaa'}
          emissive={hovered ? '#ffffff' : '#aaaaaa'}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {hovered && (
        <UniversityTooltip
          isHovered={hovered}
          position={tooltipPosition}
          universityData={universityData}
          cameraDistance={cameraDistance}
        />
      )}
    </group>
  );
}; 