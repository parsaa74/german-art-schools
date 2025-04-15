# German Art Schools Map - Project Architecture

This document outlines the architecture and file structure of the German Art Schools Map project.

## 1. Overview

The project is a web application built with **Next.js** (using the App Router primarily, with some residual Pages Router configuration) and **React**. It displays an interactive 3D globe visualizing German art schools, allowing users to explore schools and their programs. The application is designed for static export and deployment, likely targeting GitHub Pages.

## 2. Core Technologies

- **Framework:** [Next.js](https://nextjs.org/) (v13+) with React (v18+)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with PostCSS. Global styles and utility classes.
- **UI Components:** [Shadcn/ui](https://ui.shadcn.com/) for UI primitives (Badge, Card, Dialog, etc.). Potentially some legacy Chakra UI or Styled Components usage (based on dependencies).
- **3D Globe/Visualization:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) (`@react-three/fiber`), [Drei](https://github.com/pmndrs/drei) (`@react-three/drei`), [Three.js](https://threejs.org/).
- **Mapping/Geography:** [D3.js (d3-geo)](https://github.com/d3/d3-geo), [Turf.js](https://turfjs.org/) for geospatial operations. GeoJSON data is used for map boundaries.
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) for managing global application state (e.g., map interactions, selected school).
- **Deployment:** Configured for static export (`output: "export"` in `next.config.js`) using `gh-pages` for deployment (likely to GitHub Pages).

## 3. Project Structure (`src` directory)

```
src/
├── app/                 # Next.js App Router: Core routing and layouts
│   ├── globals.css      # Global styles (Tailwind base/utilities)
│   ├── layout.tsx       # Root application layout
│   └── page.tsx         # Main page component (likely hosts the map)
├── components/          # Reusable React components
│   ├── map/             # Components specific to the 3D map/globe
│   │   ├── Globe.tsx          # Main 3D globe component setup
│   │   ├── UniversityNodes.tsx# Renders school markers on the globe
│   │   ├── Scene.tsx          # Three.js scene setup
│   │   ├── Background.tsx     # Background elements for the scene
│   │   ├── ClientWrapper.tsx  # Wrapper for client-side only components
│   │   ├── entities/        # Specific visual elements (e.g., SchoolMarker.tsx)
│   │   └── layers/          # Base map layers (e.g., GlobeBase.tsx)
│   ├── Sidebar/         # Sidebar UI component
│   ├── ui/              # UI primitives (likely Shadcn/ui components)
│   ├── App.tsx          # Potentially a top-level wrapper (less common with App Router)
│   └── SchoolDetails.tsx# Component to display details of a selected school
├── config/              # Application configuration (e.g., constants, settings)
│   └── index.ts
├── constants/           # Constant values used across the app
│   └── map.ts           # Map-specific constants
├── data/                # Static data sources
│   ├── programs.ts      # Data for academic programs
│   └── schools.ts       # Data for the art schools
├── hooks/               # Custom React hooks
│   └── useGermanyMap.ts # Hook related to map logic/data
├── lib/                 # Utility functions and libraries
│   ├── utils.ts         # General utility functions
│   ├── geo-utils.ts     # Geospatial calculation utilities
│   ├── mapProjection.ts # Map projection logic (likely D3)
│   └── geo/             # More specific geo utilities (e.g., coordinates.ts)
├── pages/               # Next.js Pages Router files (potentially legacy or for specific overrides)
│   ├── _app.tsx         # Custom App component (Pages Router global wrapper)
│   └── _document.tsx    # Custom Document component (Pages Router HTML structure)
├── services/            # Services for data fetching or external interactions
│   └── SearchService.ts # Service for searching schools/programs
├── stores/              # Zustand state management stores
│   ├── mapStore.ts      # State related to map view/interactions
│   └── schoolStore.ts   # State related to selected school/data
├── styles/              # Styling files
│   ├── global.css       # Additional global styles
│   └── globals.css      # (Duplicate or alternative global styles - check usage)
├── types/               # TypeScript type definitions
│   ├── common.ts
│   ├── index.ts
│   ├── map.ts
│   ├── school.ts
│   └── StudentProfile.ts
└── utils/               # More utility functions
    ├── imageLoader.ts   # Utility for loading images (potentially for Next/Image or Three.js)
    └── index.ts
```

## 4. Key File Responsibilities

- **`next.config.js`**: Configures Next.js build options, including static export (`output: "export"`), base path (`/german-art-schools` for GitHub Pages deployment), and image handling.
- **`package.json`**: Defines project dependencies, scripts (`dev`, `build`, `deploy`). The `deploy` script uses `gh-pages` to push the static build (`out/` directory) to GitHub Pages.
- **`tailwind.config.js` / `postcss.config.js`**: Configuration for Tailwind CSS.
- **`tsconfig.json`**: TypeScript compiler configuration.
- **`src/app/layout.tsx`**: Defines the root HTML structure and global layout for the application using the Next.js App Router.
- **`src/app/page.tsx`**: The main entry point page for the application, likely rendering the primary map interface.
- **`src/components/map/Globe.tsx`**: The core component responsible for setting up and rendering the React Three Fiber scene, including the 3D globe model, lighting, and camera controls.
- **`src/components/map/UniversityNodes.tsx`**: Fetches school data (likely from `src/data/schools.ts` or a store) and renders the corresponding markers or nodes onto the 3D globe, handling positioning based on coordinates.
- **`src/components/Sidebar/index.tsx`**: Renders the sidebar UI, potentially including search functionality, filters, and displaying lists of schools or programs.
- **`src/components/SchoolDetails.tsx`**: Displays detailed information about a school when selected by the user.
- **`src/data/schools.ts` / `src/data/programs.ts`**: Contain the static datasets for the German art schools and their respective programs.
- **`src/stores/mapStore.ts` / `src/stores/schoolStore.ts`**: Zustand stores managing global state related to map interactions (zoom, pan, selected elements) and the currently selected school's data.
- **`src/lib/geo-utils.ts` / `src/lib/mapProjection.ts`**: Contain functions for handling geographical data, converting coordinates, and projecting points onto the map/globe surface.
- **`public/`**: Contains static assets like images (logos), textures (for the globe), and GeoJSON files defining German state boundaries.

## 5. Data Flow

1.  **Initialization:** The main page (`src/app/page.tsx`) renders, likely setting up the main layout which includes the `Globe` component and the `Sidebar`.
2.  **Map Rendering:**
    - The `Globe` component initializes the React Three Fiber scene.
    - `GlobeBase` (or similar) might render the base map geometry using GeoJSON data from `public/data/`.
    - `UniversityNodes` fetches school data from `src/data/schools.ts` (possibly via `schoolStore`) and uses `mapProjection` utilities from `src/lib/` to calculate the 3D positions for each school marker on the globe. Markers are rendered using Three.js primitives or custom components (`src/components/map/entities/`).
3.  **User Interaction:**
    - User interacts with the globe (zoom, pan, click on a school marker). These interactions update the `mapStore`.
    - User interacts with the `Sidebar` (search, filter). These interactions might update `schoolStore` or trigger filtering logic.
4.  **State Updates:** Zustand stores (`mapStore`, `schoolStore`) are updated based on user interactions.
5.  **Component Re-rendering:** Components subscribed to the Zustand stores re-render to reflect the new state (e.g., highlighting a selected school marker, updating the `SchoolDetails` component, filtering the list in the `Sidebar`).

## 6. Deployment

The project is configured for static site generation. Running `npm run deploy` will:

1.  Build the Next.js application into static HTML/CSS/JS files in the `out/` directory (`next build` uses `output: "export"`).
2.  Create a `.nojekyll` file in `out/` (necessary for GitHub Pages).
3.  Use `gh-pages` to push the contents of the `out/` directory to the `gh-pages` branch of the repository, making it live on GitHub Pages at the configured `basePath` (`/german-art-schools`).
