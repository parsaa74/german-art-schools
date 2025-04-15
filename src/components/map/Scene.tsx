'use client'

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react'; // Ensure useCallback is imported
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
import { SceneContent } from './SceneContent'; // Renders content *inside* the Canvas
import D3NetworkGraph from '@/components/visualization/D3NetworkGraph.fixed'; // Import the 2D graph

// Dynamic import for Background (assuming it's client-side)
const Background = dynamic(() => import('./Background'), { ssr: false });

// Extend R3F at the top level using an alias
extend({ LineMaterialImpl: LineMaterial });

// Augment the R3F namespace to include the extended component
declare module '@react-three/fiber' {
  interface ThreeElements {
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
      frequency = 1200; duration = 0.03; volume = 0.05; oscillator.type = 'sine';
      break;
    case 'select':
      frequency = 660; duration = 0.06; volume = 0.1; oscillator.type = 'triangle';
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration * 0.9);
      break;
    case 'deselect':
      frequency = 330; duration = 0.08; volume = 0.08; oscillator.type = 'square';
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      break;
  }

  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (type !== 'select' && type !== 'deselect') {
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
    startColor = '#1E90FF',
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

    const checkIntersection = useCallback((): string | null => {
        if (!controlsEnabled) return null;

        raycaster.setFromCamera(pointer, camera);
        const pointsObject = scene.getObjectByName("networkNodePoints");

        if (pointsObject && pointsObject instanceof THREE.Points && pointsObject.geometry) {
            const geometry = pointsObject.geometry as THREE.BufferGeometry;
            const nameMap = geometry.userData.nameMap as { [key: number]: string };

            if (!nameMap) return null;

            const positions = geometry.attributes.position as THREE.BufferAttribute;
            const sizes = geometry.attributes.size as THREE.BufferAttribute;
            const threshold = 0.5;

            for (let i = 0; i < positions.count; i++) {
                const point = new THREE.Vector3().fromBufferAttribute(positions, i);
                const pointSize = sizes.getX(i);
                const distanceToRay = raycaster.ray.distanceToPoint(point);
                if (distanceToRay < pointSize * threshold) {
                    return nameMap[i];
                }
            }
        }
        return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [camera, pointer, raycaster, scene, controlsEnabled]); // Dependencies for checkIntersection

    // Handle hover
    useEffect(() => {
        if (!controlsEnabled) return;

        const intersectedName = checkIntersection();
        if (intersectedName && intersectedName !== lastHoverRef.current) {
            setHoverUniversityName(intersectedName);
            if (intersectedName !== selectedUniversity?.name) {
                playSound('hover');
             }
            lastHoverRef.current = intersectedName;
            document.body.style.cursor = 'pointer';
        } else if (!intersectedName && lastHoverRef.current) {
             setHoverUniversityName(null);
            lastHoverRef.current = null;
            document.body.style.cursor = 'auto';
        }
    }, [pointer, controlsEnabled, selectedUniversity, setHoverUniversityName, checkIntersection]);


    // Handle click
    const handleClick = useCallback(() => {
        if (!controlsEnabled) return;

        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        clickTimeoutRef.current = setTimeout(() => {
            const intersectedName = checkIntersection();

            if (intersectedName) {
                if (intersectedName === selectedUniversity?.name) {
                    setSelectedUniversity(null);
                    setConnectionLines([]);
                    playSound('deselect');
                } else {
                    const uni = universityMap.get(intersectedName);
                    if (uni) {
                        setSelectedUniversity(uni);
                        playSound('select');
                        const selectedPos = nodePositions.get(intersectedName);
                        if (selectedPos) {
                            const neighbors = Array.from(nodePositions.entries())
                                .filter(([name, pos]) => name !== intersectedName)
                                .sort(([, posA], [, posB]) => selectedPos.distanceTo(posA) - selectedPos.distanceTo(posB))
                                .slice(0, 5)
                                .map(([name, pos]) => pos);
                            setConnectionLines(neighbors.map(neighborPos => [selectedPos, neighborPos]));
                        } else {
                            setConnectionLines([]);
                        }
                    }
            }
        } else {
                if (selectedUniversity) {
                 setSelectedUniversity(null);
                    setConnectionLines([]);
                }
            }
            clickTimeoutRef.current = null;
        }, 50);
    }, [controlsEnabled, selectedUniversity, setSelectedUniversity, setConnectionLines, universityMap, nodePositions, checkIntersection]);

    useEffect(() => {
        window.addEventListener('click', handleClick);
        return () => {
            window.removeEventListener('click', handleClick);
             if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
            }
            document.body.style.cursor = 'auto';
        };
    }, [handleClick, controlsEnabled]);

    return null;
}

// --- START: Scene Component ---
interface SceneProps {
    lang?: string;
    dict?: any; // Dictionary for translations
}

// Define default dimensions (can be adjusted)
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

