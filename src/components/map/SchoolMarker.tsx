import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Sphere, Text, Line, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore';
import { useSpring, animated } from '@react-spring/three';
import { MAP_CONFIG } from '@/lib/geo/index';

// --- Removed Shader Imports ---
// import markerVertexShader from '@/shaders/marker.vert?raw';
// import markerFragmentShader from '@/shaders/marker.frag?raw';

interface SchoolMarkerProps { 
  position: THREE.Vector3;
  schoolData: ProcessedUniversity;
  isHovered: boolean;
  isSelected: boolean;
}

const AnimatedSphere = animated(Sphere);
const AnimatedText = animated(Text);
const AnimatedLine = animated(Line);

// simpleHash function (remains the same)
function simpleHash(str: string): number { 
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; 
  }
  return Math.abs(hash);
 }

// --- Removed getBaseColor function --- 

export function SchoolMarker({ position, schoolData, isHovered, isSelected }: SchoolMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null); 
  // const materialRef = useRef<THREE.ShaderMaterial>(null); // <-- Removed material ref
  const [localHover, setLocalHover] = useState(false);

  const { setHoverUniversityName, setSelectedUniversity, controlsEnabled } = useSchoolStore();
  const showHoverEffect = isHovered || localHover;

  // Wandering motion setup (remains the same)
  const basePosition = useMemo(() => position.clone(), [position]);
  const randomSeed = useMemo(() => simpleHash(schoolData.id || schoolData.name), [schoolData.id, schoolData.name]);
  const timeOffsetX = useMemo(() => (randomSeed % 1000) / 1000 * Math.PI * 2, [randomSeed]);
  const timeOffsetY = useMemo(() => ((randomSeed * 3) % 1000) / 1000 * Math.PI * 2, [randomSeed]);
  const timeOffsetZ = useMemo(() => ((randomSeed * 7) % 1000) / 1000 * Math.PI * 2, [randomSeed]);
  const speedFactor = useMemo(() => 0.2 + (randomSeed % 500) / 1000 * 0.3, [randomSeed]); 
  const amplitude = MAP_CONFIG.radius * 0.008; 

  // react-spring animations - Restore color/emissive/glow
  const { springScale, color, emissiveColor, glowOpacity, textOpacity } = useSpring({
    springScale: isSelected ? 1.8 : (showHoverEffect ? 1.5 : 1.0),
    // Define target colors based on state
    color: isSelected ? '#60A5FA' : (showHoverEffect ? '#FFFFFF' : '#3B82F6'), // Blue base, white hover, light blue selected
    emissiveColor: isSelected ? '#93C5FD' : (showHoverEffect ? '#FFFFFF' : '#60A5FA'), // Similar logic for emissive
    glowOpacity: isSelected ? 0.7 : (showHoverEffect ? 0.6 : 0.35), // Opacity for the separate glow mesh
    textOpacity: showHoverEffect ? 1 : 0,
    config: { mass: 1, tension: 280, friction: 30 } 
  });

  // Removed uniforms memoization

  // Frame loop for wandering motion ONLY
  useFrame(({ clock }) => {
    // Wandering
    if (groupRef.current) {
      const elapsedTime = clock.getElapsedTime() * speedFactor;
      const wanderX = Math.sin(elapsedTime + timeOffsetX) * amplitude;
      const wanderY = Math.cos(elapsedTime + timeOffsetY) * amplitude;
      const wanderZ = Math.sin(elapsedTime + timeOffsetZ) * amplitude * 0.7; 
      
      groupRef.current.position.set(
        basePosition.x + wanderX,
        basePosition.y + wanderY,
        basePosition.z + wanderZ
      );
    }
    // Removed shader uniform updates
  });

  // Event handlers (remain the same)
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => { 
    if (!controlsEnabled || isSelected) return;
    event.stopPropagation();
    setLocalHover(true);
    if (!isSelected) {
        setHoverUniversityName(schoolData.name);
    }
    document.body.style.cursor = 'pointer';
   };
  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => { 
    if (!controlsEnabled) return;
    event.stopPropagation();
    setLocalHover(false);
    if (
        useSchoolStore.getState().hoverUniversityName === schoolData.name &&
        !isSelected
    ) {
      setHoverUniversityName(null);
    }
    document.body.style.cursor = 'auto';
   };
  const handleClick = (event: ThreeEvent<MouseEvent>) => { 
     if (!controlsEnabled) return;
    event.stopPropagation(); 
    const currentSelected = useSchoolStore.getState().selectedUniversity;
    const newlySelected = currentSelected?.name === schoolData.name ? null : schoolData;
    setSelectedUniversity(newlySelected);
    if (newlySelected?.name === schoolData.name) {
        setLocalHover(false);
        setHoverUniversityName(null);
    }
  };

  // Text and Line Positioning
  const textPosition = useMemo(
    () => new THREE.Vector3(0, MAP_CONFIG.radius * 0.04, 0),
    []
  );
  const linePoints = useMemo(
    () => [new THREE.Vector3(0, 0, 0), textPosition],
    [textPosition]
  );

  // Render
  return (
    <group ref={groupRef} position={basePosition}> 
      <AnimatedSphere
        ref={meshRef}
        args={[MAP_CONFIG.radius * 0.025, 32, 32]} 
        scale={springScale} 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* Restore animated standard material */}
        <animated.meshStandardMaterial
          color={color} 
          emissive={emissiveColor} 
          emissiveIntensity={1.5} // Keep intensity or adjust
          metalness={0.1}
          roughness={0.4}
          transparent // Keep transparency
          opacity={isSelected ? 1.0 : (showHoverEffect ? 0.95 : 0.85)} // Adjust opacity based on state
        />
      </AnimatedSphere>

      {/* Restore separate Glow Effect Sphere */}
      {(showHoverEffect || isSelected) && (
        <AnimatedSphere
          // No ref needed unless manipulating directly
          args={[MAP_CONFIG.radius * 0.025 * 1.4, 32, 32]} // Slightly larger for glow
          scale={springScale} // Scale glow with main sphere
          visible={glowOpacity.to(o => o > 0.01)} // Hide if opacity is near zero
        >
          <animated.meshBasicMaterial
            color={emissiveColor} // Use emissive color for glow
            transparent
            opacity={glowOpacity} // Animate opacity
            depthWrite={false} 
            side={THREE.BackSide} // Render back-face for halo effect
            blending={THREE.AdditiveBlending} // Additive blending for bright glow
          />
        </AnimatedSphere>
      )}

      {/* Billboard to make text face camera */}
      <Billboard
        follow={true}
        // Optionally lock axes if needed, e.g., lockZ={true} if you only want Y-axis rotation
      >
          {/* Hover Text */}
          <AnimatedText
            position={textPosition} // Position relative to the Billboard
            color={isSelected ? '#FFFFFF' : '#E0E0E0'}
            fontSize={MAP_CONFIG.radius * 0.018}
            anchorY="bottom"
            anchorX="center"
            outlineWidth={0.001}
            outlineColor="#111111"
            material-transparent={true}
            material-opacity={textOpacity}
            material-depthWrite={false}
            visible={textOpacity.to(o => o > 0.01)}
          >
            {schoolData.name}
          </AnimatedText>

          {/* Connecting Line */}
          <AnimatedLine
            points={linePoints} // Position relative to the Billboard
            color={isSelected ? '#FFFFFF' : '#AAAAAA'}
            lineWidth={1}
            dashed={false}
            transparent={true}
            opacity={textOpacity}
            depthWrite={false}
            visible={textOpacity.to(o => o > 0.01)}
          />
      </Billboard>
    </group>
  );
}
