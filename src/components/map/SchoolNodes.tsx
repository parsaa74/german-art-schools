import React, { useMemo, useEffect } from 'react';
import { useSprings, a } from '@react-spring/three';
import * as THREE from 'three';
import { latLngToVector3, MAP_CONFIG } from '@/lib/geo/index';
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore';
import { SchoolMarker } from './SchoolMarker';

// Removed the commented-out shader code block entirely

// Keep interface definitions if needed elsewhere, or simplify if only used here
interface Coordinates { lat: number; lng: number; }
// Use ProcessedUniversity type directly from store if possible
// interface UniversityData { ... }
// interface SchoolNodeData { name: string; position: THREE.Vector3; data: UniversityData; } // Use ProcessedUniversity

// Function to create a simple hash from string for pseudo-randomness
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Helper function to spread positions apart
function spreadPosition(position: THREE.Vector3, schoolName: string, spreadFactor: number = 0.15): THREE.Vector3 {
  // Create deterministic but random-looking offset based on school name
  const seed = simpleHash(schoolName);
  
  // Generate random offsets between -1 and 1 based on the seed
  const randomX = (((seed * 15485863) % 1000) / 500) - 1.0;
  const randomY = (((seed * 17059) % 1000) / 500) - 1.0;
  const randomZ = (((seed * 27644437) % 1000) / 500) - 1.0;
  
  // Create a normalized direction vector for the offset
  const offsetDir = new THREE.Vector3(randomX, randomY, randomZ).normalize();
  
  // Apply the spread factor to determine how far to move the position
  const spreadAmount = spreadFactor * (0.8 + (seed % 100) / 250); // Vary the spread slightly
  
  // Create a new position by adding the offset
  return new THREE.Vector3(
    position.x + offsetDir.x * spreadAmount,
    position.y + offsetDir.y * spreadAmount,
    position.z + offsetDir.z * spreadAmount
  );
}

