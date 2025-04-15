'use client'

// Essential imports
import { Suspense, useEffect, useRef, useMemo } from 'react';
import { useThree, extend, Object3DNode } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { LineMaterial } from 'three-stdlib';

// Store imports
import { useSchoolStore } from '@/stores/schoolStore';
import type { ProcessedUniversity } from '@/stores/schoolStore';

// Component imports
import NetworkGraph from './NetworkGraph';
import Background from './Background';
import ConnectionLines from './ConnectionLines';
import CustomForceGraph from './CustomForceGraph';

// Post-processing
import PostProcessing from './PostProcessing';

// Hooks
import { useFonts } from '@/hooks/useFonts';
// Create a local SceneEventHandler component
function SceneEventHandler({
  // We don't use processedUniversities directly
  universityMap,
  nodePositions,
  setHoverUniversityName,
  setSelectedUniversity,
  selectedUniversity,
  setConnectionLines,
  controlsEnabled,
  // We don't use hoverUniversityName directly
}: {
  processedUniversities: ProcessedUniversity[];
  universityMap: Map<string, ProcessedUniversity>;
  nodePositions: Map<string, THREE.Vector3>;
  setHoverUniversityName: (name: string | null) => void;
  setSelectedUniversity: (university: ProcessedUniversity | null) => void;
  selectedUniversity: ProcessedUniversity | null;
  setConnectionLines: (lines: Array<[THREE.Vector3, THREE.Vector3]>) => void;
  controlsEnabled: boolean;
  hoverUniversityName: string | null;
}) {
  const { camera, raycaster, pointer, scene } = useThree();
  const lastHoverRef = useRef<string | null>(null);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkIntersection = (): string | null => {
    if (!controlsEnabled) return null;

    raycaster.setFromCamera(pointer, camera);
    const meshObject = scene.getObjectByName("networkNodes"); // Find the instanced mesh by name

    if (meshObject && meshObject instanceof THREE.InstancedMesh) {
      // Set up for raycasting with instanced mesh
      const tempMatrix = new THREE.Matrix4();
      const tempPosition = new THREE.Vector3();
      const tempScale = new THREE.Vector3();
      const tempQuaternion = new THREE.Quaternion();

      // First try direct raycasting
      const intersects = raycaster.intersectObject(meshObject, false);

      if (intersects.length > 0) {
        // Get the instance index from the intersection
        const instanceId = intersects[0].instanceId;
        if (instanceId !== undefined && instanceId < meshObject.count) {
          // Get the instance matrix to extract position
          meshObject.getMatrixAt(instanceId, tempMatrix);
          tempPosition.setFromMatrixPosition(tempMatrix);

          // Find the university name associated with this position
          for (const [name, position] of nodePositions.entries()) {
            if (position.distanceToSquared(tempPosition) < 0.01) {
              return name;
            }
          }
        }
      }

      // Fallback: manual distance check for each instance
      for (let i = 0; i < meshObject.count; i++) {
        meshObject.getMatrixAt(i, tempMatrix);
        tempPosition.setFromMatrixPosition(tempMatrix);
        tempMatrix.decompose(tempPosition, tempQuaternion, tempScale);

        // Calculate distance from ray to position, accounting for scale
        const distanceToRay = raycaster.ray.distanceToPoint(tempPosition);
        const scaleFactor = Math.max(tempScale.x, tempScale.y, tempScale.z);
        const threshold = 0.5 * scaleFactor; // Adjust threshold based on scale

        if (distanceToRay < threshold) {
          // Find the university name associated with this position
          for (const [name, position] of nodePositions.entries()) {
            if (position.distanceToSquared(tempPosition) < 0.01) {
              return name;
            }
          }
        }
      }
    }
    return null;
  };

  // Handle hover
  useEffect(() => {
    if (!controlsEnabled) return;

    const intersectedName = checkIntersection();
    if (intersectedName && intersectedName !== lastHoverRef.current) {
      setHoverUniversityName(intersectedName);
      if (intersectedName !== selectedUniversity?.name) {
        // Play hover sound
        const ctx = getAudioContext();
        if (ctx) {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.03);
        }
      }
      lastHoverRef.current = intersectedName;
      document.body.style.cursor = 'pointer';
    } else if (!intersectedName && lastHoverRef.current) {
      setHoverUniversityName(null);
      lastHoverRef.current = null;
      document.body.style.cursor = 'auto';
    }
  }, [pointer, controlsEnabled, selectedUniversity, setHoverUniversityName]);

  // Handle click
  const handleClick = () => {
    if (!controlsEnabled) return;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    clickTimeoutRef.current = setTimeout(() => {
      const intersectedName = checkIntersection();

      // Handle node interaction based on intersection result
      handleNodeInteraction(intersectedName);

      // Clear timeout reference
      clickTimeoutRef.current = null;
    }, 50);
  };

  // Handle node interaction based on intersection result
  const handleNodeInteraction = (intersectedName: string | null) => {
    if (intersectedName) {
      // Clicked on a node
      if (intersectedName === selectedUniversity?.name) {
        // Clicked the already selected node - deselect it
        console.log('SceneEventHandler: Deselecting node:', intersectedName);
        setSelectedUniversity(null);
        setConnectionLines([]);
        playDeselectSound();
      } else {
        // Clicked a new node - select it
        console.log('SceneEventHandler: Selecting node:', intersectedName);
        selectNode(intersectedName);
      }
    } else if (selectedUniversity) {
      // Clicked outside any node - deselect if one is selected
      console.log('SceneEventHandler: Clicked outside, deselecting node:', selectedUniversity.name);
      setSelectedUniversity(null);
      setConnectionLines([]);
    }
  };

  // Play deselect sound
  const playDeselectSound = () => {
    const ctx = getAudioContext();
    if (ctx) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(330, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.08);
    }
  };

  // Select a node with enhanced data handling
  const selectNode = (nodeName: string) => {
    const uni = universityMap.get(nodeName);

    if (uni && uni.name && uni.type) {
      // Log the university data for debugging
      console.log("SceneEventHandler: Selected university data:", uni);

      // Ensure the university has all required fields
      const completeUni = {
        ...uni,
        // Provide fallback values for any missing fields
        name: uni.name || nodeName,
        type: uni.type || 'default',
        state: uni.state || 'Unknown',
        city: uni.city || 'Unknown',
        website: uni.website || '#',
        description: uni.description || 'No description available',
        programTypes: uni.programTypes || [],
        founded: uni.founded || 'Unknown',
        students: uni.students || 'Unknown'
      };

      // Set the selected university with complete data
      console.log('SceneEventHandler: Setting selected university to:', completeUni.name);

      // Use setTimeout to ensure the state update is processed
      setTimeout(() => {
        setSelectedUniversity(completeUni);
        console.log('SceneEventHandler: Selected university set to:', completeUni.name);
      }, 10);

      // Play select sound
      playSelectSound();
    } else {
      // Log error for debugging if university data is missing
      console.error("SceneEventHandler: Missing or incomplete university data for:", nodeName);
      console.log("SceneEventHandler: Available data:", uni);

      // Create a minimal university object with the name and required properties
      const fallbackUni: ProcessedUniversity = {
        id: `fallback-${nodeName.replace(/\s+/g, '-').toLowerCase()}`,
        name: nodeName,
        type: 'default',
        state: 'Unknown',
        location: [0, 0], // Dummy location
        programCount: 0,
        website: '#',
        programTypes: [],
        // Optional properties
        city: 'Unknown',
        description: 'Information for this institution is currently unavailable.',
        founded: 'Unknown',
        students: 'Unknown'
      };

      // Set the selected university with fallback data
      console.log('SceneEventHandler: Setting fallback university to:', fallbackUni.name);

      // Use setTimeout to ensure the state update is processed
      setTimeout(() => {
        setSelectedUniversity(fallbackUni);
        console.log('SceneEventHandler: Fallback university set to:', fallbackUni.name);
      }, 10);

      // Play select sound
      playSelectSound();
    }

    // Update connection lines
    updateConnectionLines(nodeName);
  };

  // Play select sound
  const playSelectSound = () => {
    const ctx = getAudioContext();
    if (ctx) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(660, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.06 * 0.9);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.06);
    }
  };

  // Update connection lines
  const updateConnectionLines = (nodeName: string) => {
    const selectedPos = nodePositions.get(nodeName);
    if (selectedPos) {
      const neighbors = Array.from(nodePositions.entries())
        .filter(([name, _]) => name !== nodeName)
        .sort(([, posA], [, posB]) => selectedPos.distanceTo(posA) - selectedPos.distanceTo(posB))
        .slice(0, 5) // Connect to 5 nearest
        .map(([_, pos]) => pos);

      setConnectionLines(neighbors.map(neighborPos => [selectedPos, neighborPos]));
    } else {
      setConnectionLines([]);
    }
  };

  // Add click event listener
  useEffect(() => {
    // Add event listener
    window.addEventListener('click', handleClick);

    // Cleanup function
    return () => {
      window.removeEventListener('click', handleClick);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      document.body.style.cursor = 'auto';
    };
  }, []); // Empty dependency array since handleClick is defined in the component

  return null;
}

