# Development Plan: German Art Schools - Constellation of Creative Knowledge

**Project Goal:** Elevate the existing Three.js globe visualization into a conceptually rich, aesthetically sophisticated, and interactive digital art piece showcasing German Art, Media, and Design universities.

**Guiding Principles:**
*   **Artistic Vision:** Realize the "Constellation of Creative Knowledge" concept – ethereal, dynamic, abstract, emphasizing connections and energy.
*   **Minimalism & Maintainability:** Implement features using concise, clean, and professional code (`less1.mdc`). Prioritize elegance and avoid over-engineering.
*   **Target Quality:** Aim for a level of polish and conceptual depth comparable to high-quality interactive digital art installations.

**Current State Assessment:**
The codebase (Next.js, TypeScript, Three.js) appears well-structured with dedicated components for key elements (Globe, Nodes, InfoPanel, Connections, Background, PostProcessing, Stores). This provides a solid foundation for refinement and enhancement.

**Development Phases & Tasks:**

**Phase 1: Foundation & Data Verification**

1.  **Data Structure Validation:**
    *   **Task:** Verify that `public/data/schools_formatted.json` contains all required fields specified in `rule1.mdc`: `id`, `name`, `latitude`, `longitude`, `websiteUrl`, `state`, and `programTypes` (as an array).
    *   **Action:** If necessary, update the data source and potentially the `scripts/transform_data.mjs` script to ensure the JSON structure is correct.
    *   **Rationale:** Accurate and complete data is fundamental for features like filtering and the info panel.
2.  **Core Scene Refinement:**
    *   **Task:** Review and clean up the main scene setup (`src/components/map/Scene.tsx`, `src/components/map/SceneContent.tsx`). Ensure the basic Three.js setup, camera controls, and component mounting are robust and organized.
    *   **Rationale:** A clean foundation simplifies adding complex visual and interactive layers.

**Phase 2: Core Visuals & Aesthetics**

*   *Goal: Establish the core artistic look and feel.*

1.  **Abstract Network Graph Visualization:**
    *   **Task:** Implement the primary visualization as an abstract 3D force-directed network graph instead of a globe.
    *   **Action:** Utilize and refine the existing `src/components/map/NetworkGraph.tsx` component. Ensure it uses `d3-force-3d` to calculate node positions dynamically. Integrate this component into the main scene (`SceneContent.tsx` or `Scene.tsx`). Remove the `Globe` component.
    *   **Minimalism:** Focus on clear node representation and smooth simulation.
2.  **Network Node Visuals:**
    *   **Task:** Represent universities as dynamic, luminous nodes within the network graph.
    *   **Action:** Refine the rendering within `NetworkGraph.tsx` (using `THREE.Points` or instanced meshes). Apply shaders or textures for effects like pulsing, glow, or shimmer. Ensure visual distinction for hover/selected states. Link visual properties (size, brightness) minimally to data if conceptually relevant.
3.  **Dynamic Background:**
    *   **Task:** Replace the static background with a dynamic, atmospheric one.
    *   **Action:** Update `src/components/map/Background.tsx`. Implement either a subtle particle field (using Three.js Points) or a full-screen shader (e.g., abstract nebula, geometric patterns). Ensure it complements, not distracts from, the main globe.
4.  **Color Palette & Lighting:**
    *   **Task:** Define and implement the refined color palette and atmospheric lighting.
    *   **Action:** Update styles (`src/app/globals.css`, Tailwind config) and lighting setup within `src/components/map/Scene.tsx`. Focus on dark backgrounds with vibrant, luminous highlights as suggested in `rule1.mdc`.
5.  **Post-Processing:**
    *   **Task:** Add subtle post-processing effects to enhance the mood.
    *   **Action:** Configure effects like bloom, potentially subtle depth of field or grain using the existing `src/components/map/PostProcessing.tsx` component. Keep effects minimal and performant.

**Phase 3: Interaction Refinement**

*   *Goal: Create smooth, engaging, and informative interactions.*

