import React from 'react';
import { Vector3 } from 'three';
import { School } from '@/data/schools';

interface SchoolParticleProps {
  position: Vector3;
  type: School['type'];
}

export const SchoolParticle: React.FC<SchoolParticleProps> = ({ position, type }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.005, 16, 16]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
  );
};