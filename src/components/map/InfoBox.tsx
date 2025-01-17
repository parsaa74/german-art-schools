import { useRef } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { Program } from '@/types/school';

interface InfoBoxProps {
  name: string;
  type: string;
  description: string;
  position: THREE.Vector3;
  programs: Program[];
  visible: boolean;
  onClose: () => void;
}

export function InfoBox({ name, type, description, position, programs, visible, onClose }: InfoBoxProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { scale, opacity } = useSpring({
    scale: visible ? 1 : 0,
    opacity: visible ? 1 : 0,
    config: { tension: 280, friction: 60 },
  });

  return (
    <animated.group
      ref={groupRef}
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <Billboard>
        {/* Gradient background panel */}
        <mesh position={[0, 0, -0.05]}>
          <boxGeometry args={[3.2, 2.7, 0.1]} />
          <meshPhongMaterial
            color="#1a1a2e"
            transparent
            opacity={0.95}
            shininess={100}
            specular={new THREE.Color("#ffffff")}
          />
        </mesh>

        {/* Decorative border */}
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[3.3, 2.8, 0.01]} />
          <meshBasicMaterial color="#4D1BFF" transparent opacity={0.3} />
        </mesh>

        {/* University name with enhanced styling */}
        <Text
          position={[0, 0.9, 0]}
          fontSize={0.18}
          font="/fonts/PPNeueMontreal-Bold.otf"
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.004}
          outlineColor="#000000"
          outlineOpacity={0.8}
          maxWidth={2.8}
        >
          {name}
        </Text>

        {/* University type with accent color */}
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.13}
          font="/fonts/PPNeueMontreal-Medium.otf"
          color="#4D1BFF"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.003}
          outlineColor="#000000"
          outlineOpacity={0.8}
        >
          {type}
        </Text>

        {/* Description with improved readability */}
        <Text
          position={[0, 0.2, 0]}
          fontSize={0.11}
          font="/fonts/PPNeueMontreal-Book.otf"
          color="#e0e0e0"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.002}
          outlineColor="#000000"
          outlineOpacity={0.8}
          maxWidth={2.8}
          lineHeight={1.4}
        >
          {description}
        </Text>

        {/* Programs with enhanced spacing and styling */}
        <group position={[0, -0.6, 0]}>
          {programs.map((program, index) => (
            <group key={program.name} position={[0, -index * 0.3, 0]}>
              <Text
                position={[0, 0.1, 0]}
                fontSize={0.11}
                font="/fonts/PPNeueMontreal-Medium.otf"
                color="#00ffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.002}
                outlineColor="#000000"
                outlineOpacity={0.8}
              >
                {program.name}
              </Text>
            </group>
          ))}
        </group>
      </Billboard>
    </animated.group>
  );
}
