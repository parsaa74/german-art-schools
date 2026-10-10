'use client'

import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react'; // Ensure useCallback is imported
import { Canvas, useFrame, useThree, extend, Object3DNode } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { LineMaterial } from 'three-stdlib';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { useParams } from 'next/navigation';
import { useSchoolStore } from '@/stores/schoolStore';
import { shallow } from 'zustand/shallow';
import InfoPanel from './InfoPanel';
import type { ProcessedUniversity as ProcessedUniversityType } from '@/stores/schoolStore';
import { useMapStore } from '@/stores/mapStore';
import { SceneContent } from './SceneContent'; // Renders content *inside* the Canvas
import D3NetworkGraph from '@/components/visualization/D3NetworkGraph.fixed'; // Import the 2D graph
import { FiHelpCircle, FiGithub } from 'react-icons/fi'
import { useSpring, animated } from '@react-spring/web'
import { CollapsibleControlPanel } from '@/components/ui/CollapsibleControlPanel';
import { FilterWizard } from '@/components/ui/FilterWizard';
import { SlidersHorizontal } from 'lucide-react';
import { ViewModeToggle } from './ViewModeToggle'; // Import the new toggle
import { ProgramInfoPanel } from './ProgramInfoPanel';
import { motion } from 'framer-motion';

import { IntroSequence } from './IntroSequence'; // Import the new component
import { SearchModal } from '@/components/ui/SearchModal';
import { SearchButton } from '@/components/ui/SearchButton';
import { Shortlist } from '@/components/ui/Shortlist';
import { FilterControls } from '@/components/ui/FilterControls';
import { SCHOOL_TYPES } from '@/lib/taxonomy';
import { ATMO } from './atmosphere/config';
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
    _startColor?: THREE.Color | string | number;
    _endColor?: THREE.Color | string | number;
    lineWidth?: number;
    opacity?: number;
    animationDuration?: number; // Duration in seconds
}

function AnimatedLine({
    points,
    _startColor = '#1E90FF',
    _endColor = '#00FFFF',
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
    _processedUniversities,
    universityMap,
    nodePositions,
    setHoverUniversityName,
    setSelectedUniversity,
    selectedUniversity,
    setConnectionLines,
    controlsEnabled,
    hoverUniversityName,
}: {
    _processedUniversities: ProcessedUniversityType[];
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

function HelpBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs uppercase tracking-wider text-cyan-300 mb-1.5">{title}</h3>
            <ul className="space-y-1.5 leading-snug">{children}</ul>
        </div>
    );
}

// --- START: Scene Component ---
interface SceneProps {
    lang?: string;
    dict?: any; // Dictionary for translations
}

// Define default dimensions (can be adjusted)
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

// Reports once the canvas has actually rendered a few frames (shaders compiled,
// first paint done) — the intro veil lifts when the scene is real, not on a timer.
function ReadyPing({ onReady }: { onReady: () => void }) {
    const frames = useRef(0);
    useFrame(() => {
        if (frames.current < 3 && ++frames.current === 3) onReady();
    });
    return null;
}

