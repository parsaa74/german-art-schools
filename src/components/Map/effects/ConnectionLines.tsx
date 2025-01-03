import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import { School } from '@/types/school';
import { latLongToVector3 } from '@/lib/utils';

interface ConnectionLinesProps {
  schools: School[];
  selectedSchool: School | null;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({ schools, selectedSchool }) => {
  const connections = useMemo(() => {
    if (!selectedSchool) return [];

    return schools
      .filter(school => school !== selectedSchool)
      .map(school => ({
        start: latLongToVector3(selectedSchool.lat, selectedSchool.long),
        end: latLongToVector3(school.lat, school.long)
      }));
  }, [schools, selectedSchool]);

  if (!selectedSchool) return null;

  return (
    <>
      {connections.map((connection, index) => (
        <Line
          key={index}
          points={[connection.start, connection.end]}
          color="white"
          lineWidth={0.3}
          opacity={0.2}
        />
      ))}
    </>
  );
};