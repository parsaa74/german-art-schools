'use client'

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { audioSystem } from '../audio/AudioSystem';
import ArtisticGlobeMaterial from './shaders/ArtisticGlobeMaterial';

interface UniversityPosition {
    position: THREE.Vector3;
    id: string;
}

interface GlobeProps {
    radius?: number;
    universities?: UniversityPosition[];
    filteredCount?: number;
    disciplines?: string[];
}

export default function Globe({ radius = 5, universities = [], filteredCount = 0, disciplines = [] }: GlobeProps) {
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const mousePosition = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
    const mouseStrength = useRef<number>(0);
    const time = useRef<number>(0);
    const targetMouseStrength = useRef<number>(0);
    const lastAudioValues = useRef({ intensity: 0, low: 0, mid: 0, high: 0 });

    // Calculate arts/science ratio with smoother transitions
    const getArtsScienceRatio = useMemo(() => {
        if (!disciplines.length) return 0.5;
        const artsCount = disciplines.filter(d => 
            ['fine_arts', 'design', 'architecture', 'music', 'theater'].includes(d.toLowerCase())
        ).length;
        return artsCount / disciplines.length;
    }, [disciplines]);

    // Enhanced mouse interaction
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const x = (event.clientX / window.innerWidth) * 2 - 1;
            const y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Extra smooth mouse movement with spring physics
            const springStrength = 0.08;
            const velocity = 0.92;
            
            mousePosition.current.x += (x - mousePosition.current.x) * springStrength;
            mousePosition.current.y += (y - mousePosition.current.y) * springStrength;
            mousePosition.current.multiplyScalar(velocity);
            
            targetMouseStrength.current = 0.8;
        };

        const handleMouseLeave = () => {
            targetMouseStrength.current = 0.0;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    // Enhanced material updates with smooth transitions
    useFrame((state, delta) => {
        time.current += delta * 0.2;

        // Smooth mouse strength transition with spring physics
        const springStrength = 0.05;
        const dampening = 0.92;
        mouseStrength.current += (targetMouseStrength.current - mouseStrength.current) * springStrength;
        mouseStrength.current *= dampening;

        if (materialRef.current) {
            const uniforms = materialRef.current.uniforms;
            
            uniforms.time.value = time.current;
            uniforms.mousePosition.value.copy(mousePosition.current);
            uniforms.mouseStrength.value = mouseStrength.current;
            
            // Enhanced audio reactions with smooth transitions
            const bands = audioSystem.getFrequencyBands();
            const intensity = audioSystem.getAudioIntensity();
            
            // Smooth audio transitions
            const audioLerpFactor = 0.1;
            lastAudioValues.current.intensity += (intensity - lastAudioValues.current.intensity) * audioLerpFactor;
            lastAudioValues.current.low += (bands.low - lastAudioValues.current.low) * audioLerpFactor;
            lastAudioValues.current.mid += (bands.mid - lastAudioValues.current.mid) * audioLerpFactor;
            lastAudioValues.current.high += (bands.high - lastAudioValues.current.high) * audioLerpFactor;
            
            uniforms.audioIntensity.value = lastAudioValues.current.intensity * 0.2;
            uniforms.audioLowBand.value = lastAudioValues.current.low * 0.25;
            uniforms.audioMidBand.value = lastAudioValues.current.mid * 0.2;
            uniforms.audioHighBand.value = lastAudioValues.current.high * 0.15;

            // Rich color palette based on discipline ratio with smooth transitions
            const artRatio = getArtsScienceRatio;
            const colorLerpFactor = 0.05;
            
            if (artRatio > 0.7) {
                // Artistic - deep purple to pink
                uniforms.baseColor.value.lerp(new THREE.Color('#1a1a2e'), colorLerpFactor);
                uniforms.accentColor.value.lerp(new THREE.Color('#4a4a8a'), colorLerpFactor);
                uniforms.highlightColor.value.lerp(new THREE.Color('#ff6b8b'), colorLerpFactor);
            } else if (artRatio < 0.3) {
                // Scientific - deep blue to cyan
                uniforms.baseColor.value.lerp(new THREE.Color('#1a1a2e'), colorLerpFactor);
                uniforms.accentColor.value.lerp(new THREE.Color('#4a4a8a'), colorLerpFactor);
                uniforms.highlightColor.value.lerp(new THREE.Color('#64ffda'), colorLerpFactor);
            } else {
                // Balanced - deep purple to blue
                uniforms.baseColor.value.lerp(new THREE.Color('#1a1a2e'), colorLerpFactor);
                uniforms.accentColor.value.lerp(new THREE.Color('#4a4a8a'), colorLerpFactor);
                uniforms.highlightColor.value.lerp(new THREE.Color('#8a8aff'), colorLerpFactor);
            }

            // Add subtle pulsing effect based on audio
            const pulseScale = 1 + lastAudioValues.current.intensity * 0.05;
            state.camera.position.normalize().multiplyScalar(15 * pulseScale);
        }
    });

    return (
        <mesh>
            <sphereGeometry args={[radius, 128, 128]} />
            <primitive
                object={new ArtisticGlobeMaterial()}
                ref={materialRef}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                attach="material"
            />
        </mesh>
    );
}