export function Scene({ lang, dict }: SceneProps) {
    const params = useParams();
    const currentLang = lang || (params?.lang as string) || 'en';

    const {
        processedUniversities,
        selectedUniversity,
        setSelectedUniversity,
        setConnectionLines,
        activeStateFilter,
        activeProgramFilter,
        activeTypeFilter,
        activeSemesterFilter,
        activeNcFilter,
        activeApplicationMethodFilter,
        activeCourseLanguageFilter,
        activeDegreeFilter,
        visualizationMode,
        searchQuery,
    } = useSchoolStore((st) => ({
        processedUniversities: st.processedUniversities,
        selectedUniversity: st.selectedUniversity,
        setSelectedUniversity: st.setSelectedUniversity,
        setConnectionLines: st.setConnectionLines,
        activeStateFilter: st.activeStateFilter,
        activeProgramFilter: st.activeProgramFilter,
        activeTypeFilter: st.activeTypeFilter,
        activeSemesterFilter: st.activeSemesterFilter,
        activeNcFilter: st.activeNcFilter,
        activeApplicationMethodFilter: st.activeApplicationMethodFilter,
        activeCourseLanguageFilter: st.activeCourseLanguageFilter,
        activeDegreeFilter: st.activeDegreeFilter,
        visualizationMode: st.visualizationMode,
        searchQuery: st.searchQuery,
    }), shallow);

    const { activePanel, setActivePanel, wizardOpen } = useMapStore();
    const [isClient, setIsClient] = useState(false);
    const initializeSchoolStore = useSchoolStore((state) => state.initializeStore);
    const [showHelp, setShowHelp] = useState(false);
    // Intro veil state: stays up until the canvas has rendered real frames, the
    // data is in, and a short minimum has passed (so it never just blinks).
    const [showIntroSeq, setShowIntroSeq] = useState(true);
    const [sceneReady, setSceneReady] = useState(false);
    const [introMinDone, setIntroMinDone] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [canvasKey, setCanvasKey] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setIntroMinDone(true), 1400);
        return () => clearTimeout(t);
    }, []);

    const handleSceneReady = useCallback(() => setSceneReady(true), []);
    const introLeaving = sceneReady && introMinDone && processedUniversities.length > 0;

    // Handler when the veil has finished fading out
    const handleOverlayComplete = useCallback(() => {
        setShowIntroSeq(false);
    }, []);

    // Client-side check & Store Initialization
    useEffect(() => {
        setIsClient(true);
        initializeSchoolStore();
    }, [initializeSchoolStore]);


    // Clear selection when switching modes
    useEffect(() => {
        if (visualizationMode === 'network') {
            setSelectedUniversity(null);
            setConnectionLines([]);
        }
    }, [visualizationMode, setSelectedUniversity, setConnectionLines]);

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


    // Closing a school only deselects it — the user's filters stay put, so they
    // can step through the schools of a filtered set one by one.
    const handleClosePanel = useCallback(() => {
        setSelectedUniversity(null);
        setConnectionLines([]);
    }, [setSelectedUniversity, setConnectionLines]);

    const anyFilter = !!(activeStateFilter || activeProgramFilter || activeTypeFilter || activeSemesterFilter ||
        activeNcFilter !== null || activeApplicationMethodFilter || activeCourseLanguageFilter || activeDegreeFilter || searchQuery);
    // First-visit caption: says what the wall is until the user starts exploring.
    const [explored, setExplored] = useState(false);
    useEffect(() => {
        if (selectedUniversity || anyFilter || wizardOpen || activePanel) setExplored(true);
    }, [selectedUniversity, anyFilter, wizardOpen, activePanel]);

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
                    key={canvasKey}
                    gl={{
                        antialias: false,
                        alpha: true,
                        powerPreference: 'default',
                        failIfMajorPerformanceCaveat: false,
                        stencil: false,
                        depth: true,
                    }}
                    dpr={1}
                    resize={{ debounce: 200, scroll: false }}
                    frameloop="always"
                    className="w-full h-full"
                    camera={{
                        position: [0, 0, 30],
                        fov: 45,
                        near: 0.1,
                        far: 1000
                    }}
                    style={{ opacity: 1, transition: 'opacity 1s ease-in-out' }}
                    onCreated={({ gl }) => {
                        const canvas = gl.domElement;
                        const onLost = (e: Event) => {
                            e.preventDefault();
                            console.warn('[WebGL] context lost — remounting');
                            setTimeout(() => setCanvasKey((k) => k + 1), 300);
                        };
                        canvas.addEventListener('webglcontextlost', onLost, false);
                    }}
                >
                    <Suspense fallback={null}>
                        {/* Background is now the 3D moody cloud sky dome (Atmosphere/MoodySky) */}
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={0.8} />
                        
                        {/* Always render the scene content */}
                        <SceneContent
                            lang={currentLang}
                            dict={dict}
                        />
                        <ReadyPing onReady={handleSceneReady} />

                    </Suspense>
                </Canvas>
            </div>

            {/* Intro veil: a breathing surface that lifts once the scene is ready */}
            {showIntroSeq && (
                <IntroSequence
                    leaving={introLeaving}
                    onLeft={handleOverlayComplete}
                />
            )}

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

            {/* Top bar: search (center) + icon buttons (right) */}
            <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 pt-3 sm:px-4 sm:pt-4 gap-2">
                {/* Ghost spacer — mirrors right button group width to keep search centered */}
                <div className="flex items-center gap-1 sm:gap-2 invisible pointer-events-none" aria-hidden="true">
                    <div className="w-10 h-10 sm:w-12 sm:h-12" />
                    <div className="w-10 h-10 sm:w-12 sm:h-12" />
                    <div className="hidden sm:block w-12 h-12" />
                </div>

                {/* Center: search */}
                <div className="flex-1 flex justify-center relative">
                    {!showIntroSeq && (
                        <SearchButton onClick={() => setShowSearchModal(true)} />
                    )}
                </div>

                {/* Right: shortlist + GitHub + Help */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {!showIntroSeq && <Shortlist />}
                    <animated.a
                        style={githubButtonSpring}
                        href="https://github.com/parsaa74/german-art-schools"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex items-center justify-center w-12 h-12 ui-organic text-white hover:text-white transition-all duration-300"
                        aria-label="View Source on GitHub"
                    >
                        <FiGithub size={18} />
                    </animated.a>
                    <animated.button
                        style={helpButtonSpring}
                        onClick={() => setShowHelp(true)}
                        className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 ui-organic text-white hover:text-white transition-all duration-300"
                        aria-label="Help / Info"
                    >
                        <FiHelpCircle size={18} />
                    </animated.button>
                </div>
            </div>
            {showHelp && (
                <div className="fixed inset-0 z-40 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="help-heading">
                   <div className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowHelp(false)}></div>
                   <animated.div
                       style={modalSpring}
                       className="relative max-w-2xl w-full mx-3 sm:mx-4 overflow-hidden"
                       >
                       <div className="relative ui-organic p-4 sm:p-6 overflow-y-auto overflow-x-hidden max-h-[85vh]">
                           <h2 id="help-heading" className="font-bold tracking-wider text-cyan-100 text-lg mb-1 text-center">
                               HOW TO READ THE WALL
                           </h2>
                           <p className="text-sm text-slate-300 text-center mb-4">
                               Every pane of glass is one of {processedUniversities.length} art, design, film and music schools in Germany,
                               placed roughly where it is on the map — north at the top. The fine cracks inside a pane are its programs.
                           </p>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm text-slate-200">
                             <HelpBlock title="Explore">
                               <li><b className="text-white">Hover</b> a pane to see the school&apos;s name.</li>
                               <li><b className="text-white">Click</b> it to open the school — the pane cracks into its programs. Click a fragment, or a program in the panel, for details.</li>
                               <li><b className="text-white">Scroll</b> to zoom. The 2D button (bottom left) shows the same schools as a network.</li>
                             </HelpBlock>
                             <HelpBlock title="Narrow down">
                               <li><b className="text-white">✦ Guide me</b> asks one question at a time.</li>
                               <li><b className="text-white">Filters</b> (top left) has every option and lists the matching schools.</li>
                               <li>Schools that don&apos;t match break away from the wall; clear the filter and they come back.</li>
                               <li><b className="text-white">Keep</b> a program to add it to your shortlist (bookmark, top right). Fill in your situation there for a personal check: what to prepare, by when, and what it costs. It stays on your device.</li>
                             </HelpBlock>
                             <HelpBlock title="Colours (appear once you filter)">
                               {Object.values(SCHOOL_TYPES).map((t) => (
                                 <li key={t.label} className="flex items-center gap-2">
                                   <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: t.color }} />{t.label}
                                 </li>
                               ))}
                             </HelpBlock>
                             <HelpBlock title="Light & cracks">
                               <li><span className="text-amber-300">Gold-lit panes</span> are schools with similar programs to the one you hover or open — brighter means more in common. The school panel lists them with the matching programs.</li>
                               <li>Cracks pulse <span className="text-amber-300">amber</span> when an application deadline is under {ATMO.deadlineStorm.approachingDays} days away, <span className="text-red-400">red</span> under {ATMO.deadlineStorm.urgentDays}.</li>
                             </HelpBlock>
                             <HelpBlock title="Keyboard">
                               <li><b className="text-white">{typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'} + K</b> — search schools, programs and states</li>
                               <li><b className="text-white">Esc</b> — close the open panel</li>
                             </HelpBlock>
                           </div>
                           <button
                               onClick={() => setShowHelp(false)}
                               className="mt-6 w-full ui-button-organic text-white font-semibold tracking-wider"
                           >
                               BACK TO THE WALL
                           </button>
                       </div>
                   </animated.div>
               </div>
            )}

            {/* Filters panel & ViewModeToggle & InfoPanel (when not intro) */}
            {!showIntroSeq && (
                <>
                    {/* Guided subtitle flow — the primary, intuitive way to break the wall */}
                    <FilterWizard />

                    <CollapsibleControlPanel
                        position="top-left"
                        panelTitle="Filters"
                        triggerIcon={<SlidersHorizontal size={18} />}
                        isOpen={activePanel === 'filters'}
                        onOpenChange={(open) => setActivePanel(open ? 'filters' : null)}
                    >
                        <FilterControls />
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
                     <ProgramInfoPanel />

                     {!explored && (
                        <p className="fixed inset-x-0 bottom-20 z-20 px-6 text-center text-sm text-slate-200/90 pointer-events-none [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
                            {processedUniversities.length} art, design, film &amp; music schools in Germany — each pane is one school.
                            <span className="hidden sm:inline"> Hover to read a name, click to open it.</span>
                        </p>
                     )}
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