1.  **Globe Interaction:**
    *   **Task:** Refine globe rotation and zoom controls for a tactile feel.
    *   **Action:** Review/update logic likely within `src/components/map/SceneEventHandler.tsx`. Implement smooth damping/inertia (e.g., using `react-three-drei`'s controls or custom logic).
2.  **Node Hover Interaction:**
    *   **Task:** Implement clear node highlighting and smooth label display on hover.
    *   **Action:** In `SchoolNodes.tsx` / `SceneEventHandler.tsx`, trigger visual changes on hover (e.g., increased brightness/scale via shader uniforms or scale property). Ensure the university name label (`src/components/typography/SubText.tsx`?) appears smoothly (fade/scale transition) and is well-positioned.
3.  **Node Click Interaction & Info Panel:**
    *   **Task:** Implement a distinct click effect and redesign the information display.
    *   **Action:**
        *   Trigger a visual effect on click (e.g., brief intensification, ripple effect) handled in `SchoolNodes.tsx` / `SceneEventHandler.tsx`.
        *   Replace or significantly refactor the existing info pop-up (`src/components/map/InfoPanel.tsx` or `src/components/map/SchoolInfo.tsx`). Design an integrated overlay/panel matching the overall aesthetic (semi-transparent, shared typography/colors).
        *   Implement smooth appearance/disappearance animations (slide, fade, unfold).
        *   Display all required content: Name, City/State, Website Link (button/link), Program Types (tags/list).
        *   Ensure easy dismissal (click outside, 'X' button).

**Phase 4: Network Connections & Filtering**

*   *Goal: Introduce the "Network" aspect and user-driven exploration.*

1.  **Visual Connections:**
    *   **Task:** Implement subtle visual connections between nodes.
    *   **Action:** Update `src/components/map/ConnectionLines.tsx` (or potentially `NetworkGraph.tsx`). On node hover/click, draw animated lines/arcs (e.g., using `Line` geometry with custom shaders for light trails) connecting to nearby nodes or potentially related ones (if data/logic allows simply). Keep this effect subtle.
2.  **Filtering Implementation:**
    *   **Task:** Add functionality to filter universities by State (`state`) and Program Type (`programTypes`).
    *   **Action:**
        *   Implement filtering logic, likely updating state in `src/stores/schoolStore.ts` or `mapStore.ts`.
        *   Update `SchoolNodes.tsx` and `ConnectionLines.tsx` to react to the filtered state (e.g., dimming non-selected nodes, showing connections only between filtered nodes).
        *   Create minimal UI controls (e.g., dropdowns, toggle buttons) for triggering filters, perhaps integrated into the main `src/components/Map.tsx` component.

**Phase 5: Sound Design & Polishing (Optional but Recommended)**

1.  **Audio Integration:**
    *   **Task:** Add subtle ambient sound and interaction sound effects.
    *   **Action:** Use the Web Audio API. Create a simple audio manager utility/hook. Integrate a looping ambient track (`public/audio/ambient_loop.mp3` exists) and trigger short, subtle sounds on hover, click, and potentially globe rotation/filtering actions.
2.  **Performance Optimization:**
    *   **Task:** Ensure the experience runs smoothly.
    *   **Action:** Profile performance (GPU/CPU usage, frame rate). Optimize shaders, reduce draw calls (instancing is key), potentially implement level-of-detail (LOD) if needed, though aim for simplicity first.
3.  **Responsiveness:**
    *   **Task:** Ensure the UI adapts gracefully to different screen sizes.
    *   **Action:** Use responsive CSS techniques (Tailwind is likely used). While the 3D scene might be primarily desktop-focused, UI elements (info panel, filters) should not break on smaller viewports.
4.  **Code Cleanup & Documentation:**
    *   **Task:** Refactor code for clarity and maintainability. Add comments.
    *   **Action:** Review components, remove unused code, ensure consistency. Add JSDoc comments for complex functions/components. Update `README.md` or create `ARCHITECTURE.md` with setup instructions and explanations.

**Phase 6: Final Review & Delivery**

1.  **Quality Assurance:**
    *   **Task:** Thoroughly test all features against the requirements in `rule1.mdc`.
    *   **Action:** Check visuals, interactions, filtering, performance, and responsiveness across different browsers (if possible). Ensure conceptual coherence.
2.  **Deliverables:**
    *   **Task:** Prepare the final project files.
    *   **Action:** Ensure all source code (TSX, CSS, GLSL), the final JSON data file, and running instructions are included and well-organized.