export function Scene({ lang, dict }: SceneProps) {
    const params = useParams();
    const currentLang = lang || (params?.lang as string) || 'en';

    // State for UI elements OUTSIDE the Canvas (e.g., Zustand stores)
    const {
        selectedUniversity,
        setSelectedUniversity,
        activeStateFilter,
        setActiveStateFilter,
        activeProgramFilter,
        setActiveProgramFilter,
        uniqueStates,
        uniqueProgramTypes,
        visualizationMode // Get the current visualization mode
    } = useSchoolStore();

    const { activePanel, setActivePanel } = useMapStore();

    const [isClient, setIsClient] = useState(false);
    const initializeSchoolStore = useSchoolStore((state) => state.initializeStore);

    // Client-side check & Store Initialization
    useEffect(() => {
        setIsClient(true);
        initializeSchoolStore();
    }, [initializeSchoolStore]);

    // Handlers for UI OUTSIDE the canvas
    const handleClosePanel = () => {
        console.log('handleClosePanel called, clearing selectedUniversity');
        setSelectedUniversity(null);
    };

    // Toggle panel function
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

            {/* --- Visualization Area (Conditional Rendering) --- */}
            <div className="absolute inset-0 w-full h-full z-0"> {/* Container for visualization */}
                {visualizationMode === 'd3-force' ? (
                    <div className="w-full h-full flex items-center justify-center p-4"> {/* Keep parent background */}
                        {/* Render 2D D3 Graph */}
                        <D3NetworkGraph
                            width={isClient ? window.innerWidth * 0.8 : DEFAULT_WIDTH} // Use window size or default
                            height={isClient ? window.innerHeight * 0.8 : DEFAULT_HEIGHT}
                            className="bg-white rounded-lg shadow-lg" // Style the SVG container
                        />
                    </div>
                ) : (
                    // Render 3D Canvas for 'network' or 'custom-force' modes
                    <Canvas
                        gl={{
                            antialias: true,
                            alpha: true, // Keep alpha as background is handled by parent div
                            preserveDrawingBuffer: true,
                            powerPreference: 'high-performance'
                        }}
                        dpr={[1, 2]}
                        frameloop="demand"
                        className="w-full h-full" // Canvas takes full space of its container
                        key={visualizationMode} // Force re-mount canvas on mode change
                    >
                        <SceneContent lang={currentLang} dict={dict} />
                    </Canvas>
                )}
            </div>

            {/* --- UI Overlays (Positioned above the visualization) --- */}
            {/* Filter Button */}
            <button
                onClick={() => togglePanel('filter')}
                className="absolute top-4 left-4 z-20 p-2 bg-white/10 backdrop-blur-sm rounded text-white hover:bg-white/20 transition-colors pointer-events-auto"
                aria-label="Toggle Filters"
            >
                Filters
            </button>

            {/* Filter Panel */}
            {activePanel === 'filter' && (
                <div className="absolute top-16 left-4 z-20 bg-gray-900/90 backdrop-blur-sm p-4 rounded shadow-lg text-white max-w-xs pointer-events-auto">
                    <h3 className="font-bold mb-2 text-cyan-300">Filter Options</h3>
                    {/* State Filter */}
                    <div className="mb-3">
                        <label htmlFor="state-filter-scene" className="block text-xs font-medium text-cyan-200 mb-1">State</label>
                         <select
                            id="state-filter-scene"
                            value={activeStateFilter || ''}
                            onChange={(e) => { setActiveStateFilter(e.target.value || null); }}
                            className="w-full bg-gray-800/80 border border-cyan-700/60 text-gray-100 text-sm rounded focus:ring-cyan-500 focus:border-cyan-500 p-1.5 appearance-none custom-select"
                         >
                             <option value="">All States</option>
                             {Array.isArray(uniqueStates) && uniqueStates.map((state: string) => <option key={state} value={state}>{state}</option>)}
                         </select>
                    </div>
                    {/* Program Filter */}
                    <div className="mb-3">
                        <label htmlFor="program-filter-scene" className="block text-xs font-medium text-cyan-200 mb-1">Program Type</label>
                        <select
                            id="program-filter-scene"
                            value={activeProgramFilter || ''}
                            onChange={(e) => { setActiveProgramFilter(e.target.value || null); }}
                            className="w-full bg-gray-800/80 border border-cyan-700/60 text-gray-100 text-sm rounded focus:ring-cyan-500 focus:border-cyan-500 p-1.5 appearance-none custom-select"
                        >
                            <option value="">All Programs</option>
                            {Array.isArray(uniqueProgramTypes) && uniqueProgramTypes.map((program: string) => <option key={program} value={program}>{program}</option>)}
                        </select>
                    </div>
                     {/* Visualization Toggle - Moved inside filter panel */}
                     {/* <div className="mt-4 pt-3 border-t border-cyan-700/40">
                         <h4 className="text-xs font-medium text-cyan-200 mb-1.5">View Mode</h4>
                         <VisualizationToggle />
                     </div> */}
                </div>
            )}

            {/* Visualization Toggle - Positioned independently */}
            <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
                <VisualizationToggle />
            </div>

            {/* Info Panel */}
            {selectedUniversity && (
                 <InfoPanel
                    school={selectedUniversity} // Correct prop name: school
                    isOpen={!!selectedUniversity} // Pass boolean based on selection
                    onClose={handleClosePanel}
                    // lang={currentLang} // lang and dict might not be needed if InfoPanel doesn't use them
                    // dict={dict}
                    // className="z-20 pointer-events-auto" // className is handled internally by InfoPanel
                />
            )}
        </div>
    );
}

// Helper component to invalidate frame loop when controls are disabled
function FrameInvalidator({ controlsEnabled }: { controlsEnabled: boolean }) {
    const { invalidate } = useThree();
    useEffect(() => {
        if (!controlsEnabled) {
            // Invalidate a few times after controls are disabled to ensure final render state
            setTimeout(invalidate, 50);
            setTimeout(invalidate, 150);
        }
    }, [controlsEnabled, invalidate]);
    return null;
}
