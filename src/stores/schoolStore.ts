import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';
import * as THREE from 'three';
// Ensure geo utilities are imported
import { latLngToVector3, MAP_CONFIG } from '@/lib/geo/index'; 
import { normalizeSchoolType, type Fee } from '@/lib/taxonomy';

// Interface for the processed university data used within the app
export interface ProcessedUniversity {
  id: string;
  name: string;
  location: [number, number]; // [lat, lng]
  type: string; // Derived from programTypes
  state: string;
  programCount: number;
  website: string;
  programTypes: string[];
  // Additional properties for the info panel
  city?: string;
  description?: string;
  founded?: string;
  students?: string;
  coordinates?: { lat: number | null; lng: number | null };
  // Application method
  applicationMethod?: 'uni-assist' | 'direct';
  applicationMethodSource?: { url: string; checked: string };
  // tuition for non-EU students where known (perSemester null = charged, amount not published by us)
  nonEuTuition?: { perSemester: string | null; source: string; checked: string };
  // Researched on official pages (see data/research/): costs, route details, contact
  fees?: Fee[];
  applicationRoute?: { method: string; notes: string; url?: string; scope?: string };
  contact?: { email?: string; phone?: string; url?: string };
  sources?: Record<string, string>;   // field -> official page it came from
  researched?: string;                // date those pages were checked
  // Enhanced data properties
  programs?: Array<{
    name: string;
    degree: string;
    applicationDeadlines: {
      winter?: { start?: string; end: string; cycle?: string };   // a year in the date = one published round
      summer?: { start?: string; end: string; cycle?: string };
    };
    language: string;
    duration: string;
    description?: string;
    specializations?: string[];
    admission?: 'aptitude' | 'open' | 'restricted' | 'aptitude-and-restricted';   // researched; see taxonomy.admissionOf
    admissionSource?: string;
    status?: { status: string; notes?: string };
    otherDeadlines?: Array<{ kind: string; semester: string | null; start: string | null; end: string; recurring: boolean; cycle?: string | null; scope?: string }>;
    requirements?: Array<{ label: string; text: string }>;
    fees?: Fee[];
    sources?: Record<string, string>;
    researched?: string;
  }>;
  // Enhanced statistical data for visualizations
  ranking?: {
    national?: number;
    specialization_rank?: { [key: string]: number };
  };
  stats?: {
    students?: number;
    acceptance_rate?: number;
    student_staff_ratio?: number;
    founded?: number;
  };
  // Computed fields for clustering and connections
  prestigeScore?: number; // Derived from ranking
  popularityScore?: number; // Derived from student count and acceptance rate
  specializationVector?: string[]; // Specializations for similarity calculations
}

// Visualization mode type
export type VisualizationMode = 'network' | 'd3-force';

export interface ProgramEdge {
  src: string;
  dst: string;
  weight: number;
}

/** A school related to another through programs that closely match (see scripts/build-relations.ts). */
export interface SchoolRelation {
  schoolId: string;
  tier: 1 | 2 | 3;              // 3 very similar · 2 similar · 1 some overlap
  total: number;                // matched program pairs
  pairs: Array<[string, string]>; // [this school's program_id, other school's program_id]
}

// Interface for the store's state and actions
export interface SchoolStore {
  // State Properties
  isLoading: boolean;
  processedUniversities: ProcessedUniversity[];
  universityMap: Map<string, ProcessedUniversity>;
  selectedUniversity: ProcessedUniversity | null;
  hoverUniversityName: string | null;
  connectionLines: Array<[THREE.Vector3, THREE.Vector3]>;
  controlsEnabled: boolean;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  activeStateFilter: string | null;
  activeProgramFilter: string | null;
  activeTypeFilter: string | null;
  activeSemesterFilter: string | null;
  activeNcFilter: boolean | null;
  activeApplicationMethodFilter: 'uni-assist' | 'direct' | null;
  activeCourseLanguageFilter: string | null;
  activeDegreeFilter: string | null;
  uniqueStates: string[];
  visualizationMode: VisualizationMode;
  uniqueProgramTypes: string[];
  uniqueCourseLanguages: string[];
  uniqueDegreeTypes: string[];
  introComplete: boolean;
  expandedPanel: string | null;
  timelineFilter: [number, number] | null;
  nodePositions: Map<string, THREE.Vector3>;
  searchQuery: string;

