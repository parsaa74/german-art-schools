import React from 'react';
import { Text, Billboard } from '@react-three/drei';
import { latLongToVector3 } from '@/lib/utils';

interface State {
  name: string;
  center: [number, number];
}

const states: State[] = [
  { name: 'Baden-Württemberg', center: [8.6417, 48.6616] },
  { name: 'Bavaria', center: [11.4979, 48.7904] },
  { name: 'Berlin', center: [13.4050, 52.5200] },
  { name: 'Brandenburg', center: [13.4050, 52.5200] },
  { name: 'Bremen', center: [8.8017, 53.0793] },
  { name: 'Hamburg', center: [9.9937, 53.5511] },
  { name: 'Hesse', center: [8.6858, 50.1109] },
  { name: 'Lower Saxony', center: [9.7320, 52.6367] },
  { name: 'Mecklenburg-Vorpommern', center: [12.4293, 53.6355] },
  { name: 'North Rhine-Westphalia', center: [7.6261, 51.4332] },
  { name: 'Rhineland-Palatinate', center: [7.3089, 49.9129] },
  { name: 'Saarland', center: [6.9965, 49.2354] },
  { name: 'Saxony', center: [13.7333, 51.0504] },
  { name: 'Saxony-Anhalt', center: [11.6276, 51.9503] },
  { name: 'Schleswig-Holstein', center: [9.5597, 54.3233] },
  { name: 'Thuringia', center: [11.0283, 50.9787] }
];

export const StateLabels: React.FC = () => {
  return (
    <>
      {states.map((state) => {
        const position = latLongToVector3(state.center[1], state.center[0], 1.02);
        return (
          <group key={state.name} position={position}>
            <Billboard follow={true}>
              <Text
                fontSize={0.005}
                color="#cccccc"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.0001}
                outlineColor="#000000"
              >
                {state.name}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </>
  );
}; 