export function SchoolNodes() {
  // Get all potentially needed state slices using a selector
  const {
    processedUniversities,
    nodePositions,
    hoverUniversityName,
    selectedUniversity,
    activeStateFilter,
    activeProgramFilter,
    activeTypeFilter,
    activeSemesterFilter,
    activeNcFilter,
    timelineFilter,
    visualizationMode,
    searchQuery,
    setSelectedUniversity
  } = useSchoolStore(state => ({
    processedUniversities: state.processedUniversities,
    nodePositions: state.nodePositions,
    hoverUniversityName: state.hoverUniversityName,
    selectedUniversity: state.selectedUniversity,
    activeStateFilter: state.activeStateFilter,
    activeProgramFilter: state.activeProgramFilter,
    activeTypeFilter: state.activeTypeFilter,
    activeSemesterFilter: state.activeSemesterFilter,
    activeNcFilter: state.activeNcFilter,
    timelineFilter: state.timelineFilter,
    visualizationMode: state.visualizationMode,
    searchQuery: state.searchQuery,
    setSelectedUniversity: state.setSelectedUniversity
  }));

  // Fuzzy search function
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!query.trim()) return true;
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    
    // Exact match gets priority
    if (normalizedText.includes(normalizedQuery)) return true;
    
    // Character by character fuzzy match
    let queryIndex = 0;
    for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
      if (normalizedText[i] === normalizedQuery[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === normalizedQuery.length;
  };

  const filteredUniversities = useMemo(() => {
    // Check prerequisites for filtering
    if (!Array.isArray(processedUniversities) || processedUniversities.length === 0) {
      return [];
    }

    // Log universities without positions
    const universitiesWithoutPositions = processedUniversities.filter(uni => !nodePositions.has(uni.name));
    if (universitiesWithoutPositions.length > 0) {
      // console.warn('[SchoolNodes useMemo] Universities missing positions:', universitiesWithoutPositions.map(uni => uni.name));
    }

    const currentTimelineFilter = timelineFilter ?? null;

    const result = processedUniversities.filter(uni => {
      if (!uni) return false;
      if (!nodePositions.has(uni.name)) return false;

      // Search query filter
      if (searchQuery && searchQuery.trim()) {
        const matchesSearch = fuzzyMatch(uni.name, searchQuery) ||
                             fuzzyMatch(uni.state, searchQuery) ||
                             fuzzyMatch(uni.city || '', searchQuery) ||
                             fuzzyMatch(uni.description || '', searchQuery) ||
                             uni.programTypes.some(p => fuzzyMatch(p, searchQuery));
        
        if (!matchesSearch) return false;
      }

      if (activeStateFilter && uni.state !== activeStateFilter) return false;
      if (activeProgramFilter && !uni.programTypes.includes(activeProgramFilter)) return false;
      if (activeTypeFilter && uni.type !== activeTypeFilter) return false;

      if (activeSemesterFilter) {
        const progs = (uni as any).programs || [];
        
        // Check for semester availability in any program
        const hasSemester = progs.some((p: any) => 
          p.applicationDeadlines && p.applicationDeadlines[activeSemesterFilter]
        );
        
        console.log(`[DEBUG] University ${uni.name} - Has ${activeSemesterFilter} semester:`, hasSemester);
        
        if (!hasSemester) return false;
      }

      if (activeNcFilter != null) {
        // Directly use the ncFrei property we added to the university object
        const uniNcFrei = (uni as any).ncFrei;
        
        console.log(`[DEBUG] University ${uni.name} - NC-frei value:`, uniNcFrei, "Filter value:", activeNcFilter);
        
        // If ncFrei status is defined, filter by it
        if (uniNcFrei !== undefined && uniNcFrei !== activeNcFilter) {
          return false;
        }
      }

      if (currentTimelineFilter) {
        const foundedYear = uni.founded ? parseInt(uni.founded) : null;
        if (foundedYear === null || foundedYear < currentTimelineFilter[0] || foundedYear > currentTimelineFilter[1]) {
          return false;
        }
      }
      return true;
    });
    
    return result;

  }, [processedUniversities, nodePositions, activeStateFilter, activeProgramFilter, activeTypeFilter, activeSemesterFilter, activeNcFilter, timelineFilter, searchQuery, fuzzyMatch]);

  // Auto-select the university if it's the only one after filtering
  useEffect(() => {
    // If we have exactly one filtered university and no current selection,
    // or the current selection is not in the filtered list
    if (filteredUniversities.length === 1 && 
        (!selectedUniversity || 
         !filteredUniversities.some(uni => uni.name === selectedUniversity.name))) {
      // Auto-select the only university that matches the filters
      setSelectedUniversity(filteredUniversities[0]);
    }
  }, [filteredUniversities, selectedUniversity, setSelectedUniversity]);

  // For 3D network mode: uniform sphere distribution (Fibonacci sphere)
  const spherePositions = useMemo(() => {
    const N = filteredUniversities.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const map = new Map<string, THREE.Vector3>();
    filteredUniversities.forEach((uni, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const radiusFactor = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radiusFactor;
      const z = Math.sin(theta) * radiusFactor;
      map.set(uni.name, new THREE.Vector3(x, y, z).multiplyScalar(MAP_CONFIG.radius));
    });
    return map;
  }, [filteredUniversities]);

  // When a node is clicked, re-arrange others by relationship strength into nested rings
  const relationshipPositions = useMemo(() => {
    if (!selectedUniversity) return spherePositions
    const result = new Map<string, THREE.Vector3>()
    
    // Place selected university at center
    result.set(selectedUniversity.name, new THREE.Vector3(0, 0, 0))
    
    // 1) Compute similarity scores for each university, weighted by active filters
    const scores = filteredUniversities
      .filter(uni => uni.name !== selectedUniversity.name) // Exclude selected university
      .map(uni => {
        let score = 0
        let maxPossibleScore = 0
        
        // STATE SIMILARITY - Higher weight if state filter is active
        const stateWeight = activeStateFilter ? 2.0 : 1.0
        if (uni.state === selectedUniversity.state) {
          score += 1.0 * stateWeight
        }
        maxPossibleScore += 1.0 * stateWeight
        
        // TYPE SIMILARITY - Higher weight if type filter is active
        const typeWeight = activeTypeFilter ? 2.0 : 1.0
        if (uni.type === selectedUniversity.type) {
          score += 1.0 * typeWeight
        }
        maxPossibleScore += 1.0 * typeWeight
        
        // PROGRAM OVERLAP - Higher weight if program filter is active
        const programWeight = activeProgramFilter ? 2.0 : 1.0
        const selectedPrograms = selectedUniversity.programTypes
        const uniPrograms = uni.programTypes
        const commonPrograms = uniPrograms.filter(p => selectedPrograms.includes(p))
        const overlapRatio = commonPrograms.length / Math.max(selectedPrograms.length, 1)
        score += overlapRatio * programWeight
        maxPossibleScore += 1.0 * programWeight
        
        // SEMESTER SIMILARITY - Higher weight if semester filter is active
        const semesterWeight = activeSemesterFilter ? 2.0 : 1.0
        const uniProgs = (uni as any).programs || []
        const selProgs = (selectedUniversity as any).programs || []
        
        // Check winter semester match
        const uniWinter = uniProgs.some((p: any) => p.applicationDeadlines?.winter)
        const selWinter = selProgs.some((p: any) => p.applicationDeadlines?.winter)
        if (uniWinter && selWinter) {
          score += 0.5 * semesterWeight
        }
        
        // Check summer semester match
        const uniSummer = uniProgs.some((p: any) => p.applicationDeadlines?.summer)
        const selSummer = selProgs.some((p: any) => p.applicationDeadlines?.summer)
        if (uniSummer && selSummer) {
          score += 0.5 * semesterWeight
        }
        maxPossibleScore += 1.0 * semesterWeight
        
        // NC-FREI MATCHING - Higher weight if NC filter is active
        const ncWeight = activeNcFilter !== null ? 2.0 : 1.0
        const uniNcFrei = (uni as any).ncFrei;
        const selNcFrei = (selectedUniversity as any).ncFrei;
        if (uniNcFrei !== undefined && selNcFrei !== undefined && uniNcFrei === selNcFrei) {
          score += 1.0 * ncWeight;
        }
        maxPossibleScore += 1.0 * ncWeight;
        
        // FOUNDED YEAR SIMILARITY - Higher weight if timeline filter is active
        const yearWeight = timelineFilter ? 2.0 : 1.0
        if (uni.founded && selectedUniversity.founded) {
          const uniYear = parseInt(uni.founded)
          const selYear = parseInt(selectedUniversity.founded)
          if (!isNaN(uniYear) && !isNaN(selYear)) {
            // Calculate similarity based on how close the founding years are (normalized to 0-1)
            // Using a decay function where similarity drops as years differ
            const yearDiff = Math.abs(uniYear - selYear)
            const MAX_YEAR_DIFF = 100 // Universities founded more than 100 years apart have minimal similarity
            const yearSimilarity = Math.max(0, 1 - (yearDiff / MAX_YEAR_DIFF))
            score += yearSimilarity * yearWeight
          }
        }
        maxPossibleScore += 1.0 * yearWeight
        
        // Normalize score to 0-1 range based on maximum possible score
        const normalizedScore = maxPossibleScore > 0 ? score / maxPossibleScore : 0
        
        return { 
          uni, 
          score: normalizedScore,
          // Store individual similarity factors for visual mapping
          factors: {
            state: uni.state === selectedUniversity.state,
            type: uni.type === selectedUniversity.type,
            programs: commonPrograms.length > 0,
            semester: (uniWinter && selWinter) || (uniSummer && selSummer),
            ncFrei: uniNcFrei !== undefined && selNcFrei !== undefined && uniNcFrei === selNcFrei
          }
        }
      })
    
    // 2) Sort by similarity score
    scores.sort((a, b) => b.score - a.score)
    
    // 3) Group into tiers by similarity score
    const highSimilarity = scores.filter(s => s.score >= 0.7)
    const mediumSimilarity = scores.filter(s => s.score >= 0.4 && s.score < 0.7)
    const lowSimilarity = scores.filter(s => s.score < 0.4)
    
    // 4) Calculate positions in multi-ring arrangement
    
    // CENTER RING - closest/most similar nodes
    const innerRadius = MAP_CONFIG.radius * 0.25
    highSimilarity.forEach((entry, i) => {
      const count = highSimilarity.length
      const angle = (2 * Math.PI * i) / count
      const x = Math.cos(angle) * innerRadius
      // Position height slightly above the center to make it visible
      const y = MAP_CONFIG.radius * 0.05
      const z = Math.sin(angle) * innerRadius
      const position = new THREE.Vector3(x, y, z)
      
      // Add slight randomization to prevent perfect circle (more organic look)
      const finalPos = spreadPosition(position, entry.uni.name, MAP_CONFIG.radius * 0.03)
      result.set(entry.uni.name, finalPos)
    })
    
    // MIDDLE RING - medium similarity nodes
    const midRadius = MAP_CONFIG.radius * 0.45
    mediumSimilarity.forEach((entry, i) => {
      const count = mediumSimilarity.length
      const angle = (2 * Math.PI * i) / count
      const x = Math.cos(angle) * midRadius
      // Position higher than the inner ring
      const y = MAP_CONFIG.radius * 0.15
      const z = Math.sin(angle) * midRadius
      const position = new THREE.Vector3(x, y, z)
      
      // Add more randomization to medium similarity nodes
      const finalPos = spreadPosition(position, entry.uni.name, MAP_CONFIG.radius * 0.05)
      result.set(entry.uni.name, finalPos)
    })
    
    // OUTER RING - least similar nodes
    const outerRadius = MAP_CONFIG.radius * 0.7
    lowSimilarity.forEach((entry, i) => {
      const count = lowSimilarity.length
      const angle = (2 * Math.PI * i) / count
      const x = Math.cos(angle) * outerRadius
      // Position highest to show least similarity
      const y = MAP_CONFIG.radius * 0.3
      const z = Math.sin(angle) * outerRadius
      const position = new THREE.Vector3(x, y, z)
      
      // Add significant randomization to outer ring
      const finalPos = spreadPosition(position, entry.uni.name, MAP_CONFIG.radius * 0.08)
      result.set(entry.uni.name, finalPos)
    })
    
    return result
  }, [selectedUniversity, spherePositions, filteredUniversities, activeStateFilter, activeTypeFilter, activeProgramFilter, activeSemesterFilter, activeNcFilter, timelineFilter])

  // --- DEBUG LOGS START --- (Log state used in *this* render)
  console.log('[SchoolNodes] Rendering...')
  console.log('[SchoolNodes] processedUniversities count:', processedUniversities.length)
  console.log('[SchoolNodes] nodePositions size:', nodePositions.size) // Use .size
  console.log('[SchoolNodes] timelineFilter:', timelineFilter)
  console.log('[SchoolNodes] activeStateFilter:', activeStateFilter)
  console.log('[SchoolNodes] activeProgramFilter:', activeProgramFilter)
  console.log('[SchoolNodes] filteredUniversities count (result of useMemo):', filteredUniversities.length)
  // --- DEBUG LOGS END ---

   // Check if *both* data sources are ready before proceeding
   // and if the filtered list has content.
   const isDataReady = processedUniversities.length > 0 && nodePositions.size > 0;
   const hasFilteredNodes = filteredUniversities.length > 0;

   if (!isDataReady) {
     console.log('[SchoolNodes] Not rendering: Waiting for initial data (universities and positions).');
     return null;
   }

  // Prepare animated springs for positions
  const isNetwork = visualizationMode === 'network';
  const targets = filteredUniversities.map(uni => {
    if (isNetwork) {
      // When there's only one university after filtering, position it at the center
      if (filteredUniversities.length === 1) {
        return new THREE.Vector3(0, 0, 0);
      }
      
      return selectedUniversity
        ? relationshipPositions.get(uni.name)!
        : spherePositions.get(uni.name)!;
    }
    return nodePositions.get(uni.name)!;
  });
  const springs = useSprings(filteredUniversities.length, targets.map(pos => ({
    to: { position: [pos.x, pos.y, pos.z] },
    config: { mass: 1, tension: 170, friction: 26 }
  })));

   if (!hasFilteredNodes) {
       console.log('[SchoolNodes] Not rendering: Zero universities match current filters or conditions.');
       return null; // Return null if no schools to render after filtering
   }

  // Render markers
  return (
    <group name="schoolNodesGroup">
      {springs.map((spring, idx) => {
        const uni = filteredUniversities[idx];
        return (
          <a.group
            key={uni.name}
            position={spring.position as unknown as [number, number, number]}
          >
            <SchoolMarker
              position={new THREE.Vector3(0, 0, 0)}
              schoolData={uni}
              isHovered={hoverUniversityName === uni.name}
              isSelected={selectedUniversity?.name === uni.name || filteredUniversities.length === 1}
            />
          </a.group>
        );
      })}
    </group>
  );
}