  // Program network state
  showPrograms: boolean;
  selectedProgramId: string | null;
  programEdges: ProgramEdge[];
  programById: Map<string, { schoolName: string; schoolId: string; program: any }>;
  similarPrograms: Map<string, Array<{ id: string; score: number }>>; // cross-school only
  schoolRelations: Map<string, SchoolRelation[]>;                       // keyed by school id
  universityById: Map<string, ProcessedUniversity>;

  // Atmosphere (shattered-glass weather/mood system)
  storminess: number;       // 0 calm … 1 storm — driven by application deadlines
  intent: number;           // 0 … 1 — how narrowed the user's choice is
  lightningFlash: number;   // transient 0..1 flash, set by the Atmosphere driver
  atmosphereAuto: boolean;  // derive storminess/intent from data vs. manual control

  // Actions
  setIsLoading: (loading: boolean) => void;
  setSelectedUniversity: (university: ProcessedUniversity | null) => void;
  setHoverUniversityName: (name: string | null) => void;
  setConnectionLines: (lines: Array<[THREE.Vector3, THREE.Vector3]>) => void; // Use THREE.Vector3
  setControlsEnabled: (enabled: boolean) => void;
  setCameraPosition: (position: [number, number, number]) => void;
  setCameraTarget: (target: [number, number, number]) => void;
  setActiveStateFilter: (state: string | null) => void;
  setActiveProgramFilter: (program: string | null) => void;
  setActiveTypeFilter: (type: string | null) => void;
  setActiveSemesterFilter: (semester: string | null) => void;
  setActiveNcFilter: (ncFree: boolean | null) => void;
  setActiveApplicationMethodFilter: (method: 'uni-assist' | 'direct' | null) => void;
  setActiveCourseLanguageFilter: (language: string | null) => void;
  setActiveDegreeFilter: (degree: string | null) => void;
  setIntroComplete: (complete: boolean) => void;
  setExpandedPanel: (panelId: string | null) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setTimelineFilter: (range: [number, number] | null) => void;
  setSearchQuery: (query: string) => void;

  setNodePositions: (positions: Map<string, THREE.Vector3>) => void; // Use THREE.Vector3
  setShowPrograms: (show: boolean) => void;
  setSelectedProgramId: (id: string | null) => void;
  setStorminess: (v: number) => void;
  setIntent: (v: number) => void;
  setLightningFlash: (v: number) => void;
  setAtmosphereAuto: (v: boolean) => void;
  initializeStore: () => Promise<void>;
}

