import React, { useState, useEffect, useMemo } from 'react'; // Removed useRef, useFrame, useThree, ThreeEvent
import * as THREE from 'three';
import { latLngToVector3, MAP_CONFIG } from '@/lib/geo/index';
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore'; // Import store and ProcessedUniversity
import { SchoolMarker } from './SchoolMarker'; // Import the new marker component

// Removed the commented-out shader code block entirely

// Keep interface definitions if needed elsewhere, or simplify if only used here
interface Coordinates { lat: number; lng: number; }
// Use ProcessedUniversity type directly from store if possible
// interface UniversityData { ... }
// interface SchoolNodeData { name: string; position: THREE.Vector3; data: UniversityData; } // Use ProcessedUniversity

export function SchoolNodes() {
  // Remove refs for points, geometry, material
  // const pointsRef = useRef<THREE.Points>(null);
  // const geometryRef = useRef<THREE.BufferGeometry>(null);
  // const materialRef = useRef<THREE.ShaderMaterial>(null);
  // Remove useThree() hook if not used elsewhere in this component
  // const { camera, raycaster, mouse } = useThree();

  // Get state and setters from the store
  const {
    processedUniversities, // Get the already processed data
    nodePositions,         // Get the map of Vector3 positions
    setNodePositions,      // Keep this if needed for other components (like ConnectionLines)
    hoverUniversityName,   // Needed to pass down to marker
    selectedUniversity,    // Needed to pass down to marker
    activeStateFilter, activeProgramFilter,
    universityMap, // Needed for potential lookups if not using processedUniversities directly
    // Remove setters if interactions are fully handled by Marker
    // setHoverUniversityName,
    // setSelectedUniversity,
    // controlsEnabled // Marker reads this directly from store
  } = useSchoolStore();

  // State for locally processed/filtered data if needed, or derive directly
  // const [nodeData, setNodeData] = useState<SchoolNodeData[]>([]);
  // Remove nameMap state
  // const [nameMap, setNameMap] = useState<{ [key: number]: string }>({});

  // Remove redundant data fetching useEffect - Store handles initialization
  /*
  useEffect(() => {
    // ... removed fetch logic ...
  }, [setNodePositions]);
  */

  // Filter the universities based on store state
  const filteredUniversities = useMemo(() => {
    if (!Array.isArray(processedUniversities)) return [];
    return processedUniversities.filter((uni) => {
      // Filter based on properties available in ProcessedUniversity
      if (!uni) return false;
      // Check if position exists in the nodePositions map for this uni
      const positionExists = nodePositions.has(uni.name);
      if (!positionExists) return false; // Don't include if no calculated position

      const stateMatch = !activeStateFilter || uni.state === activeStateFilter;
      const programMatch = !activeProgramFilter ||
                           (Array.isArray(uni.programTypes) &&
                            uni.programTypes.some((type: string) => type === activeProgramFilter));
      return stateMatch && programMatch;
    });
  }, [processedUniversities, activeStateFilter, activeProgramFilter]);


  // Remove buffer attribute update logic
  /*
  useEffect(() => {
    // ... removed ...
  }, [nodeData, hoverUniversityName, selectedUniversity, activeStateFilter, activeProgramFilter]);
  */

  // Remove uniforms
  // const uniforms = useMemo(() => ({}), []);

  // Remove Event Handlers - Logic moved to SchoolMarker
  /*
  const handlePointerMove = ...
  const handlePointerOut = ...
  const handleClick = ...
  */
  // --- End Event Handlers ---

  // Render a group containing SchoolMarker components
  return (
    <group name="schoolNodesGroup">
      {filteredUniversities.map((uni) => {
        // Get the position from the map
        const position = nodePositions.get(uni.name);
        // Render marker only if position exists
        return position ? (
          <SchoolMarker
            key={uni.name}
            position={position} // Pass the Vector3 position from the map
            schoolData={uni}     // Pass the full university data object
            isHovered={hoverUniversityName === uni.name}
            isSelected={selectedUniversity?.name === uni.name}
          />
        ) : null; // Don't render if position is missing for some reason
      })}
    </group>
  );
}
