'use client'

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react'; // Ensure useCallback is imported
import { Canvas, useFrame, useThree, extend, Object3DNode } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { LineMaterial } from 'three-stdlib';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useFonts } from '@/hooks/useFonts';
import { CreativeTitle, SubText } from '@/components/typography';
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore';
import universityData from '@/../public/data/art_programs.json';
import InfoPanel from './InfoPanel';
import VisualizationToggle from './VisualizationToggle';
import type { ProcessedUniversity as ProcessedUniversityType } from '@/stores/schoolStore';
import { useMapStore } from '@/stores/mapStore';
import { SceneContent } from './SceneContent'; // Renders content *inside* the Canvas
import D3NetworkGraph from '@/components/visualization/D3NetworkGraph.fixed'; // Import the 2D graph
import { FiHelpCircle, FiGithub } from 'react-icons/fi'
import { useSpring, animated } from '@react-spring/web'
import { CollapsibleControlPanel } from '@/components/ui/CollapsibleControlPanel';
import { SlidersHorizontal } from 'lucide-react';
import { ViewModeToggle } from './ViewModeToggle'; // Import the new toggle
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence

import { IntroSequence } from './IntroSequence'; // Import the new component
import { DollyController } from '../DollyController'; // Update import path to be relative
import { SearchModal } from '@/components/ui/SearchModal';
import { SearchButton } from '@/components/ui/SearchButton';
import { SearchTooltip } from '@/components/ui/SearchTooltip';
import { RelationshipLegend } from '@/components/ui/relationship-legend';
// import { TypeLegend } from '@/components/ui/type-legend'; // Moved to help modal
import SimpleMusicPlayer from '@/components/ui/SimpleMusicPlayer';

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
    processedUniversities: ProcessedUniversityType[];
    universityMap: Map<string, ProcessedUniversityType>;
    nodePositions: Map<string, THREE.Vector3>;
    setHoverUniversityName: (name: string | null) => void;
    setSelectedUniversity: (university: ProcessedUniversityType | null) => void;
    selectedUniversity: ProcessedUniversityType | null;
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
            lastHoverRef.current = intersectedName;
            document.body.style.cursor = 'pointer';
        } else if (!intersectedName && lastHoverRef.current) {
            setHoverUniversityName(null);
            lastHoverRef.current = null;
            document.body.style.cursor = 'auto';
        }
    }, [pointer, controlsEnabled, setHoverUniversityName, checkIntersection]);

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
                } else {
                    const uni = universityMap.get(intersectedName);
                    if (uni) {
                        setSelectedUniversity(uni);
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

    const {
        processedUniversities,
        selectedUniversity,
        setSelectedUniversity,
        setConnectionLines,
        activeStateFilter,
        setActiveStateFilter,
        activeProgramFilter,
        setActiveProgramFilter,
        activeTypeFilter,
        setActiveTypeFilter,
        activeSemesterFilter,
        setActiveSemesterFilter,
        activeNcFilter,
        setActiveNcFilter,
        uniqueStates,
        uniqueProgramTypes,
        visualizationMode
    } = useSchoolStore();

    const { activePanel, setActivePanel } = useMapStore();
    const [isClient, setIsClient] = useState(false);
    const initializeSchoolStore = useSchoolStore((state) => state.initializeStore);
    const [showHelp, setShowHelp] = useState(false);
    // Intro UI overlay state
    const [showIntroSeq, setShowIntroSeq] = useState(true);
    // Camera animation state
    const [showCameraAnim, setShowCameraAnim] = useState(false);
    // After camera animation, show scene
    const [showScene, setShowScene] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);

    // Handler when the title overlay completes
    const handleOverlayComplete = useCallback(() => {
        console.log("Overlay sequence complete, starting camera animation.");
        setShowIntroSeq(false);
        setShowCameraAnim(true);
    }, []);

    useEffect(() => {
        console.log('Scene states:', { showIntroSeq, showCameraAnim, showScene });
    }, [showIntroSeq, showCameraAnim, showScene]);

    // Client-side check & Store Initialization
    useEffect(() => {
        setIsClient(true);
        initializeSchoolStore();
    }, [initializeSchoolStore]);

    // Remove the automatic timeout that skips the camera animation
    useEffect(() => {
        if (showIntroSeq) {
            // Let the IntroSequence component handle its own completion
            // through the handleOverlayComplete callback
            console.log("Starting intro sequence");
        }
    }, [showIntroSeq]);

    // Clear selection when switching modes after scene loads
    useEffect(() => {
        if (visualizationMode === 'network' && showScene) {
            setSelectedUniversity(null);
            setConnectionLines([]);
        }
    }, [visualizationMode, showScene, setSelectedUniversity, setConnectionLines]);

    // Keyboard shortcuts for search modal and help modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowSearchModal(true);
            }
            // Escape to close modals
            if (e.key === 'Escape') {
                if (showSearchModal) {
                    setShowSearchModal(false);
                } else if (showHelp) {
                    setShowHelp(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSearchModal, showHelp]);

    // Animated button springs (using /web for HTML elements)
    const helpButtonSpring = useSpring({
      scale: showHelp ? 1.2 : 1,
      rotate: showHelp ? 45 : 0,
      config: { tension: 300, friction: 20 }
    })
    const githubButtonSpring = useSpring({
        scale: 1,
        from: { scale: 0 },
        delay: 300,
        config: { mass: 1, tension: 280, friction: 60 }
      })
    const modalSpring = useSpring({
        opacity: showHelp ? 1 : 0,
        transform: showHelp ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
        config: { mass: 1, tension: 280, friction: 30 }
      })

    // Derive unique list of school types for the type filter UI
    const uniqueTypes = useMemo<string[]>(() => {
        if (!processedUniversities?.length) return []
        const typeSet = new Set<string>()
        processedUniversities.forEach((u: ProcessedUniversity) => typeSet.add(u.type))
        return Array.from(typeSet).sort()
      }, [processedUniversities]);

    // Handlers for UI OUTSIDE the canvas
    const handleClosePanel = () => { setSelectedUniversity(null); };
    
    // Define animation variants for the main view cross-fade
    const visVariants = {
        hidden: { opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } },
        visible: { opacity: 1, transition: { duration: 0.6, ease: "easeInOut" } }
    };

    if (!isClient) {
        return (
             <div className="relative h-screen w-screen flex items-center justify-center">
                 <p className="text-white text-xl">Loading Scene...</p>
             </div>
        );
    }

    return (
        <div tabIndex={0} className="relative w-screen h-screen overflow-hidden focus:outline-none">

            {/* Unified 3D Canvas with continuous shader */}
            <div className="absolute inset-0 w-full h-full z-0">
                <Canvas
                    gl={{ 
                        antialias: true, 
                        alpha: true, 
                        powerPreference: 'high-performance',
                        preserveDrawingBuffer: true
                    }}
                    dpr={[1, 1.5]}
                    frameloop="always"
                    className="w-full h-full"
                    camera={{ 
                        position: [0, -50, 150],
                        fov: 45,
                        near: 0.1,
                        far: 1000
                    }}
                    style={{ opacity: 1, transition: 'opacity 1s ease-in-out' }}
                >
                    <Suspense fallback={null}>
                        {/* Animate background when intro sequence is done */}
                        <Background animateTransition={!showIntroSeq} />
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={0.8} />
                        
                        {/* Always render the scene content */}
                        <SceneContent 
                            lang={currentLang} 
                            dict={dict}
                        />
                        
                        {/* Run camera animation over the scene */}
                        {showCameraAnim && (
                            <DollyController
                                onComplete={() => {
                                    console.log("Camera animation complete");
                                    setShowCameraAnim(false);
                                }}
                                targetPosition={new THREE.Vector3(0, 0, 30)}
                                targetLookAt={new THREE.Vector3(0, 0, 0)}
                                lerpAlpha={0.009}
                            />
                        )}
                    </Suspense>
                </Canvas>
            </div>

            {/* Overlay UI: Intro text or main controls */}
            <AnimatePresence mode="wait">
                {showIntroSeq && (
                    <IntroSequence
                        onIntroComplete={() => {
                            console.log("Intro sequence complete, starting transition");
                            
                            // Start camera animation immediately
                            setShowCameraAnim(true);
                            
                            // Delayed removal of intro sequence for cross-fade effect
                            setTimeout(() => {
                                setShowIntroSeq(false);
                            }, 2000); // Longer delay for better dissolve effect
                        }}
                        dict={dict}
                        startAnimations={true}
                    />
                )}
            </AnimatePresence>

            {/* 2D D3 Graph Container - Only visible in d3-force mode after main phase */}
            {visualizationMode === 'd3-force' && (
                <motion.div
                    className="absolute inset-0 w-full h-full"
                    initial="hidden"
                    animate="visible"
                    variants={visVariants}
                    style={{
                        pointerEvents: 'auto',
                        opacity: 1,
                        zIndex: 10 // Higher zIndex to ensure it's on top
                    }}
                >
                    <D3NetworkGraph
                        width={isClient ? window.innerWidth * 0.8 : DEFAULT_WIDTH}
                        height={isClient ? window.innerHeight * 0.8 : DEFAULT_HEIGHT}
                    />
                </motion.div>
            )}

            {/* Search Button - Prominently placed */}
            {!showIntroSeq && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
                    <SearchButton onClick={() => setShowSearchModal(true)} />
                    <SearchTooltip />
                </div>
            )}

            {/* Help & GitHub Icons and Help Modal */}
            <animated.button style={helpButtonSpring} onClick={() => setShowHelp(true)} className="absolute top-4 right-[70px] z-30 flex items-center justify-center w-12 h-12 ui-organic text-white hover:text-white transition-all duration-300" aria-label="Help / Info" > <FiHelpCircle size={20} /> </animated.button>
            <animated.a style={githubButtonSpring} href="https://github.com/parsaa74/german-art-schools" target="_blank" rel="noopener noreferrer" className="absolute top-4 right-[125px] z-30 flex items-center justify-center w-12 h-12 ui-organic text-white hover:text-white transition-all duration-300" aria-label="View Source on GitHub" > <FiGithub size={20} /> </animated.a>
            {showHelp && (
                <div className="fixed inset-0 z-40 flex items-center justify-center">
                   <div className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowHelp(false)}></div>
                   <animated.div
                       style={modalSpring}
                       className="relative max-w-2xl w-full mx-4 overflow-hidden"
                       >
                       <div className="relative ui-organic p-6">
                           {/* Decorative elements */}
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600/0 via-blue-400 to-cyan-400/0"></div>
                           <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-cyan-400/0 via-blue-400 to-blue-600/0"></div>
                           <div className="absolute top-[10%] -left-20 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl"></div>
                           <div className="absolute bottom-[10%] -right-20 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl"></div>

                           <h2 className="font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-200 to-blue-400 text-lg mb-3 text-center">
                               NAVIGATING THE CONSTELLATION
                           </h2>

                           <div className="space-y-2 relative z-10">
                               {/* ... Help content ... */}
                               <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                                 <div className="col-span-1 flex flex-col">
                                   <span className="text-xs uppercase tracking-wider text-blue-300 mb-1">Interaction</span>
                                   <ul className="space-y-1.5 text-sm text-slate-200">
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span><span className="font-medium text-white">Drag:</span> Orbit camera</span>
                                     </li>
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span><span className="font-medium text-white">Scroll:</span> Zoom in/out</span>
                                     </li>
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span><span className="font-medium text-white">Click:</span> Select node</span>
                                     </li>
                                   </ul>
                                 </div>

                                 <div className="col-span-1 flex flex-col">
                                   <span className="text-xs uppercase tracking-wider text-blue-300 mb-1">Node Colors</span>
                                   <ul className="space-y-1.5 text-sm text-slate-200">
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-red-500 rounded-full"></div>
                                       <span><span className="font-medium text-red-400">Art Academy</span></span>
                                     </li>
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-green-500 rounded-full"></div>
                                       <span><span className="font-medium text-green-400">Design School</span></span>
                                     </li>
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-purple-500 rounded-full"></div>
                                       <span><span className="font-medium text-purple-400">Arts University</span></span>
                                     </li>
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-amber-500 rounded-full"></div>
                                       <span><span className="font-medium text-amber-400">Film University</span></span>
                                     </li>
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-blue-500 rounded-full"></div>
                                       <span><span className="font-medium text-blue-400">General</span></span>
                                     </li>
                                   </ul>
                                 </div>

                                 <div className="col-span-1 flex flex-col">
                                   <span className="text-xs uppercase tracking-wider text-blue-300 mb-1">Node Sizes</span>
                                   <ul className="space-y-1.5 text-sm text-slate-200">
                                     <li className="flex items-start">
                                       <div className="w-2 h-2 mt-1 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span><span className="font-medium text-white">Students:</span> More = Larger</span>
                                     </li>
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span><span className="font-medium text-white">Ranking:</span> #1-10 = Largest</span>
                                     </li>
                                     <li className="flex items-start">
                                       <div className="w-1 h-1 mt-2 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span><span className="font-medium text-white">Programs:</span> More = Bigger</span>
                                     </li>
                                   </ul>
                                 </div>

                                 <div className="col-span-1 flex flex-col">
                                   <span className="text-xs uppercase tracking-wider text-blue-300 mb-1">When Node Selected</span>
                                   <ul className="space-y-1.5 text-sm text-slate-200">
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-green-500 rounded-full"></div>
                                       <span><span className="font-medium text-green-400">Green:</span> Very Strong relationship (70%+)</span>
                                     </li>
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-yellow-500 rounded-full"></div>
                                       <span><span className="font-medium text-yellow-400">Yellow:</span> Moderate relationship (30-50%)</span>
                                     </li>
                                     <li className="flex items-start">
                                       <div className="w-1.5 h-1.5 mt-1.5 mr-2 bg-gray-500 rounded-full"></div>
                                       <span><span className="font-medium text-gray-400">Gray:</span> Minimal relationship (&lt; 15%)</span>
                                     </li>
                                   </ul>
                                 </div>

                                 <div className="col-span-3 mt-4 flex flex-col">
                                   <span className="text-xs uppercase tracking-wider text-blue-300 mb-1">UI Elements</span>
                                   <div className="flex flex-wrap gap-x-8 gap-y-2">
                                     <div className="flex items-center">
                                       <div className="w-1.5 h-1.5 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span className="text-sm text-slate-200"><span className="font-medium text-white">Search (Top Center):</span> Find schools, states, programs</span>
                                     </div>
                                     <div className="flex items-center">
                                       <div className="w-1.5 h-1.5 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span className="text-sm text-slate-200"><span className="font-medium text-white">Legends (Bottom):</span> Color coding guides</span>
                                     </div>
                                     <div className="flex items-center">
                                       <div className="w-1.5 h-1.5 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span className="text-sm text-slate-200"><span className="font-medium text-white">Filters (Top Left):</span> Narrow down results</span>
                                     </div>
                                   </div>
                                 </div>

                                 <div className="col-span-3 mt-2 flex flex-col">
                                   <span className="text-xs uppercase tracking-wider text-blue-300 mb-1">Keyboard Shortcuts</span>
                                   <div className="flex flex-wrap gap-x-8 gap-y-2">
                                     <div className="flex items-center">
                                       <div className="w-1.5 h-1.5 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span className="text-sm text-slate-200"><span className="font-medium text-white">Cmd/Ctrl + K:</span> Open search</span>
                                     </div>
                                     <div className="flex items-center">
                                       <div className="w-1.5 h-1.5 mr-2 bg-cyan-400 rounded-full"></div>
                                       <span className="text-sm text-slate-200"><span className="font-medium text-white">Escape:</span> Close modals</span>
                                     </div>
                                   </div>
                                 </div>
                               </div>
                               <animated.button
                                   onClick={() => setShowHelp(false)}
                                   className="mt-6 w-full ui-button-organic text-white font-semibold tracking-wider"
                               >
                                   RETURN TO CONSTELLATION
                               </animated.button>
                           </div>
                       </div>
                   </animated.div>
               </div>
            )}

            {/* Filters panel & ViewModeToggle & InfoPanel (when not intro) */}
            {!showIntroSeq && (
                <>
                    <CollapsibleControlPanel
                        position="top-left"
                        panelTitle="Filters"
                        triggerIcon={<SlidersHorizontal size={18} />}
                    >
                        {/* State Filter */}
                        <div className="mb-1">
                          <label htmlFor="state-filter-scene" className="block text-xs font-medium text-cyan-200 mb-1">State</label>
                          <select
                            id="state-filter-scene"
                            value={activeStateFilter || ''}
                            onChange={(e) => { setActiveStateFilter(e.target.value || null); }}
                            className="w-full bg-gray-800/50 border border-white/20 text-gray-100 text-xs rounded-soft focus:ring-cyan-400/50 focus:border-cyan-400/50 p-2 appearance-none custom-select transition-all duration-300 hover:border-white/30 focus:bg-gray-700/60"
                          >
                            <option value="">All States</option>
                            {uniqueStates.sort().map((state: string) => <option key={state} value={state}>{state}</option>)}
                          </select>
                        </div>
                        {/* Program Filter */}
                        <div className="mb-1">
                          <label htmlFor="program-filter-scene" className="block text-xs font-medium text-cyan-200 mb-1">Program Type</label>
                          <select
                            id="program-filter-scene"
                            value={activeProgramFilter || ''}
                            onChange={(e) => { setActiveProgramFilter(e.target.value || null); }}
                            className="w-full bg-gray-800/50 border border-white/20 text-gray-100 text-xs rounded-soft focus:ring-cyan-400/50 focus:border-cyan-400/50 p-2 appearance-none custom-select transition-all duration-300 hover:border-white/30 focus:bg-gray-700/60"
                          >
                            <option value="">All Programs</option>
                            {uniqueProgramTypes.sort().map((program: string) => <option key={program} value={program}>{program}</option>)}
                          </select>
                        </div>
                        {/* School Type Filter */}
                        <div className="mb-1">
                          <label htmlFor="type-filter-scene" className="block text-xs font-medium text-cyan-200 mb-1">School Type</label>
                          <select
                            id="type-filter-scene"
                            value={activeTypeFilter || ''}
                            onChange={(e) => setActiveTypeFilter(e.target.value || null)}
                            className="w-full bg-gray-800/50 border border-white/20 text-gray-100 text-xs rounded-soft focus:ring-cyan-400/50 focus:border-cyan-400/50 p-2 appearance-none custom-select transition-all duration-300 hover:border-white/30 focus:bg-gray-700/60"
                          >
                            <option value="">All Types</option>
                            {uniqueTypes.map((type: string) => (
                              <option key={type} value={type}>
                                {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Semester Filter */}
                        <div className="mb-1">
                          <label htmlFor="semester-filter-scene" className="block text-xs font-medium text-cyan-200 mb-1">Semester</label>
                          <select
                            id="semester-filter-scene"
                            value={activeSemesterFilter || ''}
                            onChange={(e) => setActiveSemesterFilter(e.target.value || null)}
                            className="w-full bg-gray-800/50 border border-white/20 text-gray-100 text-xs rounded-soft focus:ring-cyan-400/50 focus:border-cyan-400/50 p-2 appearance-none custom-select transition-all duration-300 hover:border-white/30 focus:bg-gray-700/60"
                          >
                            <option value="">All Semesters</option>
                            <option value="winter">Winter</option>
                            <option value="summer">Summer</option>
                          </select>
                        </div>
                        {/* NC-free Filter */}
                        <div className="mb-1">
                          <label htmlFor="nc-filter-scene" className="block text-xs font-medium text-cyan-200 mb-1">NC-free</label>
                          <select
                            id="nc-filter-scene"
                            value={activeNcFilter === null ? '' : (activeNcFilter ? 'yes' : 'no')}
                            onChange={(e) => setActiveNcFilter(e.target.value === '' ? null : e.target.value === 'yes')}
                            className="w-full bg-gray-800/50 border border-white/20 text-gray-100 text-xs rounded-soft focus:ring-cyan-400/50 focus:border-cyan-400/50 p-2 appearance-none custom-select transition-all duration-300 hover:border-white/30 focus:bg-gray-700/60"
                          >
                            <option value="">All</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                    </CollapsibleControlPanel>

                     <ViewModeToggle />

                     {/* Info Panel */}
                     {selectedUniversity && (
                        <InfoPanel
                            school={selectedUniversity}
                            isOpen={!!selectedUniversity}
                            onClose={handleClosePanel}
                        />
                     )}

                     {/* Relationship Legend - Show when a university is selected */}
                     <RelationshipLegend 
                         isVisible={!!selectedUniversity}
                         selectedUniversityName={selectedUniversity?.name || ''}
                     />

                     {/* Type Legend moved to help modal for cleaner UI */}
                </>
            )}

            {/* Search Modal */}
            <SearchModal 
                isOpen={showSearchModal}
                onClose={() => setShowSearchModal(false)}
            />
            
            {/* Music Player */}
            <SimpleMusicPlayer />
        </div>
    );
}

