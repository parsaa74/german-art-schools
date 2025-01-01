import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { School } from '@/data/schools';
import { latLongToVector3 } from '@/lib/utils';

interface ConnectionLinesProps {
  schools: School[];
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ schools }) => {
  const connections = useMemo(() => {
    const lines = [];
    for (let i = 0; i < schools.length; i++) {
      for (let j = i + 1; j < schools.length; j++) {
        if (schools[i].type === schools[j].type) {
          lines.push({
            start: latLongToVector3(schools[i].lat, schools[i].lng, 1.02),
            end: latLongToVector3(schools[j].lat, schools[j].lng, 1.02),
          });
        }
      }
    }
    return lines;
  }, [schools]);

  return (
    <group>
      {connections.map((connection, index) => (
        <Line
          key={index}
          points={[connection.start, connection.end]}
          color="#ffffff"
          lineWidth={0.5}
          transparent
          opacity={0.2}
        />
      ))}
    </group>
  );
};