import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GermanStateComponent } from './components/GermanState';
import { germanStates } from './types';
import { Effects } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useSchoolStore } from '@/stores/schoolStore';
import gsap from 'gsap';
import { SchoolMarker } from './components/SchoolMarker';
import { latLongToVector3 } from '@/utils';

const Earth: React.FC = () => {
  const selectedSchool = useSchoolStore((state) => state.selectedSchool);
  const earthRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (selectedSchool && earthRef.current) {
      const targetPosition = latLongToVector3(
        selectedSchool.lat,
        selectedSchool.lng,
        2
      );
      
      gsap.to(earthRef.current.rotation, {
        x: -targetPosition.y,
        y: targetPosition.x,
        duration: 1,
        ease: 'power2.inOut'
      });
    }
  }, [selectedSchool]);

  return (
    <group ref={earthRef}>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color="#404040"
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>
      
      {germanStates.map((state, index) => (
        <GermanStateComponent key={index} state={state} />
      ))}

      <mesh scale={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#4a90e2"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          height={300}
        />
      </EffectComposer>

      {selectedSchool && <SchoolMarker school={selectedSchool} />}
    </group>
  );
};

const GermanyGlobe: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#111111' }}>
      <Canvas
        camera={{
          position: [0, 2, 2],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1} 
          castShadow
        />
        <pointLight 
          position={[-5, -5, -5]} 
          intensity={0.5} 
        />
        <hemisphereLight
          skyColor="#ffffff"
          groundColor="#000000"
          intensity={0.3}
        />
        
        <Earth />
        
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={0.6}
          panSpeed={0.5}
          rotateSpeed={0.4}
          minDistance={1.5}
          maxDistance={4}
        />
      </Canvas>
    </div>
  );
};

export default GermanyGlobe; 