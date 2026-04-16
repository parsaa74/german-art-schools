import React, { useState, useRef, useMemo } from 'react';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { Sphere, Text, Line, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore';
import { useSpring, animated } from '@react-spring/three';
import { MAP_CONFIG } from '@/lib/geo/index';
import { getFormationPositionForUniversity, calculateUniversityRelationship } from '@/utils/universityRelations';

interface SchoolMarkerProps {
  position: THREE.Vector3;
  schoolData: ProcessedUniversity;
  isHovered: boolean;
  isSelected: boolean;
}

const AnimatedSphere = animated(Sphere);
const AnimatedText = animated(Text);
const AnimatedLine = animated(Line);

// simpleHash function
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// --- Deadline urgency system ---

type DeadlineUrgency = 'urgent' | 'soon' | 'approaching' | 'open' | 'none';

interface DeadlineInfo {
  urgency: DeadlineUrgency;
  daysUntilEnd: number | null; // days until closest deadline ends
  label: string;
}

// Parse deadline date string like "1 March" or "15 April" into a Date for current year
function parseDeadlineDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const months: Record<string, number> = {
    'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
    'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
  };
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const day = parseInt(parts[0]);
  const monthStr = parts[1].toLowerCase();
  const month = months[monthStr];
  if (isNaN(day) || month === undefined) return null;
  const now = new Date();
  const year = now.getFullYear();
  return new Date(year, month, day);
}

// Calculate deadline urgency for a university based on its programs' deadlines
function calculateDeadlineUrgency(schoolData: ProcessedUniversity): DeadlineInfo {
  const programs = schoolData.programs;
  if (!programs || programs.length === 0) {
    return { urgency: 'none', daysUntilEnd: null, label: 'No deadlines' };
  }

  const now = new Date();
  let closestDays: number | null = null;

  for (const program of programs) {
    const deadlines = program.applicationDeadlines;
    if (!deadlines) continue;

    for (const semester of ['winter', 'summer'] as const) {
      const dl = deadlines[semester];
      if (!dl?.end) continue;

      const endDate = parseDeadlineDate(dl.end);
      if (!endDate) continue;

      const diffMs = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Only consider future or current deadlines (and deadlines within application window)
      if (diffDays >= -1) { // allow 1 day grace
        if (closestDays === null || diffDays < closestDays) {
          closestDays = diffDays;
        }
      }
    }
  }

  if (closestDays === null) {
    return { urgency: 'none', daysUntilEnd: null, label: 'No upcoming deadlines' };
  }

  if (closestDays <= 14) {
    return { urgency: 'urgent', daysUntilEnd: closestDays, label: `${closestDays}d left — apply now!` };
  } else if (closestDays <= 30) {
    return { urgency: 'soon', daysUntilEnd: closestDays, label: `${closestDays}d until deadline` };
  } else if (closestDays <= 60) {
    return { urgency: 'approaching', daysUntilEnd: closestDays, label: `${closestDays}d until deadline` };
  } else {
    return { urgency: 'open', daysUntilEnd: closestDays, label: `${closestDays}d until deadline` };
  }
}

// Deadline urgency → color mapping (warm = urgent, cool = calm)
const URGENCY_COLORS: Record<DeadlineUrgency, string> = {
  urgent:      '#EF4444', // red — apply now
  soon:        '#F97316', // orange — deadline approaching
  approaching: '#EAB308', // yellow — application open, time left
  open:        '#22D3EE', // cyan — plenty of time
  none:        '#64748B', // slate — no deadlines
};

// Urgency → ring glow color (slightly lighter/brighter versions)
const URGENCY_RING_COLORS: Record<DeadlineUrgency, string> = {
  urgent:      '#FCA5A5',
  soon:        '#FDBA74',
  approaching: '#FDE047',
  open:        '#67E8F9',
  none:        '#94A3B8',
};

// Calculate node size — simplified, less extreme variance
function calculateNodeSize(schoolData: ProcessedUniversity): number {
  const baseSize = MAP_CONFIG.radius * 0.025;
  let sizeFactor = 1.0;

  if (schoolData.stats?.students) {
    const studentFactor = Math.min(1.6, 0.9 + (Math.sqrt(schoolData.stats.students / 800)));
    sizeFactor *= studentFactor;
  }

  if (schoolData.programs) {
    const programFactor = Math.min(1.2, 1.0 + (schoolData.programs.length / 30));
    sizeFactor *= programFactor;
  }

  return baseSize * sizeFactor;
}

