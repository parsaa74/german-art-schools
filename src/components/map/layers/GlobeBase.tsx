import { Sphere } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import { MAP_CONFIG } from '../../../constants/map';

export const GlobeBase = () => {
  const sphereRef = useRef<THREE.Mesh>(null);

  return (
    <>
      {/* Main globe sphere */}
      <Sphere ref={sphereRef} args={[MAP_CONFIG.radius, 32, 32]}>
        <meshPhongMaterial
          color="#999999"
          transparent
          opacity={0.4}
          wireframe={true}
        />
      </Sphere>

      {/* Grid sphere */}
      <Sphere args={[MAP_CONFIG.radius * 1.001, 16, 16]}>
        <meshBasicMaterial
          color="#cccccc"
          wireframe={true}
          transparent
          opacity={0.2}
        />
      </Sphere>
    </>
  );
}; 