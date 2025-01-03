import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GermanyMap } from './GermanyMap';
import { schools } from '@/data/schools';

const LineArtGlobe: React.FC = () => {
  const [isRotating, setIsRotating] = useState(true);
  const globeRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (isRotating && globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={globeRef}>
      <GermanyMap schools={schools} />
    </group>
  );
};

export default LineArtGlobe; 