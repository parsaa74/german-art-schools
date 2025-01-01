import React from 'react';
import { Html } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { School } from '@/types/school';
import { latLongToVector3 } from '@/utils';

interface Props {
  school: School;
}

export const SchoolMarker: React.FC<Props> = ({ school }) => {
  const position = latLongToVector3(school.lat, school.lng, 1.02);

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.01, 16, 16]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" />
      </mesh>
      
      <Html
        position={[0, 0.02, 0]}
        center
        distanceFactor={8}
        occlude
      >
        <Card className="w-48 bg-white/90 backdrop-blur-sm">
          <CardHeader className="p-3">
            <CardTitle className="text-sm">{school.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-xs">
            <p>Founded: {school.founded}</p>
            <p>Type: {school.type}</p>
            {school.website && (
              <a 
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Visit Website
              </a>
            )}
          </CardContent>
        </Card>
      </Html>
    </group>
  );
}; 