import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { School } from '@/types/school';
import { latLongToVector3 } from '@/utils';
import { SchoolPrograms } from './SchoolPrograms';

interface Props {
  school: School;
}

export const SchoolMarker: React.FC<Props> = ({ school }) => {
  const [showPrograms, setShowPrograms] = useState(false);
  const position = latLongToVector3(school.lat, school.lng, 1.02);

  return (
    <group position={position}>
      <mesh onClick={() => setShowPrograms(true)}>
        <sphereGeometry args={[0.01, 16, 16]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" />
      </mesh>
      
      <Html
        position={[0, 0.02, 0]}
        center
        distanceFactor={8}
        occlude
      >
        <Card className="w-48 bg-white/90 backdrop-blur-sm cursor-pointer" 
              onClick={() => setShowPrograms(true)}>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">{school.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-xs">
            <p>Founded: {school.founded}</p>
            <p>Type: {school.type}</p>
            {school.programs && (
              <p className="text-blue-600">
                {school.programs.length} Program{school.programs.length !== 1 ? 's' : ''} Available
              </p>
            )}
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

      <SchoolPrograms 
        school={school}
        isVisible={showPrograms}
        onClose={() => setShowPrograms(false)}
      />
    </group>
  );
}; 