// Remove dynamic imports for components we'll handle directly or remove
// const Background = dynamic(() => import('./Background').then(mod => mod.default), { ... });
// const ConnectionLines = dynamic(() => import('./ConnectionLines').then(mod => mod.default), { ... });
// const SceneEventHandler = dynamic(() => import('./SceneEventHandler').then(mod => mod.default), { ... });
// const PostProcessing = dynamic(() => import('./PostProcessing').then(mod => mod.default), { ... });

// Extend R3F with required components (Keep LineMaterial for now)
extend({
  LineMaterialImpl: LineMaterial
});
// Remove duplicate dynamic imports below
// const SceneEventHandler = dynamic(() => import('./SceneEventHandler').then(mod => mod.default), { ... });
// const PostProcessing = dynamic(() => import('./PostProcessing').then(mod => mod.default), { ... });

// Declare module extensions
declare module '@react-three/fiber' {
  interface ThreeElements {
    lineMaterialImpl: Object3DNode<LineMaterial, typeof LineMaterial>;
  }
}

// --- START: Basic Web Audio Setup (Keep if it was in Scene.tsx) ---
let audioContext: AudioContext | null = null;
let ambientSource: AudioBufferSourceNode | null = null;
let ambientBuffer: AudioBuffer | null = null;
let ambientGainNode: GainNode | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window !== 'undefined') {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
  }
  return null;
};

