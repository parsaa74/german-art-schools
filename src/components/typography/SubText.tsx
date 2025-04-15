import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { FONTS } from '@/utils/fonts';

interface SubTextProps {
  text: string;
  position?: [number, number, number];
  color?: string;
  fontSize?: number;
  maxWidth?: number;
  // Fog related props will be added later
}

export function SubText({
  text,
  position = [0, 0, -2],
  color = '#8BACD9',
  fontSize = 0.6,
  maxWidth = 15,
}: SubTextProps) {
  const textRef = useRef<any>(null);

  // Use the font from FONTS constant
  const fontPath = FONTS.INTER_REGULAR;

  // We will add shader material later

  return (
    <group position={position}>
      <Text
        ref={textRef}
        font={fontPath}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={maxWidth}
        lineHeight={1.2}
        letterSpacing={0.05}
      >
        {text}
        {/* Simple emissive material for subtle glow */}
        <meshBasicMaterial color={color} toneMapped={false} />
      </Text>
    </group>
  );
}
