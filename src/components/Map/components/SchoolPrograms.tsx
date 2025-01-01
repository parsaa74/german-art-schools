import React from 'react';
import { Html } from '@react-three/drei';
import { ProgramDetails } from '@/components/ui/program-details';
import { School } from '@/types/school';

interface SchoolProgramsProps {
  school: School;
  isVisible: boolean;
  onClose: () => void;
}

export const SchoolPrograms: React.FC<SchoolProgramsProps> = ({ 
  school, 
  isVisible, 
  onClose 
}) => {
  if (!isVisible || !school.programs) return null;

  return (
    <Html
      position={[0, 0, 0]}
      center
      style={{
        width: '400px',
        height: 'auto',
        maxHeight: '80vh',
        overflow: 'auto'
      }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{school.name}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>
        {school.programs.map((program, index) => (
          <ProgramDetails key={index} program={program} />
        ))}
      </div>
    </Html>
  );
}; 