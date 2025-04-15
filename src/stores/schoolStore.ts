import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';
import * as THREE from 'three';

// Define the structure of the schools_formatted.json data
export interface SchoolData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  websiteUrl: string;
  state: string;
  programTypes: string[];
}

// Import the formatted school data
import schoolsData from '@/../public/data/schools_formatted.json';

// Import the enhanced data directly
import enhancedSchoolsData from '@/../public/data/enhanced_german_art_schools.json';

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
  // Enhanced data properties
  programs?: Array<{
    name: string;
    degree: string;
    applicationDeadlines: {
      winter?: { start: string; end: string };
      summer?: { start: string; end: string };
    };
    language: string;
    duration: string;
    description?: string;
    specializations?: string[];
  }>;
}

// Visualization mode type
export type VisualizationMode = 'network' | 'd3-force';

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
  uniqueStates: string[];
  visualizationMode: VisualizationMode;
  uniqueProgramTypes: string[];
  introComplete: boolean;
  expandedPanel: string | null;
  nodePositions: Map<string, THREE.Vector3>;

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
  setIntroComplete: (complete: boolean) => void;
  setExpandedPanel: (panelId: string | null) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;

  setNodePositions: (positions: Map<string, THREE.Vector3>) => void; // Use THREE.Vector3
  initializeStore: () => Promise<void>;
}

// Define the store creator with explicit types for set and get
const schoolStoreCreator: StateCreator<SchoolStore> = (set, get) => ({
  // --- Initial State ---
  isLoading: true, // Start in loading state
  processedUniversities: [],
  universityMap: new Map(),
  selectedUniversity: null,
  hoverUniversityName: null,
  connectionLines: [],
  controlsEnabled: false, // Start with controls disabled
  cameraPosition: [0, 0, 25], // Move camera closer
  cameraTarget: [0, 0, 0], // Default camera target
  activeStateFilter: null,
  activeProgramFilter: null,
  uniqueStates: [],
  uniqueProgramTypes: [],
  introComplete: false,
  expandedPanel: null,
  visualizationMode: 'network', // Default to network visualization

  nodePositions: new Map<string, THREE.Vector3>(), // Use THREE.Vector3

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
  setIntroComplete: (complete) => set({ introComplete: complete }),
  setExpandedPanel: (panelId) => set({ expandedPanel: panelId }),
  setVisualizationMode: (mode: VisualizationMode) => set({ visualizationMode: mode }),

  setNodePositions: (positions) => set({ nodePositions: positions }),

  // --- Initialization Action ---
  initializeStore: async () => {
    // Prevent re-initialization if already loaded
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

        // Try to use enhanced data first
        try {
            // Process the enhanced data into the format we need
            const enhancedData = enhancedSchoolsData;
            processedList = Object.entries(enhancedData.universities).map(([name, data]: [string, any]) => {
                // Determine school type based on program types
                let type = data.type || 'university';
                if (type === 'academy' || type === 'kunsthochschule') {
                    type = 'art_academy';
                } else if (type === 'university_of_arts') {
                    type = 'art_academy';
                } else if (type.includes('design')) {
                    type = 'design_school';
                }

                return {
                    id: data.id || name.toLowerCase().replace(/\s+/g, '-'),
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
                    programs: data.programs || []
                };
            });
            console.log('Successfully loaded enhanced data with', processedList.length, 'universities');
        } catch (enhancedError) {
            console.warn('Could not load enhanced data, falling back to basic data:', enhancedError);

            // Fall back to basic data
            // Cast the imported data to the correct type
            const rawData = schoolsData as SchoolData[];

            // Process each school from the formatted data
            rawData.forEach((school) => {
                // Determine school type based on program types
                let type = 'university';
                if (school.programTypes.some(p =>
                    p.toLowerCase().includes('fine arts') ||
                    p.toLowerCase().includes('kunst'))) {
                    type = 'art_academy';
                } else if (school.programTypes.some(p =>
                    p.toLowerCase().includes('design') ||
                    p.toLowerCase().includes('media'))) {
                    type = 'design_school';
                }

                const processedUni: ProcessedUniversity = {
                    id: school.id,
                    name: school.name,
                    location: [school.latitude, school.longitude],
                    type,
                    state: school.state,
                    programCount: school.programTypes.length,
                    website: school.websiteUrl,
                    programTypes: school.programTypes,
                };

                processedList.push(processedUni);
            });
        }

        // Process the list to extract states and programs
        processedList.forEach(uni => {
            map.set(uni.name, uni);
            states.add(uni.state);
            uni.programTypes.forEach(p => programs.add(p));
        });

        const uniqueStatesArray = Array.from(states).sort();
        const uniqueProgramTypesArray = Array.from(programs).sort();

        console.log(`Processed ${processedList.length} universities. Found ${uniqueStatesArray.length} states and ${uniqueProgramTypesArray.length} program types.`);

        set({
            processedUniversities: processedList,
            universityMap: map,
            uniqueStates: uniqueStatesArray,
            uniqueProgramTypes: uniqueProgramTypesArray,
            isLoading: false,
            controlsEnabled: true, // Enable controls after successful initialization
            nodePositions: new Map<string, THREE.Vector3>(), // Reset nodePositions
        });

    } catch (error) {
        console.error("Failed to initialize SchoolStore:", error);
        set({ isLoading: false });
    }
  },
});

export const useSchoolStore = create<SchoolStore>(schoolStoreCreator);