// Define the store creator with explicit types for set and get
const schoolStoreCreator: StateCreator<SchoolStore> = (set, get) => ({
  // --- Initial State ---
  isLoading: true, 
  processedUniversities: [],
  universityMap: new Map(),
  selectedUniversity: null,
  hoverUniversityName: null,
  connectionLines: [],
  controlsEnabled: false, 
  cameraPosition: [0, 0, 10], // Keep closer camera position
  cameraTarget: [0, 0, 0], 
  activeStateFilter: null,
  activeProgramFilter: null,
  activeTypeFilter: null,
  activeSemesterFilter: null,
  activeNcFilter: null,
  activeApplicationMethodFilter: null,
  activeCourseLanguageFilter: null,
  activeDegreeFilter: null,
  uniqueStates: [],
  uniqueProgramTypes: [],
  uniqueCourseLanguages: [],
  uniqueDegreeTypes: [],
  introComplete: false,
  expandedPanel: null,
  timelineFilter: null,
  visualizationMode: 'network',
  nodePositions: new Map<string, THREE.Vector3>(),
  searchQuery: '',
  showPrograms: true,
  selectedProgramId: null,
  programEdges: [],
  programById: new Map(),
  similarPrograms: new Map(),
  schoolRelations: new Map(),
  universityById: new Map(),

  // Atmosphere
  storminess: 0.12,
  intent: 0,
  lightningFlash: 0,
  atmosphereAuto: true,

  // --- Actions (Setters) ---
  setIsLoading: (loading) => set({ isLoading: loading }),
  setSelectedUniversity: (university) => set({ selectedUniversity: university }),
  setHoverUniversityName: (name) => set({ hoverUniversityName: name }),
  setConnectionLines: (lines) => set({ connectionLines: lines }),
  setControlsEnabled: (enabled) => set({ controlsEnabled: enabled }),
  setCameraPosition: (position) => set({ cameraPosition: position }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setActiveStateFilter: (state) => set({ activeStateFilter: state, selectedUniversity: null }), // Reset selection on filter change
  setActiveProgramFilter: (program) => set({ activeProgramFilter: program, selectedUniversity: null }), // Reset selection on filter change
  setActiveTypeFilter: (type) => set({ activeTypeFilter: type, selectedUniversity: null }),
  setActiveSemesterFilter: (semester) => set({ activeSemesterFilter: semester, selectedUniversity: null }),
  setActiveNcFilter: (ncFree) => set({ activeNcFilter: ncFree, selectedUniversity: null }),
  setActiveApplicationMethodFilter: (method) => set({ activeApplicationMethodFilter: method, selectedUniversity: null }),
  setActiveCourseLanguageFilter: (language) => set({ activeCourseLanguageFilter: language, selectedUniversity: null }),
  setActiveDegreeFilter: (degree) => set({ activeDegreeFilter: degree, selectedUniversity: null }),
  setIntroComplete: (complete) => set({ introComplete: complete }),
  setExpandedPanel: (panelId) => set({ expandedPanel: panelId }),
  setVisualizationMode: (mode: VisualizationMode) => set({ visualizationMode: mode }),
  setTimelineFilter: (range) => set({ timelineFilter: range, selectedUniversity: null }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  setNodePositions: (positions) => set({ nodePositions: positions }),
  setShowPrograms: (show) => set({ showPrograms: show, selectedProgramId: null }),
  setSelectedProgramId: (id) => set({ selectedProgramId: id }),
  // Written every frame by the Atmosphere driver: skip no-op writes so React
  // subscribers aren't notified 60×/s once the values have settled.
  setStorminess: (v) => set((s) => (s.storminess === v ? s : { storminess: v })),
  setIntent: (v) => set((s) => (s.intent === v ? s : { intent: v })),
  setLightningFlash: (v) => set((s) => (s.lightningFlash === v ? s : { lightningFlash: v })),
  setAtmosphereAuto: (v) => set({ atmosphereAuto: v }),

  // --- Initialization Action ---
  initializeStore: async () => {
    if (get().processedUniversities.length > 0) {
      console.log("SchoolStore: Already initialized.");
      if(get().isLoading) set({ isLoading: false });
      return;
    }
    console.log("Initializing SchoolStore...");
    set({ isLoading: true });

    try {
        let processedList: ProcessedUniversity[] = [];
        const map = new Map<string, ProcessedUniversity>();
        const states = new Set<string>();
        const programs = new Set<string>();
        const languages = new Set<string>();
        const degrees = new Set<string>();

        const { default: enhancedData } = await import('../data/enhanced_german_art_schools.json');
        const { default: relations } = await import('../data/relations.json');
        const programByIdMap = new Map<string, { schoolName: string; schoolId: string; program: any }>();
        processedList = Object.entries(enhancedData.universities).map(([name, data]: [string, any]) => {
                if (!data.coordinates?.lat || !data.coordinates?.lng) {
                    console.warn(`SchoolStore WARN: Missing coordinates for ${name}`);
                }

                const type = normalizeSchoolType(data.type);
                // Extract specializations from programs for similarity calculations
                const allSpecializations: string[] = [];
                data.programs?.forEach((program: any) => {
                    if (program.specializations) {
                        allSpecializations.push(...program.specializations);
                    }
                });
                
                // Calculate prestige score (lower national ranking = higher prestige)
                const prestigeScore = data.ranking?.national ? 
                    Math.max(0, 100 - data.ranking.national) : 50; // Default to middle if no ranking
                
                // Calculate popularity score based on student count and selectivity
                let popularityScore = 50; // Default
                if (data.stats?.students && data.stats?.acceptance_rate) {
                    const studentScore = Math.min(100, (data.stats.students / 50)); // Normalize to ~100 scale
                    const selectivityScore = (1 - data.stats.acceptance_rate) * 100; // Lower acceptance = higher score
                    popularityScore = (studentScore * 0.3 + selectivityScore * 0.7); // Weight selectivity more
                }
                
                const schoolId = data.id || name.toLowerCase().replace(/\s+/g, '-');
                (data.programs ?? []).forEach((p: any) => {
                    if (p.program_id) {
                        programByIdMap.set(p.program_id, { schoolName: name, schoolId, program: p });
                    }
                });
                return {
                    id: schoolId,
                    name: name,
                    location: [data.coordinates?.lat || 0, data.coordinates?.lng || 0],
                    type,
                    state: data.state || '',
                    programCount: data.programs?.length || 0,
                    website: data.website || '',
                    programTypes: data.programs?.map((p: any) => p.name) || [],
                    description: data.description || '',
                    city: data.city || '',
                    founded: data.stats?.founded ? data.stats.founded.toString() : undefined,
                    students: data.stats?.students ? data.stats.students.toString() : undefined,
                    programs: data.programs || [],
                    coordinates: data.coordinates,
                    applicationMethod: data.applicationMethod,
                    applicationMethodSource: data.applicationMethodSource,
                    nonEuTuition: data.nonEuTuition,
                    fees: data.fees,
                    applicationRoute: data.applicationRoute,
                    contact: data.contact,
                    sources: data.sources,
                    researched: data.researched,
                    // Enhanced fields
                    ranking: data.ranking,
                    stats: data.stats,
                    prestigeScore,
                    popularityScore,
                    specializationVector: allSpecializations, // Will be converted to numeric vector later if needed
                };
            });
        console.log(`SchoolStore: Loaded ${processedList.length} universities.`);

        // == Calculate Node Positions ==
        const positions = new Map<string, THREE.Vector3>();
        processedList.forEach(uni => {
            // Add to university map
            map.set(uni.name, uni);
            // Add to states and programs sets
            states.add(uni.state);
            uni.programTypes.forEach(p => programs.add(p));
            uni.programs?.forEach((p) => {
              if (p.language) languages.add(p.language);
              if (p.degree) degrees.add(p.degree);
            });

            // Calculate and add position if lat/lng are valid
            if (uni.location && typeof uni.location[0] === 'number' && typeof uni.location[1] === 'number') {
                const vectorPosition = latLngToVector3(uni.location[0], uni.location[1], MAP_CONFIG.radius);
                positions.set(uni.name, vectorPosition);
            } else {
                console.warn(`SchoolStore: Missing or invalid coordinates for ${uni.name}`);
            }
        });
        // == END: Calculate Node Positions ==

        const uniqueStatesArray = Array.from(states).sort();
        const uniqueProgramTypesArray = Array.from(programs).sort();
        const uniqueCourseLanguagesArray = Array.from(languages).sort();
        const uniqueDegreeTypesArray = Array.from(degrees).sort();

        console.log(`Processed ${processedList.length} universities. Found ${uniqueStatesArray.length} states and ${uniqueProgramTypesArray.length} program types. Calculated ${positions.size} node positions.`);

        // == DEBUG LOG 6: Final check before setting state ==
        console.log(`SchoolStore DEBUG: Final processed list length: ${processedList.length}. Example founded years before setting state:`,
            processedList.slice(0, 5).map(p => `${p.name}: ${p.founded}`) 
        );
        // Add back the position log
        console.log(`SchoolStore DEBUG: Final node positions count: ${positions.size}. Example position:`, 
            positions.size > 0 ? positions.entries().next().value : 'None'
        );

        // Set the final state including the calculated positions
        set({
            processedUniversities: processedList,
            universityMap: map,
            uniqueStates: uniqueStatesArray,
            uniqueProgramTypes: uniqueProgramTypesArray,
            uniqueCourseLanguages: uniqueCourseLanguagesArray,
            uniqueDegreeTypes: uniqueDegreeTypesArray,
            isLoading: false,
            controlsEnabled: true,
            nodePositions: positions, // Use the calculated positions map
            ...buildRelations(relations as unknown as RelationsFile),
            programById: programByIdMap,
            universityById: new Map(processedList.map((u) => [u.id, u])),
        });

    } catch (error) {
        console.error("SchoolStore DEBUG: Failed to initialize SchoolStore (outer catch):", error);
        console.error("Failed to initialize SchoolStore:", error);
        set({ isLoading: false });
    }
  },
});

interface RelationsFile {
  ids: string[];
  programs: Array<Array<[number, number]>>;
  schools: Record<string, Array<{ s: string; t: 1 | 2 | 3; total: number; p: Array<[number, number]> }>>;
}

function buildRelations(r: RelationsFile) {
  const similarPrograms = new Map(r.ids.map((id, i) => [id, r.programs[i].map(([j, score]) => ({ id: r.ids[j], score }))]));
  const schoolRelations = new Map(Object.entries(r.schools).map(([id, rels]) => [
    id,
    rels.map((x) => ({ schoolId: x.s, tier: x.t, total: x.total, pairs: x.p.map(([a, b]) => [r.ids[a], r.ids[b]] as [string, string]) })),
  ]));
  const programEdges: ProgramEdge[] = [];
  similarPrograms.forEach((hits, src) => hits.forEach((h) => programEdges.push({ src, dst: h.id, weight: h.score })));
  return { similarPrograms, schoolRelations, programEdges };
}

export const useSchoolStore = create<SchoolStore>(schoolStoreCreator);
