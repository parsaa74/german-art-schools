'use client'

import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree, extend, Object3DNode } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { LineMaterial } from 'three-stdlib';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useFonts } from '@/hooks/useFonts';
import { CreativeTitle, SubText } from '@/components/typography';
import { useSchoolStore } from '@/stores/schoolStore';
import universityData from '@/../public/data/art_programs.json';
import InfoPanel from './InfoPanel';
import VisualizationToggle from './VisualizationToggle';
import type { ProcessedUniversity } from '@/stores/schoolStore';
import { useMapStore } from '@/stores/mapStore';
// import { SchoolNodes } from './SchoolNodes'; // No longer needed here
import { SceneContent } from './SceneContent';

// Dynamic import for NetworkGraph (assuming it's client-side)
const NetworkGraph = dynamic(() => import('./NetworkGraph'), { ssr: false });
// Dynamic import for Background (assuming it's client-side)
const Background = dynamic(() => import('./Background'), { ssr: false });

// Extend R3F at the top level using an alias
extend({ LineMaterialImpl: LineMaterial });

// Augment the R3F namespace to include the extended component
declare module '@react-three/fiber' {
  interface ThreeElements {
    // Define the type for our aliased component
    lineMaterialImpl: Object3DNode<LineMaterial, typeof LineMaterial>;
  }
}

// --- START: Basic Web Audio Setup ---
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
  if (!ctx || ambientSource || !ambientBuffer) return; // Don't play if already playing or buffer not loaded

  ambientSource = ctx.createBufferSource();
  ambientSource.buffer = ambientBuffer;
  ambientSource.loop = true;

  ambientGainNode = ctx.createGain();
  ambientGainNode.gain.value = 0.15; // Low volume

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
    if (!ctx || ambientBuffer) return; // Don't load if already loaded
    try {
        console.log("Loading ambient sound...");
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        ambientBuffer = await ctx.decodeAudioData(arrayBuffer);
        console.log("Ambient sound loaded.");
        await playAmbientSound(); // Attempt to play after loading
    } catch (error) {
        console.error("Error loading ambient sound:", error);
        ambientBuffer = null; // Ensure buffer is null on error
    }
};

const playSound = (type: 'hover' | 'select' | 'deselect') => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  let frequency = 440;
  let duration = 0.05;
  let volume = 0.1;

  switch (type) {
    case 'hover':
      frequency = 1200;
      duration = 0.03;
      volume = 0.05;
      oscillator.type = 'sine';
      break;
    case 'select':
      frequency = 660;
      duration = 0.06;
      volume = 0.1;
      oscillator.type = 'triangle';
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration * 0.9);
      break;
    case 'deselect':
      frequency = 330;
      duration = 0.08;
      volume = 0.08;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      break;
  }

  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (type !== 'select' && type !== 'deselect') { // Apply default envelope if not custom
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};
// --- END: Basic Web Audio Setup ---

// --- START: AnimatedLine Component ---
interface AnimatedLineProps {
    points: [THREE.Vector3, THREE.Vector3];
    startColor?: THREE.Color | string | number;
    endColor?: THREE.Color | string | number;
    lineWidth?: number;
    opacity?: number;
    animationDuration?: number; // Duration in seconds
}

