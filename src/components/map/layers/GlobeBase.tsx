import { Sphere } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MAP_CONFIG, COLORS } from '../../../lib/geo';

export const GlobeBase = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const rotationSpeed = useRef({ x: 0.0003, y: 0.0005 });

  // Animate the grid and glow
  useFrame((state) => {
    if (gridRef.current) {
      // Rotate grid slightly for subtle movement
      gridRef.current.rotation.x += rotationSpeed.current.x;
      gridRef.current.rotation.y += rotationSpeed.current.y;
    }
    
    if (glowRef.current && glowRef.current.material instanceof THREE.MeshBasicMaterial) {
      // Pulse the glow
      const pulseIntensity = hovered ? 0.07 : 0.03;
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * pulseIntensity + pulseIntensity;
      glowRef.current.material.opacity = pulse;
    }
    
    if (sphereRef.current && sphereRef.current.material instanceof THREE.MeshPhongMaterial) {
      // Adjust emissive intensity on hover
      if (hovered) {
        sphereRef.current.material.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      } else {
        sphereRef.current.material.emissiveIntensity = 0.1;
      }
    }
  });

  return (
    <>
      {/* Main globe sphere */}
      <Sphere 
        ref={sphereRef}
        args={[MAP_CONFIG.radius, 32, 32]} 
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshPhongMaterial
          color={COLORS.globe}
          transparent
          opacity={0.4}
          wireframe={true}
          emissive={COLORS.globe}
          emissiveIntensity={0.1}
        />
      </Sphere>

      {/* Grid sphere with rotation */}
      <Sphere ref={gridRef} args={[MAP_CONFIG.radius * 1.001, 24, 24]}>
        <meshBasicMaterial
          color={COLORS.borders}
          wireframe={true}
          transparent
          opacity={0.15}
        />
      </Sphere>
      
      {/* Outer glow with pulse animation */}
      <Sphere ref={glowRef} args={[MAP_CONFIG.radius * 1.03, 16, 16]}>
        <meshBasicMaterial
          color={COLORS.marker}
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
      
      {/* Inner details - random points */}
      <points>
        <bufferGeometry>
          {(() => {
            const vertices = [];
            for (let i = 0; i < 300; i++) {
              const theta = Math.random() * Math.PI * 2;
              const phi = Math.random() * Math.PI;
              const r = MAP_CONFIG.radius * 0.98;
              
              const x = r * Math.sin(phi) * Math.cos(theta);
              const y = r * Math.sin(phi) * Math.sin(theta);
              const z = r * Math.cos(phi);
              
              vertices.push(x, y, z);
            }
            return (
              <bufferAttribute
                attach="attributes-position"
                array={new Float32Array(vertices)}
                count={vertices.length / 3}
                itemSize={3}
              />
            );
          })()}
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color={COLORS.text}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}; 