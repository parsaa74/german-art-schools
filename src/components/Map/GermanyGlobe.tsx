import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import GermanyMap from './GermanyMap';

const LineArtGlobe: React.FC = () => {
  const [isRotating, setIsRotating] = useState(true);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (isRotating && groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group ref={groupRef} onClick={() => setIsRotating(!isRotating)}>
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color={0x333333}
          wireframe={true}
          opacity={0.6}
          transparent={true}
        />
      </mesh>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={32}
            array={new Float32Array(
              Array.from({ length: 32 }, (_, i) => {
                const angle = (i / 32) * Math.PI * 2;
                return [Math.cos(angle), 0, Math.sin(angle)];
              }).flat()
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={0x444444} transparent opacity={0.3} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={32}
            array={new Float32Array(
              Array.from({ length: 32 }, (_, i) => {
                const angle = (i / 32) * Math.PI * 2;
                return [0, Math.cos(angle), Math.sin(angle)];
              }).flat()
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={0x444444} transparent opacity={0.3} />
      </line>
    </group>
  );
};

const Scene: React.FC = () => {
  return (
    <>
      <LineArtGlobe />
      <GermanyMap />
    </>
  );
};

export const GermanyGlobe: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#111111' }}>
      <Canvas
        camera={{
          position: [0, 0, 2.5],
          fov: 45,
          near: 0.01,
          far: 1000
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.7} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={1.2}
          panSpeed={0.8}
          rotateSpeed={0.5}
          minDistance={0.5}
          maxDistance={5}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
};

export default GermanyGlobe; 