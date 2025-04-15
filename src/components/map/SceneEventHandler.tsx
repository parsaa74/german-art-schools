'use client'

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useMapStore } from '@/stores/mapStore';
import type { ProcessedUniversity } from '@/stores/schoolStore';

interface SceneEventHandlerProps {
  processedUniversities: ProcessedUniversity[];
  universityMap: Map<string, ProcessedUniversity>;
  nodePositions: Map<string, THREE.Vector3>;
  setHoverUniversityName: (name: string | null) => void;
  setSelectedUniversity: (university: ProcessedUniversity | null) => void;
  selectedUniversity: ProcessedUniversity | null;
  setConnectionLines: (lines: Array<[THREE.Vector3, THREE.Vector3]>) => void;
  controlsEnabled: boolean;
  hoverUniversityName: string | null;
}

export default function SceneEventHandler({
  processedUniversities,
  universityMap,
  nodePositions,
  setHoverUniversityName,
  setSelectedUniversity,
  selectedUniversity,
  setConnectionLines,
  controlsEnabled,
  hoverUniversityName,
}: SceneEventHandlerProps) {
  // Removed console logs
  const { camera, raycaster, pointer, scene } = useThree(); // Use pointer, keep single declaration
  const hoveredRef = useRef<string | null>(null); // Keep single declaration
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for click delay

  // Helper function to perform raycasting against NetworkGraph points
  const getIntersectedSchoolName = (): string | null => {
    if (!controlsEnabled) return null;

    raycaster.setFromCamera(pointer, camera); // Use pointer from useThree
    const pointsObject = scene.getObjectByName("networkNodePoints"); // Target the Points object

    if (pointsObject && pointsObject instanceof THREE.Points) {
      // Intersect the points object directly
      const intersects = raycaster.intersectObject(pointsObject);

      if (intersects.length > 0) {
        const firstIntersect = intersects[0];

        // Access nameMap from geometry userData
        const geometry = pointsObject.geometry as THREE.BufferGeometry;
        const nameMap = geometry?.userData?.nameMap as { [key: number]: string };

        if (firstIntersect.index !== undefined && nameMap && nameMap[firstIntersect.index]) {
          const schoolName = nameMap[firstIntersect.index];
          return schoolName;
        }
      }
    }
    return null;
  };

  // --- Event Handlers using useEffect for window listeners ---
  useEffect(() => {
    const handlePointerMove = () => {
      // console.log("handlePointerMove triggered. controlsEnabled:", controlsEnabled);
      if (!controlsEnabled) {
        if (hoveredRef.current !== null) {
          hoveredRef.current = null;
          setHoverUniversityName(null);
          document.body.style.cursor = 'auto'; // Reset cursor if controls disabled while hovering
        }
        return;
      }

      const schoolName = getIntersectedSchoolName();

      if (schoolName) {
        if (hoveredRef.current !== schoolName) {
          hoveredRef.current = schoolName;
          setHoverUniversityName(schoolName);
          // Play sound only if not already selected
          // if (schoolName !== selectedUniversity?.name) {
          //    playSound('hover');
          // }
          document.body.style.cursor = 'pointer'; // Change cursor
        }
      } else if (hoveredRef.current !== null) {
        hoveredRef.current = null;
        setHoverUniversityName(null);
        document.body.style.cursor = 'auto'; // Reset cursor
      }
    };

    // Add listener
    window.addEventListener('pointermove', handlePointerMove);

    // Cleanup listener
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      // Ensure cursor is reset on unmount if hovering
      if (hoveredRef.current !== null) {
        document.body.style.cursor = 'auto';
      }
    };
    // Dependencies: Ensure handlers re-bind if these change
  }, [controlsEnabled, getIntersectedSchoolName, setHoverUniversityName, selectedUniversity?.name]);


  useEffect(() => {
    const handleClick = () => {
      // console.log("handleClick triggered. controlsEnabled:", controlsEnabled);
      if (!controlsEnabled) return;

      // Clear previous timeout if exists
      if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
      }

      // Set a short delay to distinguish between click and drag
      clickTimeoutRef.current = setTimeout(() => {
          const schoolName = getIntersectedSchoolName(); // Check intersection *after* delay

          if (schoolName) {
              const school = universityMap.get(schoolName);
              if (school) {
                  if (selectedUniversity && selectedUniversity.name === school.name) {
                      // Clicked the already selected node - deselect it
                      setSelectedUniversity(null);
                      setConnectionLines([]); // Clear lines on deselect
                      // playSound('deselect');
                  } else {
                      // Clicked a new node - select it
                      setSelectedUniversity(school);
                      // playSound('select');
                      // Connection line logic is handled in the separate useEffect below
                  }
              }
          } else {
              // Clicked outside any node - deselect if one is selected
              if (selectedUniversity) {
                  setSelectedUniversity(null);
                  setConnectionLines([]);
                  // Optional: sound on background click deselect
                  // playSound('deselect');
              }
          }
          clickTimeoutRef.current = null; // Clear timeout reference
      }, 50); // 50ms delay
    };

    // Add listener
    window.addEventListener('click', handleClick);

    // Cleanup listener
    return () => {
      window.removeEventListener('click', handleClick);
      // Clear timeout on unmount
      if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
      }
    };
    // Dependencies: Ensure handlers re-bind if these change
  }, [controlsEnabled, getIntersectedSchoolName, universityMap, selectedUniversity, setSelectedUniversity, setConnectionLines]);


  // Update connection lines when selection changes
  useEffect(() => {
    if (!selectedUniversity) {
      setConnectionLines([]);
      return;
    }
    
    const selectedPosition = nodePositions.get(selectedUniversity.name);
    if (!selectedPosition) return;
    
    // Find nearby schools (within a certain distance)
    const nearbySchools = processedUniversities
      .filter(uni => uni.name !== selectedUniversity.name)
      .map(uni => {
        const position = nodePositions.get(uni.name);
        return position ? { uni, position } : null;
      })
      .filter(Boolean)
      .filter(item => {
        if (!item) return false;
        const { position } = item;
        return position.distanceTo(selectedPosition) < 5; // Adjust distance as needed
      })
      .map(item => {
        if (!item) return null;
        const { position } = item;
        return [selectedPosition, position] as [THREE.Vector3, THREE.Vector3];
      })
      .filter(Boolean) as Array<[THREE.Vector3, THREE.Vector3]>;

    setConnectionLines(nearbySchools);
  }, [nodePositions, processedUniversities, selectedUniversity, setConnectionLines]); // End of useEffect for connection lines

  // This component does not render anything itself
  return null;
}
