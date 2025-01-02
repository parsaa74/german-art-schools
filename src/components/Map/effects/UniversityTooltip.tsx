import React from 'react';
import { Html } from '@react-three/drei';

interface UniversityData {
  name: string;
  program: string;
  location: string;
  degree: string;
}

interface UniversityTooltipProps {
  isHovered: boolean;
  position: [number, number, number];
  universityData: UniversityData;
  cameraDistance: number;
}

const UniversityTooltip: React.FC<UniversityTooltipProps> = ({ 
  isHovered, 
  position, 
  universityData,
  cameraDistance 
}) => {
  if (!isHovered) return null;

  // Calculate a size that gets smaller as you zoom out
  const scale = Math.max(0.1, Math.min(1, 5 / cameraDistance));

  return (
    <Html
      position={position}
      center
      distanceFactor={1}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center bottom'
      }}
    >
      <div 
        style={{
          width: '120px',
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          color: 'white',
          fontSize: '10px',
          lineHeight: '1.2',
          transition: 'opacity 0.2s ease',
          opacity: isHovered ? 1 : 0,
          pointerEvents: 'none'
        }}
      >
        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
          {universityData.name}
        </div>
        <div style={{ fontSize: '9px', opacity: 0.8 }}>
          {universityData.program}
        </div>
        <div 
          style={{ 
            height: '1px', 
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
            margin: '4px 0'
          }} 
        />
        <div style={{ fontSize: '9px' }}>
          <div>📍 {universityData.location}</div>
          <div>🎓 {universityData.degree}</div>
        </div>
      </div>
    </Html>
  );
};

export default UniversityTooltip; 