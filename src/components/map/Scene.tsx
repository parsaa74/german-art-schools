'use client'

import dynamic from 'next/dynamic';
import { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { 
  EffectComposer, 
  Bloom, 
  BrightnessContrast, 
  ChromaticAberration,
  HueSaturation,
  Vignette,
  Noise,
  ColorDepth,
  SMAA,
  DepthOfField
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize, Resolution } from 'postprocessing';
import * as THREE from 'three';
import { create } from 'zustand';
import type { School } from '@/types/school';
import { ErrorBoundary } from 'react-error-boundary';

// Dynamic imports to prevent server component issues
const Globe = dynamic(() => import('./Globe'), { ssr: false });
const Background = dynamic(() => import('./Background'), { ssr: false });
const UniversityNodes = dynamic(() => import('./UniversityNodes'), { ssr: false });
const ParticleFlow = dynamic(() => import('./ParticleFlow'), { ssr: false });
const GestureController = dynamic(() => import('./GestureController').then(mod => mod.GestureController), { ssr: false });

// Constants
const GLOBE_RADIUS = 5;

// Define types
interface University {
  id: string;
  name: string;
  location: [number, number]; // [longitude, latitude]
  type: 'University' | 'University of Applied Sciences' | 'Art Academy' | 'Private Institution' | 'Kunsthochschule';
  programType: 
    | 'Design'
    | 'Design & Architecture'
    | 'Art & Design'
    | 'Fine Arts'
    | 'Media Arts'
    | 'Design & Media'
    | 'Graphic Design'
    | 'Multidisciplinary Arts'
    | 'Art Therapy'
    | 'Contemporary Art'
    | 'Visual Arts'
    | 'Technology & Media'
    | 'Technology & Sciences'
    | 'Engineering'
    | 'Design & Engineering'
    | 'Humanities'
    | 'Engineering & Social Sciences'
    | 'Technology & Automotive'
    | 'Social & Health Sciences'
    | 'Liberal Arts'
    | 'Performing Arts'
    | 'Arts & Social Sciences'
    | 'Engineering & Technology'
    | 'Fine Arts & Conservation';
  region: string;
  language: 'German Only' | 'English Only' | 'German & English' | 'English & German' | 'Bilingual';
  description: string;
}

interface UniversityPosition extends University {
  position: THREE.Vector3;
}

// Create filter store
interface FilterStore {
  filteredUniversities: University[];
  setFilteredUniversities: (universities: University[]) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  filteredUniversities: [],
  setFilteredUniversities: (universities) => set({ filteredUniversities: universities }),
}));

function convertToSchool(university: University): School {
  return {
    id: university.id,
    name: university.name,
    lat: university.location[1],
    lng: university.location[0],
    city: university.region,
    state: university.region,
    type: university.type === 'Art Academy' ? 'academy' : 'university',
    programs: [{
      name: university.programType,
      degree: 'Bachelor/Master',
      applicationDeadlines: {},
      professors: [],
      tuitionFees: '',
      language: university.language,
      duration: '',
      description: university.description,
      specializations: []
    }],
    professors: [],
    description: university.description
  };
}

function ErrorFallback() {
  return null; // Silent fallback for 3D components
}

function useDynamicCamera() {
  const { camera } = useThree()
  const targetZoom = useRef(15)
  const currentZoom = useRef(15)
  const time = useRef(0)
  const initialCameraPosition = useRef(camera.position.clone())
  
  useFrame((state, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return
    
    // Update time for organic motion
    time.current += delta * 0.5
    
    // Get the current distance from target
    const distance = camera.position.length()
    targetZoom.current = distance
    
    // Smoothly interpolate current zoom
    currentZoom.current += (targetZoom.current - currentZoom.current) * 0.1
    
    // Calculate zoom factor based on smoothed zoom
    const zoomFactor = Math.max(0, (currentZoom.current - 6.5) / (25 - 6.5))
    
    // Add organic floating motion
    const floatX = Math.sin(time.current * 0.5) * 0.2 + Math.cos(time.current * 0.3) * 0.1
    const floatY = Math.cos(time.current * 0.4) * 0.2 + Math.sin(time.current * 0.2) * 0.1
    const floatZ = Math.sin(time.current * 0.3) * 0.1
    
    // Apply floating motion relative to current position
    const floatIntensity = 1 - (zoomFactor * 0.5) // Reduce floating as we zoom in
    camera.position.x += (floatX * floatIntensity - camera.position.x) * 0.01
    camera.position.y += (floatY * floatIntensity - camera.position.y) * 0.01
    camera.position.z += (floatZ * floatIntensity - camera.position.z) * 0.01
    
    // Dynamic field of view with artistic transitions
    const baseFov = 35
    const fovVariation = Math.sin(time.current * 0.2) * 2
    const targetFov = baseFov + (zoomFactor * 15) + fovVariation
    camera.fov += (targetFov - camera.fov) * 0.1
    
    // Dynamic near and far planes with smooth transitions
    const targetNear = 0.1 + (zoomFactor * 0.9)
    const targetFar = 100 + (zoomFactor * 100)
    
    camera.near += (targetNear - camera.near) * 0.1
    camera.far += (targetFar - camera.far) * 0.1
    
    // Add subtle rotation based on mouse movement
    const mouseX = state.mouse.x * 0.1
    const mouseY = state.mouse.y * 0.1
    camera.rotation.x += (mouseY - camera.rotation.x) * 0.02
    camera.rotation.y += (mouseX - camera.rotation.y) * 0.02
    
    camera.updateProjectionMatrix()
  })
}