// Color calculation: school type as primary signal, relationship tiers when selected
function calculateNodeColor(
  schoolData: ProcessedUniversity,
  isSelected: boolean,
  isHovered: boolean,
  selectedUniversity: ProcessedUniversity | null | undefined
): string {
  if (isSelected) return '#60A5FA';
  if (isHovered) return '#FFFFFF';

  // When a university is selected, show relationship strength (3 tiers)
  if (selectedUniversity && selectedUniversity.name !== schoolData.name) {
    const score = calculateUniversityRelationship(selectedUniversity, schoolData);
    if (score > 0.5) return '#34D399';      // green — strong match
    if (score > 0.25) return '#FBBF24';     // amber — moderate match
    return '#475569';                        // slate — weak match
  }

  // Default: color by university type
  switch (schoolData.type) {
    case 'art_academy':
    case 'kunsthochschule':
      return '#EF4444'; // Red for art academies
    case 'design_school':
      return '#10B981'; // Green for design schools
    case 'university_of_arts':
      return '#8B5CF6'; // Purple for universities of arts
    case 'film_university':
      return '#F59E0B'; // Amber for film universities
    default:
      return '#3B82F6'; // Blue for general universities
  }
}

// --- Removed getBaseColor function --- 

export function SchoolMarker({ position, schoolData, isHovered, isSelected }: SchoolMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [localHover, setLocalHover] = useState(false);
  const [isCameraFacing, setIsCameraFacing] = useState(false);
  const isCameraFacingRef = useRef(false);

  const { setHoverUniversityName, setSelectedUniversity, controlsEnabled, selectedUniversity, processedUniversities } = useSchoolStore();
  const showHoverEffect = isHovered || localHover;

  const { camera } = useThree();

  // Deadline urgency calculation
  const deadlineInfo = useMemo(() => calculateDeadlineUrgency(schoolData), [schoolData]);

  const nodeSize = useMemo(() => calculateNodeSize(schoolData), [schoolData]);

  const nodeColor = useMemo(() =>
    calculateNodeColor(schoolData, isSelected, showHoverEffect, selectedUniversity),
    [schoolData, isSelected, showHoverEffect, selectedUniversity]
  );

  // Ring properties based on urgency
  const ringColor = URGENCY_RING_COLORS[deadlineInfo.urgency];
  const showRing = deadlineInfo.urgency === 'urgent' || deadlineInfo.urgency === 'soon';
  const ringPulseSpeed = deadlineInfo.urgency === 'urgent' ? 3.0 : 1.5;

  // Formation positioning logic
  const formationPosition = useMemo(() => {
    if (selectedUniversity && selectedUniversity.name !== schoolData.name) {
      const selectedPos = processedUniversities.find(u => u.name === selectedUniversity.name);
      if (selectedPos && selectedPos.location) {
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

  const basePosition = useMemo(() => formationPosition || position.clone(), [formationPosition, position]);
  const randomSeed = useMemo(() => simpleHash(schoolData.id || schoolData.name), [schoolData.id, schoolData.name]);
  const timeOffsetX = useMemo(() => (randomSeed % 1000) / 1000 * Math.PI * 2, [randomSeed]);
  const timeOffsetY = useMemo(() => ((randomSeed * 3) % 1000) / 1000 * Math.PI * 2, [randomSeed]);
  const timeOffsetZ = useMemo(() => ((randomSeed * 7) % 1000) / 1000 * Math.PI * 2, [randomSeed]);
  const speedFactor = useMemo(() => 0.2 + (randomSeed % 500) / 1000 * 0.3, [randomSeed]);
  const amplitude = selectedUniversity ? MAP_CONFIG.radius * 0.003 : MAP_CONFIG.radius * 0.008;

  const showPassiveLabel = isCameraFacing && !showHoverEffect;

  // Spring animations
  const { springScale, color, emissiveColor, glowOpacity, textOpacity, textScale, textSlideY, lineOpacity, formationScale } = useSpring({
    springScale: isSelected ? 1.8 : (showHoverEffect ? 1.5 : 1.0),
    color: nodeColor,
    emissiveColor: isSelected ? '#93C5FD' : (showHoverEffect ? '#FFFFFF' : nodeColor),
    glowOpacity: isSelected ? 0.7 : (showHoverEffect ? 0.6 :
      deadlineInfo.urgency === 'urgent' ? 0.55 :
      deadlineInfo.urgency === 'soon' ? 0.45 : 0.3),
    textOpacity: showPassiveLabel ? 0.75 : 0,
    textScale: showPassiveLabel ? 1 : 0.01,
    textSlideY: showPassiveLabel ? 0 : -(MAP_CONFIG.radius * 0.012),
    lineOpacity: showHoverEffect ? 1 : (showPassiveLabel ? 0.75 : 0),
    formationScale: selectedUniversity && selectedUniversity.name !== schoolData.name ? 0.8 : 1.0,
    config: (key: string) => {
      if (key === 'textScale') return { mass: 0.6, tension: 380, friction: 14 }; // bouncy pop
      if (key === 'textSlideY') return { mass: 0.6, tension: 300, friction: 20 }; // slide up
      return { mass: 1, tension: 200, friction: 25 };
    }
  });

  // Removed uniforms memoization

  // Frame loop for wandering motion, formation transitions, and ring pulse
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const elapsedTime = clock.getElapsedTime() * speedFactor;
      const wanderX = Math.sin(elapsedTime + timeOffsetX) * amplitude;
      const wanderY = Math.cos(elapsedTime + timeOffsetY) * amplitude;
      const wanderZ = Math.sin(elapsedTime + timeOffsetZ) * amplitude * 0.7;

      if (formationPosition && selectedUniversity) {
        const targetX = formationPosition.x + wanderX;
        const targetY = formationPosition.y + wanderY;
        const targetZ = formationPosition.z + wanderZ;
        groupRef.current.position.lerp(
          new THREE.Vector3(targetX, targetY, targetZ),
          0.02
        );
      } else {
        groupRef.current.position.set(
          basePosition.x + wanderX,
          basePosition.y + wanderY,
          basePosition.z + wanderZ
        );
      }
    }

    // Pulse the urgency ring
    if (ringRef.current && showRing) {
      const t = clock.getElapsedTime() * ringPulseSpeed;
      const pulse = 0.3 + Math.sin(t) * 0.3; // oscillate opacity 0.0–0.6
      const scalePulse = 1.0 + Math.sin(t) * 0.15; // subtle scale breath
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
      ringRef.current.scale.setScalar(scalePulse);
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

      // Camera-facing detection: project node to NDC and check if near screen center
      const ndc = worldPosition.clone().project(camera);
      const distFromCenter = Math.sqrt(ndc.x * ndc.x + ndc.y * ndc.y);
      // Near-side check: node must be on the camera-facing hemisphere of the orb.
      // Globe is centered at origin, so dot(nodePos, cameraPos) > 0 means same side.
      const onNearSide = worldPosition.dot(camera.position) > 0;
      const nowFacing = onNearSide && distFromCenter < 0.18 && ndc.z < 1 && !showHoverEffect && !isSelected;
      if (nowFacing !== isCameraFacingRef.current) {
        isCameraFacingRef.current = nowFacing;
        setIsCameraFacing(nowFacing);
      }
    }
  });

  // Text bounds — measured on sync to size background plane
  const [textBounds, setTextBounds] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const textPadX = dynamicFontSize * 0.5;
  const textPadY = dynamicFontSize * 0.3;

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

      {/* Glow Effect Sphere */}
      {(showHoverEffect || isSelected) && (
        <AnimatedSphere
          args={[nodeSize * 1.4, 32, 32]}
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

      {/* Deadline urgency pulsing ring */}
      {showRing && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[nodeSize * 1.6, nodeSize * 2.0, 32]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={0.5}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      <Billboard follow={true}>
        {/* Connecting line — visible on passive + hover */}
        <AnimatedLine
          points={linePoints}
          color={isSelected ? '#FFFFFF' : '#AAAAAA'}
          lineWidth={1}
          dashed={false}
          transparent={true}
          opacity={lineOpacity}
          depthWrite={false}
          visible={lineOpacity.to(o => o > 0.01)}
        />

        {/* Passive camera-facing label (name only) with dark background */}
        <animated.group
          scale={textScale}
          position-y={textSlideY}
          visible={textOpacity.to(o => o > 0.01)}
        >
          {/* Dark background plane */}
          {textBounds.w > 0 && (
            <animated.mesh
              position={[
                textPosition.x,
                textPosition.y + textBounds.h / 2,
                textPosition.z - 0.001,
              ]}
            >
              <planeGeometry args={[textBounds.w + textPadX * 2, textBounds.h + textPadY * 2]} />
              <animated.meshBasicMaterial
                color="#0B1220"
                transparent
                opacity={textOpacity.to(o => o * 0.85)}
                depthWrite={false}
              />
            </animated.mesh>
          )}
          {/* Subtle border — slightly larger plane behind background */}
          {textBounds.w > 0 && (
            <animated.mesh
              position={[
                textPosition.x,
                textPosition.y + textBounds.h / 2,
                textPosition.z - 0.002,
              ]}
            >
              <planeGeometry args={[
                textBounds.w + textPadX * 2 + dynamicFontSize * 0.08,
                textBounds.h + textPadY * 2 + dynamicFontSize * 0.08,
              ]} />
              <animated.meshBasicMaterial
                color={isSelected ? '#60A5FA' : '#334155'}
                transparent
                opacity={textOpacity.to(o => o * 0.9)}
                depthWrite={false}
              />
            </animated.mesh>
          )}
          <AnimatedText
            position={textPosition}
            color={isSelected ? '#FFFFFF' : '#F1F5F9'}
            fontSize={dynamicFontSize}
            anchorY="bottom"
            anchorX="center"
            outlineWidth={dynamicOutlineWidth}
            outlineColor="#000000"
            material-transparent={true}
            material-opacity={textOpacity}
            material-depthWrite={false}
            fontWeight={"bold"}
            onSync={(mesh) => {
              const box = mesh.geometry.boundingBox;
              if (!box) return;
              const w = box.max.x - box.min.x;
              const h = box.max.y - box.min.y;
              if (Math.abs(w - textBounds.w) > 0.0001 || Math.abs(h - textBounds.h) > 0.0001) {
                setTextBounds({ w, h });
              }
            }}
          >
            {schoolData.name}
          </AnimatedText>
        </animated.group>
      </Billboard>
    </group>
  );
}
