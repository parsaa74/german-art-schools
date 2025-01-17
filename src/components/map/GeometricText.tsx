import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { extend } from '@react-three/fiber';
import { GeometricTypographyMaterial, GeometricTypographyMaterialUniforms } from './shaders/GeometricTypographyMaterial';
import { Html } from '@react-three/drei';
import { audioSystem } from '../audio/AudioSystem';

// Extend R3F with our material
extend({ GeometricTypographyMaterial });

interface GeometricTextProps {
  children: string;
  position?: [number, number, number];
  fontSize?: number;
  color?: string;
  anchorX?: 'left' | 'center' | 'right';
  anchorY?: 'top' | 'middle' | 'bottom';
  isHovered?: boolean;
  onHover?: (isHovered: boolean) => void;
  universityData?: {
    name: string;
    type: string;
    programType: string;
    region: string;
    language: string;
    description: string;
  };
}

// Create a texture cache
const textureCache = new Map<string, THREE.Texture>();

export default function GeometricText({
  children,
  position = [0, 0, 0],
  fontSize = 0.2,
  color = '#4D1BFF',
  anchorX = 'center',
  anchorY = 'middle',
  isHovered = false,
  onHover,
  universityData
}: GeometricTextProps) {
  const textRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const [textTexture, setTextTexture] = useState<THREE.Texture | null>(null);
  const targetHover = useRef(0);
  const currentHover = useRef(0);
  const glitchIntensity = useRef(0);
  const timeRef = useRef(0);

  const { size } = useThree();
  const canvas = useMemo(() => document.createElement('canvas'), []);
  const context = useMemo(() => canvas.getContext('2d'), [canvas]);

  useEffect(() => {
    if (!context) return;

    // Enhanced canvas size for better text quality
    canvas.width = 2048; // Increased resolution
    canvas.height = 256;

    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Enhanced text rendering
    context.fillStyle = 'white';
    context.font = `bold ${canvas.height * 0.7}px "PP Neue Montreal", sans-serif`;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    
    // Add subtle text shadow for better contrast
    context.shadowColor = 'rgba(0, 0, 0, 0.3)';
    context.shadowBlur = 4;
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;

    // Draw text
    context.fillText(children, canvas.width / 2, canvas.height / 2);

    // Add subtle outline for better readability
    context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    context.lineWidth = 2;
    context.strokeText(children, canvas.width / 2, canvas.height / 2);

    // Create and cache texture with better filtering
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    textureCache.set(children, texture);
    setTextTexture(texture);

    return () => {
      texture.dispose();
      textureCache.delete(children);
    };
  }, [children, canvas, context]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    timeRef.current += delta;

    // Enhanced hover transition with spring physics
    const springStrength = 0.15;
    const dampening = 0.85;
    const targetHoverValue = isHovered ? 1 : 0;
    currentHover.current += (targetHoverValue - currentHover.current) * springStrength;
    currentHover.current *= dampening;

    // Reduced audio reactivity for better readability
    const audioIntensity = audioSystem.getAudioIntensity() * 0.5;
    const bands = audioSystem.getFrequencyBands();
    
    // Update shader uniforms with reduced distortion
    materialRef.current.uniforms.time.value = timeRef.current;
    materialRef.current.uniforms.hover.value = currentHover.current;
    materialRef.current.uniforms.audioIntensity.value = audioIntensity * 0.5;
    materialRef.current.uniforms.audioHighBand.value = bands.high * 0.3;
    materialRef.current.uniforms.audioMidBand.value = bands.mid * 0.3;
    materialRef.current.uniforms.audioLowBand.value = bands.low * 0.3;

    // Reduced glitch effect for better readability
    if (isHovered) {
      glitchIntensity.current = Math.sin(timeRef.current * 10) * 0.08 + audioIntensity * 0.1;
    } else {
      glitchIntensity.current *= 0.9;
    }
    materialRef.current.uniforms.glitchIntensity.value = glitchIntensity.current;

    // Smoother scale animation
    if (textRef.current) {
      const targetScale = 1 + currentHover.current * 0.15 + audioIntensity * 0.05;
      textRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  if (!textTexture) return null;

  return (
    <mesh
      ref={textRef}
      position={position}
      onPointerOver={() => onHover?.(true)}
      onPointerOut={() => onHover?.(false)}
    >
      <planeGeometry args={[fontSize * 5, fontSize]} />
      <primitive
        object={new GeometricTypographyMaterial()}
        ref={materialRef}
        attach="material"
        transparent
        depthWrite={false}
        uniforms={{
          textureMap: { value: textTexture },
          color: { value: new THREE.Color(color) },
          time: { value: 0 },
          hover: { value: 0 },
          glitchIntensity: { value: 0 },
          audioIntensity: { value: 0 },
          audioHighBand: { value: 0 },
          audioMidBand: { value: 0 },
          audioLowBand: { value: 0 },
          resolution: { value: new THREE.Vector2(size.width, size.height) }
        }}
      />
    </mesh>
  );
} 