const playAmbientSound = async () => {
  const ctx = getAudioContext();
  if (!ctx || ambientSource || !ambientBuffer) return;

  ambientSource = ctx.createBufferSource();
  ambientSource.buffer = ambientBuffer;
  ambientSource.loop = true;

  ambientGainNode = ctx.createGain();
  ambientGainNode.gain.value = 0.15;

  ambientSource.connect(ambientGainNode);
  ambientGainNode.connect(ctx.destination);

  ambientSource.start(0);
  console.log("Ambient sound started.");
};

const stopAmbientSound = () => {
    if (ambientSource) {
        ambientSource.stop();
        ambientSource.disconnect();
        ambientSource = null;
        console.log("Ambient sound stopped.");
    }
    if (ambientGainNode) {
         ambientGainNode.disconnect();
         ambientGainNode = null;
    }
}

const loadAmbientSound = async (url: string) => {
    const ctx = getAudioContext();
    if (!ctx || ambientBuffer) return;
    try {
        console.log("Loading ambient sound...");
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        ambientBuffer = await ctx.decodeAudioData(arrayBuffer);
        console.log("Ambient sound loaded.");
        await playAmbientSound();
    } catch (error) {
        console.error("Error loading ambient sound:", error);
        ambientBuffer = null;
    }
};

