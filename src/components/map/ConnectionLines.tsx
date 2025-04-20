import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { LineMaterial } from 'three-stdlib';
import * as THREE from 'three';
import { ProcessedUniversity } from '@/stores/schoolStore'; // Import the type
import { useSchoolStore } from '@/stores/schoolStore'; // Import the useSchoolStore

// --- START: AnimatedLine Component ---
interface AnimatedLineProps {
    points: [THREE.Vector3, THREE.Vector3];
    startColor?: THREE.Color | string | number;
    endColor?: THREE.Color | string | number;
    lineWidth?: number;
    opacity?: number;
    animationDuration?: number;
    isHoverLine?: boolean; // Flag for hover lines
    similarityScore?: number; // Add similarity score for styling
}

function AnimatedLine({ 
    points,
    startColor = '#ff88cc', // Default pinkish color for selected
    endColor = '#ffccff',
    lineWidth = 1.5,
    opacity = 0.6,
    animationDuration = 0.6, 
    isHoverLine = false,
    similarityScore = 1.0 // Default to full similarity
}: AnimatedLineProps) {
    const lineRef = useRef<any>(null);
    const materialRef = useRef<LineMaterial>(null);
    const progress = useRef(0);
    const lineLength = useMemo(() => points[0].distanceTo(points[1]), [points]);
    const { size } = useThree();
    const resolutionVec = useMemo(() => new THREE.Vector2(size.width, size.height), [size.width, size.height]);

    // Adjust appearance based on similarity score (for non-hover lines)
    const scaledLineWidth = isHoverLine 
        ? lineWidth * 0.6 // Hover lines are thinner
        : lineWidth * (0.5 + similarityScore * 0.8); // Scale by similarity for non-hover
    
    const scaledOpacity = isHoverLine
        ? opacity * 0.7 // Hover lines are more transparent
        : opacity * (0.3 + similarityScore * 0.7); // Scale by similarity for non-hover
    
    // Color based on similarity and hover state
    const computedColor = useMemo(() => {
        if (isHoverLine) return new THREE.Color('#aaaaff'); // Light blue for hover
        
        // For selected connections, use color gradient based on similarity
        if (similarityScore >= 0.7) {
            return new THREE.Color('#50c1ee'); // Bright blue for high similarity
        } else if (similarityScore >= 0.4) {
            return new THREE.Color('#a366cc'); // Purple for medium similarity
        } else {
            return new THREE.Color('#ee77bb'); // Pink for low similarity
        }
    }, [isHoverLine, similarityScore]);

    useFrame((_state, delta) => {
        if (progress.current < 1 && lineRef.current && materialRef.current) {
            progress.current += delta / animationDuration;
            progress.current = Math.min(progress.current, 1);
            materialRef.current.dashOffset = lineLength * (1 - progress.current);
            materialRef.current.needsUpdate = true;
        }
    });

    return (
        <Line
            ref={lineRef}
            points={points}
            color={computedColor}
            lineWidth={scaledLineWidth}
            transparent
            opacity={scaledOpacity}
            dashed={true}
            dashSize={lineLength}
            gapSize={lineLength}
        >
            <lineMaterialImpl
                ref={materialRef}
                vertexColors={false}
                color={computedColor}
                linewidth={scaledLineWidth}
                transparent={true}
                opacity={scaledOpacity}
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

// --- START: Updated ConnectionLines Component ---
interface ConnectionLinesProps {
    selectedUniversity: ProcessedUniversity | null;
    hoverUniversityName: string | null;
    nodePositions: Map<string, THREE.Vector3>;
    universityMap: Map<string, ProcessedUniversity>;
}

export default function ConnectionLines({ 
    selectedUniversity,
    hoverUniversityName,
    nodePositions,
    universityMap 
}: ConnectionLinesProps) {

    // Get active filters for similarity calculation
    const { 
        activeStateFilter,
        activeProgramFilter,
        activeTypeFilter,
        activeSemesterFilter,
        activeNcFilter,
        timelineFilter
    } = useSchoolStore(state => ({
        activeStateFilter: state.activeStateFilter,
        activeProgramFilter: state.activeProgramFilter,
        activeTypeFilter: state.activeTypeFilter,
        activeSemesterFilter: state.activeSemesterFilter,
        activeNcFilter: state.activeNcFilter,
        timelineFilter: state.timelineFilter
    }));

    const linesToDraw = useMemo(() => {
        const activeUniversity = selectedUniversity;
        const activeUniversityName = activeUniversity?.name ?? hoverUniversityName;
        const isHoverConnection = !selectedUniversity && !!hoverUniversityName;

        if (!activeUniversityName) {
            return []; // No selection or hover
        }

        const sourceUni = universityMap.get(activeUniversityName);
        const sourcePos = nodePositions.get(activeUniversityName);

        if (!sourceUni || !sourcePos || !sourceUni.programTypes?.length) {
            return []; // Source uni not found or has no programs
        }

        // Calculate similarity scores for all universities
        const sourcePrograms = new Set(sourceUni.programTypes);
        const linesToDraw: Array<{ 
            points: [THREE.Vector3, THREE.Vector3], 
            isHover: boolean,
            similarityScore: number 
        }> = [];

        // Get relevant data for source university 
        const sourceProgs = (sourceUni as any).programs || [];
        const sourceWinter = sourceProgs.some((p: any) => p.applicationDeadlines?.winter);
        const sourceSummer = sourceProgs.some((p: any) => p.applicationDeadlines?.summer);
        const sourceNcFrei = (sourceUni as any).ncFrei != null ? 
            (sourceUni as any).ncFrei : (sourceUni as any).nc_frei;
        const sourceFoundedYear = sourceUni.founded ? parseInt(sourceUni.founded) : null;

        for (const [targetName, targetUni] of universityMap.entries()) {
            if (targetName === activeUniversityName) continue; // Skip self

            const targetPos = nodePositions.get(targetName);
            if (!targetPos || !targetUni.programTypes?.length) continue; // Skip if no position or programs

            // Calculate similarity score - similar to our node positioning algorithm
            let similarityScore = 0;
            let maxPossibleScore = 0;
            
            // STATE SIMILARITY
            const stateWeight = activeStateFilter ? 2.0 : 1.0;
            if (targetUni.state === sourceUni.state) {
                similarityScore += 1.0 * stateWeight;
            }
            maxPossibleScore += 1.0 * stateWeight;
            
            // TYPE SIMILARITY
            const typeWeight = activeTypeFilter ? 2.0 : 1.0;
            if (targetUni.type === sourceUni.type) {
                similarityScore += 1.0 * typeWeight;
            }
            maxPossibleScore += 1.0 * typeWeight;
            
            // PROGRAM OVERLAP
            const programWeight = activeProgramFilter ? 2.0 : 1.0;
            const commonPrograms = targetUni.programTypes.filter(p => sourcePrograms.has(p));
            const programOverlap = commonPrograms.length / Math.max(sourceUni.programTypes.length, 1);
            similarityScore += programOverlap * programWeight;
            maxPossibleScore += 1.0 * programWeight;
            
            // Only proceed with creating a line if there's at least one shared program
            // or if we have a hover state (show connections regardless of similarity)
            if (commonPrograms.length > 0 || isHoverConnection) {
                // Calculate additional similarities
                
                // SEMESTER SIMILARITY
                const semesterWeight = activeSemesterFilter ? 2.0 : 1.0;
                const targetProgs = (targetUni as any).programs || [];
                const targetWinter = targetProgs.some((p: any) => p.applicationDeadlines?.winter);
                const targetSummer = targetProgs.some((p: any) => p.applicationDeadlines?.summer);
                
                if (sourceWinter && targetWinter) similarityScore += 0.5 * semesterWeight;
                if (sourceSummer && targetSummer) similarityScore += 0.5 * semesterWeight;
                maxPossibleScore += 1.0 * semesterWeight;
                
                // NC-FREI MATCHING
                const ncWeight = activeNcFilter !== null ? 2.0 : 1.0;
                const targetNcFrei = (targetUni as any).ncFrei != null ? 
                    (targetUni as any).ncFrei : (targetUni as any).nc_frei;
                
                if (sourceNcFrei != null && targetNcFrei != null && sourceNcFrei === targetNcFrei) {
                    similarityScore += 1.0 * ncWeight;
                }
                maxPossibleScore += 1.0 * ncWeight;
                
                // FOUNDED YEAR SIMILARITY
                const yearWeight = timelineFilter ? 2.0 : 1.0;
                if (sourceFoundedYear !== null && targetUni.founded) {
                    const targetFoundedYear = parseInt(targetUni.founded);
                    if (!isNaN(targetFoundedYear)) {
                        const yearDiff = Math.abs(sourceFoundedYear - targetFoundedYear);
                        const MAX_YEAR_DIFF = 100;
                        const yearSimilarity = Math.max(0, 1 - (yearDiff / MAX_YEAR_DIFF));
                        similarityScore += yearSimilarity * yearWeight;
                    }
                }
                maxPossibleScore += 1.0 * yearWeight;
                
                // Normalize the score
                const normalizedScore = maxPossibleScore > 0 ? 
                    similarityScore / maxPossibleScore : 0;
                
                // For hover state, only show top connections
                if (isHoverConnection) {
                    // Only show top 3 connections for hover state to avoid clutter
                    if (normalizedScore > 0.5) {
                        linesToDraw.push({ 
                            points: [sourcePos, targetPos], 
                            isHover: true,
                            similarityScore: normalizedScore 
                        });
                    }
                } else {
                    // For selected state, show connections with varied styling based on similarity
                    // Limit to those with at least some similarity to avoid visual clutter
                    if (normalizedScore > 0.2) {
                        linesToDraw.push({ 
                            points: [sourcePos, targetPos], 
                            isHover: false,
                            similarityScore: normalizedScore 
                        });
                    }
                }
            }
        }
        
        // Sort by similarity score (descending) to ensure most important connections are drawn last (on top)
        return linesToDraw.sort((a, b) => a.similarityScore - b.similarityScore);

    }, [
        selectedUniversity, 
        hoverUniversityName, 
        nodePositions, 
        universityMap,
        activeStateFilter,
        activeProgramFilter,
        activeTypeFilter,
        activeSemesterFilter,
        activeNcFilter,
        timelineFilter
    ]);

    if (linesToDraw.length === 0) {
        return null; 
    }
    
    // Limit the number of lines to avoid visual clutter
    const maxLines = selectedUniversity ? 12 : 3; // Show more for selection, fewer for hover
    const linesToShow = linesToDraw.slice(0, maxLines);
    
    return (
        <group name="connectionLinesGroup">
            {linesToShow.map((lineData, i) => (
                <AnimatedLine
                    key={`line-${selectedUniversity?.id ?? hoverUniversityName}-${i}`}
                    points={lineData.points}
                    isHoverLine={lineData.isHover}
                    similarityScore={lineData.similarityScore}
                />
            ))}
        </group>
    );
} 
// --- END: Updated ConnectionLines Component --- 