'use client'

// Essential imports
import { Suspense, useEffect, useRef, useMemo, useState } from 'react';
import { useThree, extend, Object3DNode } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, MapControls, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { LineMaterial } from 'three-stdlib';

// Store imports
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore';
import Globe from './Globe';
import { SchoolMarker } from './SchoolMarker';
// import ConnectionLines from './ConnectionLines'; // <-- Keep commented or remove entirely
// import Background from './Background'; // Remove as it's now in the parent Scene

// Component imports
// import NetworkGraph from './NetworkGraph'; // Remove old graph
import { SchoolNodes } from './SchoolNodes'; // (legacy 3D network — replaced by GlassWall)
import { GlassWall } from './GlassWall';
import { ProgramSatellites } from './ProgramSatellites';
import CustomForceGraph from './CustomForceGraph';
// import SceneEffects from './SceneEffects';

// Post-processing
import PostProcessing from './PostProcessing';

// Atmosphere (moody env, fog, rain, lightning + weather/intent driver)
import { Atmosphere } from './atmosphere/Atmosphere';

// Remove the entire SceneEventHandler component definition (lines ~25 to ~348)
// function SceneEventHandler(...) { ... }

// Frame invalidator — no-op; react-three-fiber handles invalidation via frameloop="demand"
function FrameInvalidator(_props: { controlsEnabled: boolean }) {
    return null;
}

interface SceneContentProps {
    lang: string;
    dict: any;
    // Add any other props passed from Scene if needed
}

export function SceneContent(_props: SceneContentProps) {
  // Access state and actions from Zustand store
    const {
        processedUniversities,
        universityMap,
    nodePositions,
    setHoverUniversityName,
    setSelectedUniversity,
        selectedUniversity,
        setConnectionLines,
        controlsEnabled,
    hoverUniversityName, // Keep hover/selected state for ConnectionLines
    cameraPosition,
    cameraTarget,
    visualizationMode, // Get the current mode
    initializeStore, // Get initializer
    isLoading, // Get loading state
    } = useSchoolStore();

  const controlsRef = useRef<any>();
  const { gl, camera } = useThree(); // Get gl renderer for pixel ratio

  // Initial data fetch
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);



  // Update OrbitControls target
    useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...cameraTarget);
      controlsRef.current.update();
    }
  }, [cameraTarget]);

  // Camera setup
    useEffect(() => {
    camera.position.set(...cameraPosition);
    camera.lookAt(...cameraTarget);
  }, [camera, cameraPosition, cameraTarget]);

  if (isLoading) {
    // Optional: Render a loading state if needed
    return null; // Or <LoadingSpinner />
  }

    return (
    <Suspense fallback={null}> {/* Or a specific loading component */}
      <PerspectiveCamera
        makeDefault
        position={cameraPosition}
        fov={50}
        near={0.1}
        far={1000}
      />
      {/* Locked frontal view of the glass wall — no orbit/pan, only a little zoom */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        enableRotate={false}
        enablePan={false}
        minDistance={12}
        maxDistance={24}
        enableZoom={!isLoading && controlsEnabled}
        enabled={controlsEnabled}
        target={new THREE.Vector3(...cameraTarget)}
        zoomSpeed={0.6}
        makeDefault
      />

      {/* Remove Background component since it's already in the parent Scene */}
      {/* <Background /> */}

      {/* Frontal glass wall — the schools as one window that breaks as you filter */}
      {visualizationMode === 'network' && (
        <GlassWall />
      )}

      {/* Moody environment + weather (replaces the old studio Environment) */}
      <Atmosphere />

      {/* Post-processing effects */}
      <PostProcessing />

      {/* Invalidator based on controls */}
      <FrameInvalidator controlsEnabled={controlsEnabled} />

      {/* University Markers */}
      <group name="markersGroup">
        {/* {nodePositions.size > 0 && universityMap.size > 0 && (
          <SchoolMarker
            university={selectedUniversity}
            position={nodePositions.get(selectedUniversity)}
          />
        )} */}
      </group>

    </Suspense>
    );
}

// Extend LineMaterial for use in JSX (if still needed by ConnectionLines or elsewhere)
extend({ LineMaterialImpl: LineMaterial });

// Add declaration for audio context on window (if not already globally typed)
declare global {
  interface Window {
    audioContextInstance?: AudioContext;
    webkitAudioContext?: typeof AudioContext;
  }
}