// Sound functions are now implemented directly in the SceneEventHandler
// --- END: Basic Web Audio Setup ---

// Remove AnimatedLine and FrameInvalidator from here if they are defined elsewhere or not needed immediately
// --- START: AnimatedLine Component ---
// ... (Remove or move this definition)
// --- END: AnimatedLine Component ---

// --- START: FrameInvalidator Component (Re-add definition) ---
function FrameInvalidator({ controlsEnabled }: { controlsEnabled: boolean }) {
    const { invalidate } = useThree(); // useThree is safe here

    // Only invalidate when controls are disabled to prevent unnecessary renders
    useEffect(() => {
        if (!controlsEnabled) {
            invalidate();
        }
    }, [controlsEnabled, invalidate]);

    return null;
}
// --- END: FrameInvalidator Component ---

// --- START: SceneContent Component ---
// Props interface should match what Scene passes down
interface SceneContentProps {
    lang: string;
    dict: any;
    // Add any other props passed from Scene if needed
}

export function SceneContent(_props: SceneContentProps) {
    // All hooks (useState, useRef, useMemo, useThree, useFrame, useEffect) are safe here
    const { invalidate } = useThree();
    const controlsRef = useRef<any>();

    // State and Store hooks - use schoolStore instead of mapStore for these properties
    const {
        processedUniversities,
        universityMap,
        selectedUniversity,
        setSelectedUniversity,
        hoverUniversityName,
        setHoverUniversityName,
        connectionLines,
        setConnectionLines,
        controlsEnabled,

        nodePositions,
        setNodePositions,
        activeStateFilter,
        activeProgramFilter,
        visualizationMode,
        setVisualizationMode
    } = useSchoolStore();

    // We don't need mapStore for this component

    // No longer need intro animation state

    // Font loading - keep for now, might be needed for UI later
    useFonts();

    // Audio setup effect - keep for now
    useEffect(() => {
        const attemptAudioSetup = async () => {
            const ctx = getAudioContext();
            if (ctx && ctx.state === 'suspended') {
                console.log("AudioContext suspended. Waiting for user interaction.");
                // Don't load yet, wait for click
            } else if (ctx) {
                console.log("AudioContext running. Loading sound.");
                await loadAmbientSound('/audio/ambient_loop.mp3');
            } else {
                 console.log("AudioContext not available yet.");
            }
        };
        const handleClickForAudio = async () => {
            console.log("User interaction detected (click). Resuming/Starting AudioContext.");
            const ctx = getAudioContext();
            if (ctx && ctx.state === 'suspended') {
                await ctx.resume();
                console.log("AudioContext resumed.");
            }
            // Attempt to load/play sound *after* potential resume
            if (!ambientBuffer) { // Only load if not already loaded
                 await loadAmbientSound('/audio/ambient_loop.mp3');
            } else if (!ambientSource) { // Only play if loaded but not playing
                 await playAmbientSound();
            }
        };
        attemptAudioSetup(); // Try initial setup
        window.addEventListener('click', handleClickForAudio, { once: true }); // Listen for first click
        return () => {
            stopAmbientSound();
            window.removeEventListener('click', handleClickForAudio);
        };
    }, []);

    // Cleanup connection lines effect (can remain here)
    useEffect(() => {
        if (!selectedUniversity) {
            setConnectionLines([]);
        }
    }, [selectedUniversity, setConnectionLines]);

    // Re-introduce filtering logic using useMemo
    const filteredUniversities = useMemo(() => {
        if (!Array.isArray(processedUniversities)) return [];
        return processedUniversities.filter((uni) => {
            if (!uni) return false;
            // State Filter Logic
            const stateMatch = !activeStateFilter || uni.state === activeStateFilter;
            // Program Type Filter Logic (check if programTypes exists and includes the filter)
            const programMatch = !activeProgramFilter ||
                                 (Array.isArray(uni.programTypes) &&
                                  uni.programTypes.some((type: string) => type === activeProgramFilter));
            return stateMatch && programMatch;
        });
    }, [processedUniversities, activeStateFilter, activeProgramFilter]);

    // No need for translation in this component

    // Remove font/audio comments if kept
    // ...

    // Add console log to check filtered data
    useEffect(() => {
        console.log("SceneContent: Filtered Universities Count:", filteredUniversities.length);
        if (filteredUniversities.length > 0) {
            console.log("SceneContent: First filtered university:", filteredUniversities[0]);
        }
    }, [filteredUniversities]);

    return (
        <Suspense fallback={null}>
             {/* Set fixed initial camera position for testing */}
             <PerspectiveCamera makeDefault position={[0, 0, 30]} fov={60} />

            {/* Enhanced Lighting for better visibility */}
            <ambientLight intensity={1.0} />
            <pointLight position={[10, 10, 10]} intensity={1.0} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#5588ff" />
            <directionalLight position={[0, 5, 5]} intensity={0.5} />

            {/* Remove debug sphere now that we've fixed the visibility issues */}

             {/* Remove Grid Helper for production */}

            {/* New Background Component - Restore */}
            <Background />

            {/* Remove Globe component */}
            {/* <Globe radius={MAP_CONFIG.radius} introProgress={1} /> */}

            {/* Remove SchoolNodes component */}
            {/* <SchoolNodes /> */}

            {/* Render visualization based on mode */}
            {filteredUniversities.length > 0 ? (
                visualizationMode === 'd3-force' ? (
                    <CustomForceGraph
                        scale={1.5}
                        position={[0, 0, 0]}
                    />
                ) : (
                    <NetworkGraph
                        universities={filteredUniversities}
                        onLayoutUpdate={setNodePositions}
                        hoverNodeName={hoverUniversityName}
                        selectedNodeName={selectedUniversity?.name || null}
                    />
                )
            ) : (
                <>{/* Render nothing or a placeholder if no universities */}</>
            )}

            {/* Controls - Adjust min/max distance for graph view */}
            <OrbitControls
                ref={controlsRef}
                enablePan={true} // Allow panning for graph exploration
                enableZoom={true}
                enableRotate={true}
                minDistance={1} // Allow very close zoom
                maxDistance={100} // Allow zooming further out
                enabled={controlsEnabled} // Use state from store
                onStart={() => invalidate()}
                onEnd={() => invalidate()}
                onChange={() => invalidate()}
                makeDefault // Make this the default controls to avoid conflicts
                enableDamping={false} // Disable damping to reduce continuous updates
            />

            {/* Remove commented out text */}
            {/* <CreativeTitle ... /> */}
            {/* <SubText ... /> */}

            {/* Connection Lines - Restore */}
            <ConnectionLines points={connectionLines} />

            {/* Event Handler for node interactions */}
            {processedUniversities.length > 0 && (
              <SceneEventHandler
                processedUniversities={filteredUniversities}
                universityMap={universityMap}
                nodePositions={nodePositions}
                setHoverUniversityName={setHoverUniversityName}
                setSelectedUniversity={setSelectedUniversity}
                selectedUniversity={selectedUniversity}
                setConnectionLines={setConnectionLines}
                controlsEnabled={controlsEnabled}
                hoverUniversityName={hoverUniversityName}
              />
            )}

            {/* Frame Invalidator - Keep for performance */}
            <FrameInvalidator controlsEnabled={controlsEnabled} />

            {/* Post Processing - Ensure it's the last component rendered */}
            <PostProcessing />
        </Suspense>
    );
}
// --- END: SceneContent Component ---
// --- END: SceneContent Component ---
