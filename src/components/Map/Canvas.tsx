import React from 'react';
import { Canvas as ThreeCanvas } from '@react-three/fiber';

interface CanvasProps {
  children: React.ReactNode;
  camera?: any;
  style?: React.CSSProperties;
}

export function Canvas({ children, ...props }: CanvasProps) {
  return (
    <ThreeCanvas
      gl={{
        antialias: true,
        alpha: true,
      }}
      {...props}
    >
      {children}
    </ThreeCanvas>
  );
} 