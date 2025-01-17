import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { Program } from '@/types/school';

interface Connection {
  start: THREE.Vector3;
  end: THREE.Vector3;
  type: 'program' | 'professor';
  strength: number;
}

interface UniversityConnectionsProps {
  universities: Array<{
    position: THREE.Vector3;
    programs: Program[];
    name: string;
  }>;
  hoveredUniversity: string | null;
}

export function UniversityConnections({ universities, hoveredUniversity }: UniversityConnectionsProps) {
  const connections = useMemo(() => {
    if (!hoveredUniversity) return [];

    const connections: Connection[] = [];
    const sourceUniversity = universities.find(u => u.name === hoveredUniversity);
    if (!sourceUniversity) return [];

    universities.forEach(targetUniversity => {
      if (targetUniversity.name === hoveredUniversity) return;

      // Check program connections
      const sharedPrograms = sourceUniversity.programs.filter(sourceProgram =>
        targetUniversity.programs.some(targetProgram => 
          targetProgram.name === sourceProgram.name
        )
      );

      if (sharedPrograms.length > 0) {
        connections.push({
          start: sourceUniversity.position,
          end: targetUniversity.position,
          type: 'program',
          strength: sharedPrograms.length,
        });
      }

      // Check professor connections
      const sharedProfessors = sourceUniversity.programs.flatMap(sourceProgram =>
        sourceProgram.professors.filter(sourceProf =>
          targetUniversity.programs.some(targetProgram =>
            targetProgram.professors.some(targetProf =>
              targetProf.email === sourceProf.email
            )
          )
        )
      );

      if (sharedProfessors.length > 0) {
        connections.push({
          start: sourceUniversity.position,
          end: targetUniversity.position,
          type: 'professor',
          strength: sharedProfessors.length,
        });
      }
    });

    return connections;
  }, [universities, hoveredUniversity]);

  return (
    <group>
      {connections.map((connection, index) => {
        const points = [connection.start, connection.end];
        const color = connection.type === 'program' ? '#00ff00' : '#ff00ff';
        const lineWidth = 1 + connection.strength;

        return (
          <Line
            key={index}
            points={points}
            color={color}
            lineWidth={lineWidth}
            transparent
            opacity={0.6}
          />
        );
      })}
    </group>
  );
} 