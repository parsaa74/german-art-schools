import React, { useState, useRef, useMemo } from 'react';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { Sphere, Text, Line, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore';
import { useSpring, animated } from '@react-spring/three';
import { MAP_CONFIG } from '@/lib/geo/index';
import { getFormationPositionForUniversity, calculateUniversityRelationship } from '@/utils/universityRelations';

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

// Enhanced function to calculate node size based on university data
function calculateNodeSize(schoolData: ProcessedUniversity): number {
  const baseSize = MAP_CONFIG.radius * 0.025;
  let sizeFactor = 1.0;
  
  // Factor in student count (with diminishing returns)
  if (schoolData.stats?.students) {
    const studentCount = schoolData.stats.students;
    // Normalize to a 0.8-2.0 range based on student count
    // Small universities: 200-500 students → 0.8-1.0
    // Medium universities: 500-1500 students → 1.0-1.4  
    // Large universities: 1500+ students → 1.4-2.0
    const studentFactor = Math.min(2.0, 0.8 + (Math.sqrt(studentCount / 500)));
    sizeFactor *= studentFactor;
  }
  
  // Factor in ranking (higher prestige = larger size)
  if (schoolData.ranking?.national) {
    const ranking = schoolData.ranking.national;
    // Better ranking (lower number) = larger size
    // Top 10: 1.3x, Top 20: 1.2x, Top 30: 1.1x, etc.
    const rankingFactor = Math.max(0.8, 1.5 - (ranking / 30));
    sizeFactor *= rankingFactor;
  }
  
  // Factor in program diversity
  if (schoolData.programs) {
    const programCount = schoolData.programs.length;
    const programFactor = Math.min(1.3, 1.0 + (programCount / 20));
    sizeFactor *= programFactor;
  }
  
  return baseSize * sizeFactor;
}

// Enhanced function to calculate node color based on university characteristics and relationships
function calculateNodeColor(
  schoolData: ProcessedUniversity, 
  isSelected: boolean, 
  isHovered: boolean, 
  selectedUniversity?: ProcessedUniversity | null
): string {
  if (isSelected) return '#60A5FA'; // Light blue for selected
  if (isHovered) return '#FFFFFF'; // White for hovered
  
  // When a university is selected, show relationship colors
  if (selectedUniversity && selectedUniversity.name !== schoolData.name) {
    const relationshipScore = calculateUniversityRelationship(selectedUniversity, schoolData);
    
    // Color coding based on relationship strength
    if (relationshipScore > 0.7) {
      return '#10B981'; // Bright green for very strong relationships
    } else if (relationshipScore > 0.5) {
      return '#84CC16'; // Light green for strong relationships  
    } else if (relationshipScore > 0.3) {
      return '#F59E0B'; // Amber for moderate relationships
    } else if (relationshipScore > 0.15) {
      return '#EF4444'; // Orange-red for weak relationships
    } else {
      return '#6B7280'; // Gray for very weak/no relationships
    }
  }
  
  // Default color by university type when no university is selected
  let baseColor = '#3B82F6'; // Default blue
  
  // Base color by type
  switch (schoolData.type) {
    case 'art_academy':
    case 'kunsthochschule':
      baseColor = '#EF4444'; // Red for art academies
      break;
    case 'design_school':
      baseColor = '#10B981'; // Green for design schools
      break;
    case 'university_of_arts':
      baseColor = '#8B5CF6'; // Purple for universities of arts
      break;
    case 'film_university':
      baseColor = '#F59E0B'; // Amber for film universities
      break;
    default:
      baseColor = '#3B82F6'; // Blue for general universities
  }
  
  // Adjust saturation/brightness based on ranking
  if (schoolData.ranking?.national) {
    const ranking = schoolData.ranking.national;
    if (ranking <= 10) {
      // Top 10: Brighter colors
      baseColor = baseColor.replace(/[0-9A-F]{2}$/, 'DD');
    } else if (ranking <= 25) {
      // Top 25: Standard colors
      // Keep base color
    } else {
      // Lower ranked: Slightly dimmer
      baseColor = baseColor.replace(/[0-9A-F]{2}$/, '99');
    }
  }
  
  return baseColor;
}

// --- Removed getBaseColor function --- 

export function SchoolMarker({ position, schoolData, isHovered, isSelected }: SchoolMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null); 
  // const materialRef = useRef<THREE.ShaderMaterial>(null); // <-- Removed material ref
  const [localHover, setLocalHover] = useState(false);

  const { setHoverUniversityName, setSelectedUniversity, controlsEnabled, selectedUniversity, processedUniversities } = useSchoolStore();
  const showHoverEffect = isHovered || localHover;

  // Access camera from react-three-fiber
  const { camera } = useThree();

  // Enhanced node size calculation
  const nodeSize = useMemo(() => calculateNodeSize(schoolData), [schoolData]);
  
  // Enhanced color calculation with relationship awareness
  const nodeColor = useMemo(() => 
    calculateNodeColor(schoolData, isSelected, showHoverEffect, selectedUniversity), 
    [schoolData, isSelected, showHoverEffect, selectedUniversity]
  );

  // Formation positioning logic
  const formationPosition = useMemo(() => {
    if (selectedUniversity && selectedUniversity.name !== schoolData.name) {
      // Get position for selected university
      const selectedPos = processedUniversities.find(u => u.name === selectedUniversity.name);
      if (selectedPos && selectedPos.location) {
        // Calculate formation position relative to selected university
        const selectedVector = new THREE.Vector3();
        selectedVector.setFromSpherical(new THREE.Spherical(
          MAP_CONFIG.radius,
          Math.PI / 2 - (selectedPos.location[0] * Math.PI / 180),
          selectedPos.location[1] * Math.PI / 180
        ));
        
        return getFormationPositionForUniversity(
          schoolData,
          selectedUniversity,
          selectedVector,
          MAP_CONFIG.radius
        );
      }
    }
    return null;
  }, [selectedUniversity, schoolData, processedUniversities]);

  // Wandering motion setup (remains the same)
  const basePosition = useMemo(() => formationPosition || position.clone(), [formationPosition, position]);
  const randomSeed = useMemo(() => simpleHash(schoolData.id || schoolData.name), [schoolData.id, schoolData.name]);
  const timeOffsetX = useMemo(() => (randomSeed % 1000) / 1000 * Math.PI * 2, [randomSeed]);
  const timeOffsetY = useMemo(() => ((randomSeed * 3) % 1000) / 1000 * Math.PI * 2, [randomSeed]);
  const timeOffsetZ = useMemo(() => ((randomSeed * 7) % 1000) / 1000 * Math.PI * 2, [randomSeed]);
  const speedFactor = useMemo(() => 0.2 + (randomSeed % 500) / 1000 * 0.3, [randomSeed]); 
  const amplitude = selectedUniversity ? MAP_CONFIG.radius * 0.003 : MAP_CONFIG.radius * 0.008; // Reduce wandering when in formation 

  // react-spring animations - Enhanced with data-driven colors and formation transitions
  const { springScale, color, emissiveColor, glowOpacity, textOpacity, formationScale } = useSpring({
    springScale: isSelected ? 1.8 : (showHoverEffect ? 1.5 : 1.0),
    // Use calculated colors
    color: nodeColor,
    // Enhanced emissive colors that respect relationship coloring
    emissiveColor: isSelected ? '#93C5FD' : (showHoverEffect ? '#FFFFFF' : 
      selectedUniversity && selectedUniversity.name !== schoolData.name ? nodeColor : nodeColor),
    glowOpacity: isSelected ? 0.7 : (showHoverEffect ? 0.6 : 
      selectedUniversity && selectedUniversity.name !== schoolData.name ? 0.5 : 0.35),
    textOpacity: showHoverEffect ? 1 : 0,
    // Formation mode visual changes
    formationScale: selectedUniversity && selectedUniversity.name !== schoolData.name ? 0.8 : 1.0,
    config: { mass: 1, tension: 200, friction: 25 } // Smoother transitions for formation
  });

  // Removed uniforms memoization

  // Frame loop for wandering motion and formation transitions
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const elapsedTime = clock.getElapsedTime() * speedFactor;
      const wanderX = Math.sin(elapsedTime + timeOffsetX) * amplitude;
      const wanderY = Math.cos(elapsedTime + timeOffsetY) * amplitude;
      const wanderZ = Math.sin(elapsedTime + timeOffsetZ) * amplitude * 0.7; 
      
      // Smooth transition to formation position
      if (formationPosition && selectedUniversity) {
        // Lerp towards formation position with slight wandering
        const targetX = formationPosition.x + wanderX;
        const targetY = formationPosition.y + wanderY;
        const targetZ = formationPosition.z + wanderZ;
        
        groupRef.current.position.lerp(
          new THREE.Vector3(targetX, targetY, targetZ),
          0.02 // Smooth transition speed
        );
      } else {
        // Normal wandering around base position
        groupRef.current.position.set(
          basePosition.x + wanderX,
          basePosition.y + wanderY,
          basePosition.z + wanderZ
        );
      }
    }
  });

  // Event handlers (remain the same)
  const handlePointerOver = (event: ThreeEvent<globalThis.PointerEvent>) => { 
    if (!controlsEnabled || isSelected) return;
    event.stopPropagation();
    setLocalHover(true);
    if (!isSelected) {
        setHoverUniversityName(schoolData.name);
    }
    if (typeof globalThis.document !== 'undefined') globalThis.document.body.style.cursor = 'pointer';
   };
  const handlePointerOut = (event: ThreeEvent<globalThis.PointerEvent>) => { 
    if (!controlsEnabled) return;
    event.stopPropagation();
    setLocalHover(false);
    if (
        useSchoolStore.getState().hoverUniversityName === schoolData.name &&
        !isSelected
    ) {
      setHoverUniversityName(null);
    }
    if (typeof globalThis.document !== 'undefined') globalThis.document.body.style.cursor = 'auto';
   };
  const handleClick = (event: ThreeEvent<globalThis.MouseEvent>) => { 
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

  // --- Dynamic font size based on camera distance ---
  const [dynamicFontSize, setDynamicFontSize] = useState(MAP_CONFIG.radius * 0.018);
  const [dynamicOutlineWidth, setDynamicOutlineWidth] = useState(0.001);

  useFrame(() => {
    if (groupRef.current) {
      // Get world position of the label
      const worldPosition = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPosition);
      const labelWorldPosition = worldPosition.clone().add(textPosition);
      // Compute distance from camera to label
      const distance = camera.position.distanceTo(labelWorldPosition);
      // Reference distance (tweak as needed for your scene scale)
      const referenceDistance = MAP_CONFIG.radius * 0.5;
      // Font size increases as you zoom out (move camera away)
      const baseSize = MAP_CONFIG.radius * 0.018;
      const minSize = baseSize * 0.8;
      const maxSize = baseSize * 3.5;
      const newFontSize = Math.max(minSize, Math.min(maxSize, baseSize * (distance / referenceDistance)));
      setDynamicFontSize(newFontSize);
      // Outline width can also scale with font size for boldness
      setDynamicOutlineWidth(0.001 + 0.002 * (newFontSize / baseSize));
    }
  });

  // Enhanced text content with university info and relationship data
  const enhancedText = useMemo(() => {
    let text = schoolData.name;
    
    // Show relationship strength when a university is selected
    if (showHoverEffect && selectedUniversity && selectedUniversity.name !== schoolData.name) {
      const relationshipScore = calculateUniversityRelationship(selectedUniversity, schoolData);
      const relationshipStrength = 
        relationshipScore > 0.7 ? 'Very Strong' :
        relationshipScore > 0.5 ? 'Strong' :
        relationshipScore > 0.3 ? 'Moderate' :
        relationshipScore > 0.15 ? 'Weak' : 'Minimal';
      text += `\nRelationship: ${relationshipStrength}`;
      text += `\nScore: ${(relationshipScore * 100).toFixed(0)}%`;
    }
    
    // Show regular university info when no selection or when this is the selected university
    if (showHoverEffect && (!selectedUniversity || selectedUniversity.name === schoolData.name)) {
      if (schoolData.stats?.students) {
        text += `\n${schoolData.stats.students} students`;
      }
      if (schoolData.ranking?.national) {
        text += `\n#${schoolData.ranking.national} nationally`;
      }
    }
    
    return text;
  }, [schoolData, showHoverEffect, selectedUniversity]);

  // Render
  return (
    <group ref={groupRef} position={basePosition}> 
      <AnimatedSphere
        ref={meshRef}
        args={[nodeSize, 32, 32]} // Use calculated size
        scale={springScale.to(s => s * formationScale.get())} 
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* Enhanced animated standard material */}
        <animated.meshStandardMaterial
          color={color} 
          emissive={emissiveColor} 
          emissiveIntensity={1.5}
          metalness={0.1}
          roughness={0.4}
          transparent
          opacity={isSelected ? 1.0 : (showHoverEffect ? 0.95 : 0.85)}
        />
      </AnimatedSphere>

      {/* Enhanced Glow Effect Sphere */}
      {(showHoverEffect || isSelected) && (
        <AnimatedSphere
          args={[nodeSize * 1.4, 32, 32]} // Scale glow with calculated size
          scale={springScale.to(s => s * formationScale.get())}
          visible={glowOpacity.to(o => o > 0.01)}
        >
          <animated.meshBasicMaterial
            color={emissiveColor}
            transparent
            opacity={glowOpacity}
            depthWrite={false} 
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </AnimatedSphere>
      )}

      {/* Billboard to make text face camera */}
      <Billboard
        follow={true}
      >
          {/* Enhanced Hover Text with university info */}
          <AnimatedText
            position={textPosition}
            color={isSelected ? '#FFFFFF' : '#E0E0E0'}
            fontSize={dynamicFontSize}
            anchorY="bottom"
            anchorX="center"
            outlineWidth={dynamicOutlineWidth}
            outlineColor="#111111"
            material-transparent={true}
            material-opacity={textOpacity}
            material-depthWrite={false}
            visible={textOpacity.to(o => o > 0.01)}
            fontWeight={"bold"}
          >
            {enhancedText}
          </AnimatedText>

          {/* Connecting Line */}
          <AnimatedLine
            points={linePoints}
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