function Scene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { filteredUniversities } = useFilterStore();
  const [hoveredUniversity, setHoveredUniversity] = useState<string | null>(null);

  // Add effect to initialize filtered universities
  useEffect(() => {
    // Import and set initial universities
    import('./UniversityNodes').then(({ UNIVERSITIES }) => {
      useFilterStore.getState().setFilteredUniversities(UNIVERSITIES);
    });
  }, []);

  // Add debug logging
  useEffect(() => {
    console.log('Filtered Universities:', filteredUniversities);
  }, [filteredUniversities]);

  const schoolsData = useMemo(() => 
    filteredUniversities.map(convertToSchool),
    [filteredUniversities]
  );

  // Convert universities to the required formats
  const universitiesWithPositions: UniversityPosition[] = filteredUniversities.map((uni: University) => {
    const [lng, lat] = uni.location;
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const position = new THREE.Vector3(
      -GLOBE_RADIUS * Math.sin(phi) * Math.cos(theta),
      GLOBE_RADIUS * Math.cos(phi),
      GLOBE_RADIUS * Math.sin(phi) * Math.sin(theta)
    );

    return {
      ...uni,
      position
    };
  });

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const { clientWidth, clientHeight } = canvasRef.current;
        canvasRef.current.width = clientWidth;
        canvasRef.current.height = clientHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas
        ref={canvasRef}
        camera={{
          position: [0, 0, 15],
          fov: 35,
          near: 0.1,
          far: 100
        }}
        gl={{
          antialias: true,
          alpha: true,
          stencil: false,
          depth: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
          pixelRatio: Math.min(window.devicePixelRatio, 2)
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000000']} />
        
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={null}>
            <DynamicCameraController />
            
            <Background />
            <Globe radius={GLOBE_RADIUS} />
            {filteredUniversities.length > 0 && (
              <UniversityNodes 
                radius={GLOBE_RADIUS} 
                filteredUniversities={filteredUniversities} 
                onHover={setHoveredUniversity} 
              />
            )}
            <ParticleFlow universities={schoolsData} radius={GLOBE_RADIUS} />
            <GestureController />

            <EffectComposer multisampling={8}>
              <SMAA />
              <Bloom 
                intensity={0.8}
                luminanceThreshold={0.4}
                luminanceSmoothing={0.3}
                kernelSize={KernelSize.LARGE}
                blendFunction={BlendFunction.SCREEN}
              />
              <ChromaticAberration
                offset={new THREE.Vector2(0.0005, 0.0005)}
                radialModulation={false}
                modulationOffset={1.0}
                blendFunction={BlendFunction.NORMAL}
              />
              <BrightnessContrast 
                brightness={0.1}
                contrast={0.2}
              />
              <HueSaturation
                hue={0}
                saturation={0.2}
                blendFunction={BlendFunction.NORMAL}
              />
              <ColorDepth
                bits={16}
                blendFunction={BlendFunction.NORMAL}
              />
              <Noise
                premultiply
                blendFunction={BlendFunction.OVERLAY}
                opacity={0.03}
              />
              <Vignette
                darkness={0.35}
                offset={0.2}
              />
            </EffectComposer>
          </Suspense>
        </ErrorBoundary>
        
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={6.5}
          maxDistance={25}
          rotateSpeed={0.3}
          zoomSpeed={0.5}
          dampingFactor={0.15}
          enableDamping={true}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}

function DynamicCameraController() {
  useDynamicCamera()
  return null
}

export default Scene; 