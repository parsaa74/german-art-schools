import React, { useState } from 'react';
import { Vector3 } from 'three';
import { Html } from '@react-three/drei';
import { School } from '@/types/school';
import { getColorByType } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';

interface SchoolParticleProps {
  position: Vector3;
  type: School['type'];
  school: School;
  onClick?: () => void;
}

export const SchoolParticle: React.FC<SchoolParticleProps> = ({ position, type, school, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const color = getColorByType(type);

  return (
    <group
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          setShowInfo(!showInfo);
          onClick?.();
        }}
      >
        <sphereGeometry args={[0.008, 16, 16]} />
        <meshPhongMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 2 : 0.5}
        />
      </mesh>
      
      {(hovered || showInfo) && (
        <Html
          position={[0, 0.02, 0]}
          center
          distanceFactor={40}
          style={{
            transition: 'all 0.2s',
            opacity: hovered || showInfo ? 1 : 0,
            transform: 'scale(0.5)',
            transformOrigin: 'bottom center',
          }}
        >
          <div className="w-[320px]">
            <Card className="bg-black/80 text-white border-none shadow-xl backdrop-blur-md">
              <CardHeader className="p-3 pb-2">
                {school.logo && (
                  <div className="w-full flex justify-center mb-2">
                    <Image
                      src={`/images/university-logos/${school.logo}`}
                      alt={`${school.name} logo`}
                      width={120}
                      height={60}
                      className="object-contain"
                    />
                  </div>
                )}
                <CardTitle className="text-sm font-bold leading-tight">{school.name}</CardTitle>
                <div className="flex gap-1 mt-1">
                  <Badge variant="secondary" className="text-[8px] py-0 h-3">
                    {type}
                  </Badge>
                  <Badge variant="outline" className="text-[8px] py-0 h-3">
                    {school.state}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 text-[10px] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Founded:</span>
                  <span>{school.founded}</span>
                </div>
                {school.programs && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Programs:</span>
                    <span>{school.programs.length}</span>
                  </div>
                )}
                {school.website && (
                  <a 
                    href={school.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-400 hover:text-blue-300 transition-colors truncate text-right text-[9px] mt-2"
                  >
                    Visit Website →
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </Html>
      )}
    </group>
  );
};