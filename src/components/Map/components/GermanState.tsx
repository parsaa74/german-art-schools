import React, { useMemo, useState } from 'react';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import type { GermanState } from '../types';

interface Props {
  state: GermanState;
}

const latLongToVector3 = (lat: number, lng: number, radius: number = 1) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// Create an animated version of the Line component
const AnimatedLine = animated(Line);

export const GermanStateComponent: React.FC<Props> = ({ state }) => {
  const [hovered, setHovered] = useState(false);
  
  const points = useMemo(() => {
    if (!state.coordinates || state.coordinates.length === 0) return [];
    const coordinates = [...state.coordinates, state.coordinates[0]];
    return coordinates.map(([lat, lng]) => latLongToVector3(lat, lng, 1.001));
  }, [state.coordinates]);

  const labelPosition = useMemo(() => 
    state.labelPosition ? 
      latLongToVector3(state.labelPosition[0], state.labelPosition[1], 1.02) :
      new THREE.Vector3(),
    [state.labelPosition]
  );

  const { scale, opacity } = useSpring({
    scale: hovered ? 1.1 : 1,
    opacity: hovered ? 1 : 0.7,
  });

  if (points.length === 0) return null;

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <animated.group scale={scale}>
        <AnimatedLine
          points={points}
          color={state.color}
          lineWidth={2}
          transparent
          opacity={opacity}
        />
        <mesh position={labelPosition}>
          <sphereGeometry args={[0.005, 16, 16]} />
          <meshBasicMaterial color={state.color} />
        </mesh>
        {hovered && (
          <Text
            position={labelPosition}
            fontSize={0.05}
            color={state.color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.004}
            outlineColor="#000000"
          >
            {state.name}
          </Text>
        )}
      </animated.group>
    </group>
  );
}; 