function AnimatedLine({
    points,
    startColor = '#1E90FF', // Keep default colors or make them props
    endColor = '#00FFFF',
    lineWidth = 1.5,
    opacity = 0.7,
    animationDuration = 0.6
}: AnimatedLineProps) {
    const lineRef = useRef<any>(null);
    const materialRef = useRef<LineMaterial>(null);
    const progress = useRef(0);
    const lineLength = useMemo(() => points[0].distanceTo(points[1]), [points]);
    const { size } = useThree();
    const resolutionVec = useMemo(() => new THREE.Vector2(size.width, size.height), [size.width, size.height]);

    useFrame((_state, delta) => {
        if (progress.current < 1 && lineRef.current && materialRef.current) {
            progress.current += delta / animationDuration;
            progress.current = Math.min(progress.current, 1);
            materialRef.current.dashOffset = lineLength * (1 - progress.current);
            materialRef.current.needsUpdate = true;
        }
    });

    useEffect(() => {
        // console.log("Restored AnimatedLine Mounted/Points Changed:", points);
        progress.current = 0;
        if (materialRef.current) {
             materialRef.current.dashOffset = lineLength;
        }
    }, [points, lineLength]);

    return (
        <Line
            ref={lineRef}
            points={points}
            color={"white"}
            lineWidth={lineWidth}
            transparent
            opacity={opacity}
            dashed={true}
            dashSize={lineLength}
            gapSize={lineLength}
        >
            <lineMaterialImpl
                ref={materialRef}
                vertexColors={true}
                linewidth={lineWidth}
                transparent={true}
                opacity={opacity}
                dashed={true}
                dashSize={lineLength}
                gapSize={lineLength}
                dashOffset={lineLength}
                resolution={resolutionVec}
                blending={THREE.AdditiveBlending}
            />
        </Line>
    );
}
// --- END: AnimatedLine Component ---

// Modify ConnectionLines to handle potential lack of points gracefully
function ConnectionLines({ points }: { points: Array<[THREE.Vector3, THREE.Vector3]> }) {
    if (!points || points.length === 0) {
        return null; // Render nothing if no points
    }

    return (
        <group>
            {points.map((pair, i) => (
                <AnimatedLine
                    key={`line-${i}`}
                    points={pair}
                />
            ))}
        </group>
    );
}

function SceneEventHandler({
    processedUniversities,
    universityMap,
    nodePositions,
    setHoverUniversityName,
    setSelectedUniversity,
    selectedUniversity,
    setConnectionLines,
    controlsEnabled,
    hoverUniversityName,
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
        if (!controlsEnabled) return null; // Only check if controls are enabled

        raycaster.setFromCamera(pointer, camera);
        const pointsObject = scene.getObjectByName("networkNodePoints"); // Find the points object by assigned name

        if (pointsObject && pointsObject instanceof THREE.Points && pointsObject.geometry) {
            const geometry = pointsObject.geometry as THREE.BufferGeometry;
            const nameMap = geometry.userData.nameMap as { [key: number]: string }; // Get the name map

            if (!nameMap) {
                // console.warn("SceneEventHandler: nameMap not found on Points geometry userData.");
            return null;
        }

            const positions = geometry.attributes.position as THREE.BufferAttribute;
            const sizes = geometry.attributes.size as THREE.BufferAttribute;
            const threshold = 0.5; // Adjust click/hover threshold as needed

            // Iterate through points to check for intersection manually
            for (let i = 0; i < positions.count; i++) {
                const point = new THREE.Vector3().fromBufferAttribute(positions, i);
                const pointSize = sizes.getX(i);
                const distanceToRay = raycaster.ray.distanceToPoint(point);

                // Check if the ray intersects the 'clickable area' of the point
                // This is a simplified check; more accurate methods might consider screen space size
                if (distanceToRay < pointSize * threshold) {
                    return nameMap[i]; // Return the name associated with the intersected point index
                }
            }
        }
        return null; // No intersection found
    };

    // Handle hover
    useEffect(() => {
        if (!controlsEnabled) return; // Do nothing if controls are off

        const intersectedName = checkIntersection();
        if (intersectedName && intersectedName !== lastHoverRef.current) {
            setHoverUniversityName(intersectedName);
            if (intersectedName !== selectedUniversity?.name) {
                playSound('hover');
             }
            lastHoverRef.current = intersectedName;
            document.body.style.cursor = 'pointer'; // Change cursor on hover
        } else if (!intersectedName && lastHoverRef.current) {
             setHoverUniversityName(null);
            lastHoverRef.current = null;
            document.body.style.cursor = 'auto'; // Reset cursor
        }
    }, [pointer, controlsEnabled, selectedUniversity, setHoverUniversityName, checkIntersection]); // Rerun on pointer move or selection change


    // Handle click
    const handleClick = () => {
        if (!controlsEnabled) return;

        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        clickTimeoutRef.current = setTimeout(() => {
            const intersectedName = checkIntersection();

            if (intersectedName) {
                if (intersectedName === selectedUniversity?.name) {
                    // Clicked the already selected node - deselect it
                    setSelectedUniversity(null);
                    setConnectionLines([]); // Clear lines on deselect
                    playSound('deselect');
                } else {
                    // Clicked a new node - select it
                    const uni = universityMap.get(intersectedName);
                    if (uni) {
                        setSelectedUniversity(uni);
                        playSound('select');
                        // Update connection lines (Example: connect to nearest N neighbors)
                        const selectedPos = nodePositions.get(intersectedName);
                        if (selectedPos) {
                            const neighbors = Array.from(nodePositions.entries())
                                .filter(([name, pos]) => name !== intersectedName)
                                .sort(([, posA], [, posB]) => selectedPos.distanceTo(posA) - selectedPos.distanceTo(posB))
                                .slice(0, 5) // Connect to 5 nearest
                                .map(([name, pos]) => pos);

                            setConnectionLines(neighbors.map(neighborPos => [selectedPos, neighborPos]));
                        } else {
                            setConnectionLines([]);
                        }
                    }
            }
        } else {
                // Clicked outside any node - deselect if one is selected
                if (selectedUniversity) {
                 setSelectedUniversity(null);
                    setConnectionLines([]);
                    // playSound('deselect'); // Optional: sound on background click deselect
                }
            }
            clickTimeoutRef.current = null;
        }, 50); // Short delay to prevent interference with drag
    };

    useEffect(() => {
        window.addEventListener('click', handleClick);
        return () => {
            window.removeEventListener('click', handleClick);
             if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
            }
            document.body.style.cursor = 'auto'; // Ensure cursor reset on unmount
        };
    }, [handleClick, controlsEnabled]); // Re-bind if handleClick or controlsEnabled changes

    return null; // This component doesn't render anything itself
}

