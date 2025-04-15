import React, { useState, useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore'; // Import store and type

interface SchoolMarkerProps {
  position: THREE.Vector3;
  schoolData: ProcessedUniversity; // Use the correct type from the store
  isHovered: boolean;
  isSelected: boolean;
}

// Animation helpers
const getGlowOpacity = (isHovered: boolean, isSelected: boolean): number => {
  return isHovered ? 0.7 : isSelected ? 0.6 : 0.5;
};

// Helper to safely update material property
const updateMaterialProperty = <T extends THREE.Material>(
  material: THREE.Material | THREE.Material[] | null,
  property: keyof T,
  value: any
): void => {
  if (!material) return;

  if (Array.isArray(material)) {
    material.forEach(mat => {
      if (mat && property in mat) {
        (mat as any)[property] = value;
      }
    });
  } else if (property in material) {
    (material as any)[property] = value;
  }
};


export function SchoolMarker({ position, schoolData, isHovered, isSelected }: SchoolMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [localHover, setLocalHover] = useState(false);
  const pulsePhase = Math.random() * Math.PI * 2; // Random starting phase

  // Get setters from the store
  const { setHoverUniversityName, setSelectedUniversity, controlsEnabled } = useSchoolStore();

  // Beautiful ethereal blue colors
  const color = useMemo(() => {
    if (isSelected) return new THREE.Color('#4D9EFF'); // Bright ethereal blue for selected
    if (isHovered || localHover) return new THREE.Color('#FFFFFF'); // White for hover
    return new THREE.Color('#2979FF'); // Default ethereal blue
  }, [isSelected, isHovered, localHover]);

  // Emissive color for glow effect
  const emissiveColor = useMemo(() => {
    if (isSelected) return new THREE.Color('#85B8FF'); // Lighter blue glow for selected
    if (isHovered || localHover) return new THREE.Color('#FFFFFF'); // White glow for hover
    return new THREE.Color('#5D9DFF'); // Default ethereal blue glow
  }, [isSelected, isHovered, localHover]);

  const scale = useMemo(() => {
    if (isSelected) return 2.2;
    if (isHovered || localHover) return 1.8;
    return 1.3;
  }, [isSelected, isHovered, localHover]);

  // Use state for animation values instead of directly modifying scale
  const [currentScale, setCurrentScale] = useState(1.0);
  const [glowOpacity, setGlowOpacity] = useState(0.5);

  // Animate using state updates to avoid buffer attribute conflicts
  useFrame(({ clock }) => {
    // Calculate target scale based on hover/selected state
    const targetScale = scale;

    // Smooth scale transition using state
    setCurrentScale(prev => prev + (targetScale - prev) * 0.1);

    // Calculate pulse effect
    const pulseSpeed = isSelected ? 2.0 : 1.0;
    const pulseStrength = isSelected ? 0.08 : 0.04; // Reduced strength to avoid buffer issues
    const pulse = Math.sin(clock.elapsedTime * pulseSpeed + pulsePhase) * pulseStrength + 1.0;

    // Calculate glow opacity
    const targetOpacity = getGlowOpacity(isHovered, isSelected);
    setGlowOpacity(prev => prev + (targetOpacity - prev) * 0.1);

    // Update material properties instead of geometry using our safe helper
    if (meshRef.current) {
      // Update emissive intensity for pulse effect instead of scale
      const emissiveValue = isSelected ? 1.2 * pulse : isHovered ? 1.0 * pulse : 0.8 * pulse;
      updateMaterialProperty<THREE.MeshStandardMaterial>(
        meshRef.current.material,
        'emissiveIntensity',
        emissiveValue
      );
    }

    if (glowRef.current) {
      // Update opacity safely
      updateMaterialProperty<THREE.MeshBasicMaterial>(
        glowRef.current.material,
        'opacity',
        glowOpacity
      );
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    if (!controlsEnabled) return;
    event.stopPropagation(); // Prevent events bubbling up if needed
    setLocalHover(true);
    setHoverUniversityName(schoolData.name); // Update global hover state
    document.body.style.cursor = 'pointer';
    if (!isSelected) { // Play hover sound only if not already selected
        // playSound('hover'); // Uncomment if you have sound logic
    }
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    if (!controlsEnabled) return;
    event.stopPropagation();
    setLocalHover(false);
    // Only clear global hover if this marker was the one being hovered
    if (useSchoolStore.getState().hoverUniversityName === schoolData.name) {
        setHoverUniversityName(null);
    }
    document.body.style.cursor = 'auto';
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (!controlsEnabled) return;
    event.stopPropagation(); // Important to prevent background clicks

    console.log('SchoolMarker clicked:', schoolData.name);

    const currentSelected = useSchoolStore.getState().selectedUniversity;
    if (currentSelected?.name === schoolData.name) {
      console.log('Deselecting university:', schoolData.name);
      setSelectedUniversity(null); // Deselect
    } else {
      console.log('Selecting university:', schoolData.name);
      setSelectedUniversity(schoolData); // Select

      // Verify the store was updated
      setTimeout(() => {
        const selected = useSchoolStore.getState().selectedUniversity;
        console.log('Store selectedUniversity after update:', selected?.name);
      }, 100);
    }
  };

  // Create a beautiful ethereal node with glow effect
  return (
    <group position={position} scale={[currentScale, currentScale, currentScale]}>
      {/* Outer glow sphere */}
      <Sphere
        ref={glowRef}
        args={[0.35, 16, 16]} // Larger radius for glow effect
      >
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          depthWrite={false} // Prevents z-fighting
          blending={THREE.AdditiveBlending} // Creates a glowing effect
        />
      </Sphere>

      {/* Main node sphere */}
      <Sphere
        ref={meshRef}
        args={[0.2, 32, 32]} // Higher detail for main sphere
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <meshStandardMaterial // Using standard material instead of physical to avoid buffer issues
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={isHovered || isSelected ? 1.5 : 1.0}
          transparent
          opacity={0.95}
          roughness={0.2} // More reflective
          metalness={0.3} // Slightly metallic
        />
      </Sphere>

      {/* Inner core glow for extra ethereal effect */}
      <Sphere
        args={[0.1, 16, 16]} // Smaller inner core
      >
        <meshBasicMaterial
          color={new THREE.Color('#FFFFFF')}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false} // Prevents z-fighting and buffer issues
        />
      </Sphere>
    </group>
  );
}
