import React from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { GermanState } from '@/data/germanStates';

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

export const GermanStateComponent: React.FC<Props> = ({ state }) => {
  const points = state.coordinates.map(([lat, lng]) => 
    latLongToVector3(lat, lng, 1.001)
  );

  return (
    <Line
      points={points}
      color={state.color}
      lineWidth={1}
    />
  );
}; 