// --- START: Scene Component ---
interface SceneProps {
    lang?: string;
    dict?: any; // Dictionary for translations
}

export function Scene({ lang, dict }: SceneProps) {
    const params = useParams();
    const currentLang = lang || (params?.lang as string) || 'en';

    // State for UI elements OUTSIDE the Canvas (e.g., Zustand stores)
    const {
        selectedUniversity,
        setSelectedUniversity,
        // Get filter state and setters from school store
        activeStateFilter,
        setActiveStateFilter,
        activeProgramFilter,
        setActiveProgramFilter,
        uniqueStates,
        uniqueProgramTypes,
        visualizationMode
    } = useSchoolStore();

    const { activePanel, setActivePanel } = useMapStore();

    const [isClient, setIsClient] = useState(false);
    const initializeSchoolStore = useSchoolStore((state) => state.initializeStore); // Get initializer action

    // Client-side check & Store Initialization
    useEffect(() => {
        setIsClient(true);
        // Initialize the store when the component mounts client-side
        initializeSchoolStore();
    }, [initializeSchoolStore]); // Add initializer to dependency array

    // Handlers for UI OUTSIDE the canvas
    const handleClosePanel = () => {
        console.log('handleClosePanel called, clearing selectedUniversity');
        setSelectedUniversity(null);
    };

    // Toggle panel function (defined here as it controls UI outside canvas)
    const togglePanel = (panelId: string) => {
      if (activePanel === panelId) {
        setActivePanel(null);
      } else {
        setActivePanel(panelId);
      }
    };

    // Define handleClickForAudio here if it needs to be attached to the outer div
    const handleClickForAudio = () => {
        console.log("Outer div clicked - potential audio trigger point");
    };

    if (!isClient) {
        return (
             <div className="relative h-screen w-screen bg-gradient-to-br from-[#101820] to-[#18212B] flex items-center justify-center">
                 <p className="text-white text-xl">Loading Scene...</p>
             </div>
        );
    }

    return (
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-[#101820] to-[#18212B] visualization-container" onClick={handleClickForAudio}>
            {/* Skip to content link for accessibility */}
            <a href="#info-panel" className="skip-to-content">Skip to school information</a>
            <Canvas
                gl={{
                    antialias: true,
                    alpha: true,
                    preserveDrawingBuffer: true,
                    powerPreference: 'high-performance'
                }}
                dpr={[1, 2]} // Limit pixel ratio for better performance
                frameloop="demand" // Only render when needed to reduce flickering
                className="absolute inset-0 w-full h-full z-0"
            >
                <SceneContent lang={currentLang} dict={dict} />
            </Canvas>

            {/* UI Elements outside the Canvas */}
            <button
                onClick={() => togglePanel('filter')}
                className="absolute top-4 left-4 z-10 p-2 bg-white/10 backdrop-blur-sm rounded text-white hover:bg-white/20 transition-colors pointer-events-auto"
                aria-label="Toggle Filters"
            >
                Filters
            </button>

            {activePanel === 'filter' && (
                <div className="absolute top-16 left-4 z-10 bg-gray-900/90 backdrop-blur-sm p-4 rounded shadow-lg text-white">
                    <h3 className="font-bold mb-1 text-cyan-300">Filter Options</h3>
                    <div>
                        <label htmlFor="state-filter-scene" className="block text-xs font-medium text-cyan-200 mb-1">State</label>
                         <select
                            id="state-filter-scene"
                            value={activeStateFilter || ''}
                            onChange={(e) => { setActiveStateFilter(e.target.value || null); }}
                            className="w-full bg-gray-900/80 border border-cyan-700/60 text-gray-100 text-sm rounded focus:ring-cyan-500 focus:border-cyan-500 p-1.5 appearance-none custom-select"
                         >
                             <option value="">All States</option>
                             {Array.isArray(uniqueStates) && uniqueStates.map((state: string) => <option key={state} value={state}>{state}</option>)}
                         </select>
                    </div>
                    <div className="mt-2">
                        <label htmlFor="program-filter-scene" className="block text-xs font-medium text-cyan-200 mb-1">Program Type</label>
                        <select
                            id="program-filter-scene"
                            value={activeProgramFilter || ''}
                            onChange={(e) => { setActiveProgramFilter(e.target.value || null); }}
                            className="w-full bg-gray-900/80 border border-cyan-700/60 text-gray-100 text-sm rounded focus:ring-cyan-500 focus:border-cyan-500 p-1.5 appearance-none custom-select"
                        >
                            <option value="">All Programs</option>
                            {Array.isArray(uniqueProgramTypes) && uniqueProgramTypes.map((type: string) => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                </div>
            )}

            {/* Use the InfoPanel component directly with enhanced visibility */}
            {console.log('Scene rendering InfoPanel with:', {
              selectedUniversity,
              isOpen: !!selectedUniversity,
              selectedUniversityName: selectedUniversity?.name,
              selectedUniversityType: selectedUniversity?.type,
              visualizationMode
            })}
            <InfoPanel
                school={selectedUniversity}
                isOpen={!!selectedUniversity}
                onClose={handleClosePanel}
            />

            {/* Add a debug message when a university is selected */}
            {selectedUniversity && (
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[9998] bg-black/50 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm pointer-events-none">
                Selected: {selectedUniversity.name}
              </div>
            )}

            {/* Visualization mode toggle */}
            <VisualizationToggle />
        </div>
    );
}

// Helper component to invalidate frames only when controls are disabled
function FrameInvalidator({ controlsEnabled }: { controlsEnabled: boolean }) {
    const { invalidate } = useThree();
    useEffect(() => {
        if (!controlsEnabled) {
            // Invalidate once when controls get disabled to ensure the frame is rendered
            invalidate();
        }
    }, [controlsEnabled, invalidate]);
    return null;
}
