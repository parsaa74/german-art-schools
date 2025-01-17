import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ParticleFlowMaterial } from './shaders/ParticleFlowMaterial';
import type { University } from './UniversityNodes';

interface ExchangeParticlesProps {
    universities: University[];
    radius: number;
    hoveredUniversity: string | null;
}

const PARTICLES_PER_CONNECTION = 50;
const MIN_PARTICLES = 20;
const MAX_PARTICLES = 200;

export function ExchangeParticles({ universities, radius, hoveredUniversity }: ExchangeParticlesProps) {
    const materialRef = useRef<ParticleFlowMaterial>(null);
    const pointsRef = useRef<THREE.Points>(null);

    // Generate connections and particles
    const { geometry, connections } = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const connections: Array<{
            start: THREE.Vector3;
            end: THREE.Vector3;
            strength: number;
        }> = [];

        if (!hoveredUniversity) return { geometry, connections };

        const sourceUni = universities.find(u => u.name === hoveredUniversity);
        if (!sourceUni) return { geometry, connections };

        // Find universities with shared program types
        universities.forEach(targetUni => {
            if (targetUni.name === hoveredUniversity) return;

            // Calculate connection strength based on shared program types
            const sourceType = sourceUni.programType;
            const targetType = targetUni.programType;
            
            if (sourceType === targetType) {
                const sourcePos = latLngToVector3(sourceUni.location[1], sourceUni.location[0], radius);
                const targetPos = latLngToVector3(targetUni.location[1], targetUni.location[0], radius);
                
                connections.push({
                    start: sourcePos,
                    end: targetPos,
                    strength: 1.0
                });
            }
        });

        // If no connections were found, don't create any particles
        if (connections.length === 0) {
            return { geometry, connections };
        }

        // Generate particles for each connection
        const totalParticles = connections.length * PARTICLES_PER_CONNECTION;
        const clampedParticles = Math.min(Math.max(totalParticles, MIN_PARTICLES), MAX_PARTICLES);
        
        const positions = new Float32Array(clampedParticles * 3);
        const startPositions = new Float32Array(clampedParticles * 3);
        const endPositions = new Float32Array(clampedParticles * 3);
        const sizes = new Float32Array(clampedParticles);
        const speeds = new Float32Array(clampedParticles);
        const offsets = new Float32Array(clampedParticles);
        const lives = new Float32Array(clampedParticles);

        for (let i = 0; i < clampedParticles; i++) {
            const connectionIndex = i % connections.length;
            const connection = connections[connectionIndex];
            
            // Set initial position at start
            const startPos = connection.start;
            const endPos = connection.end;
            
            startPositions[i * 3] = startPos.x;
            startPositions[i * 3 + 1] = startPos.y;
            startPositions[i * 3 + 2] = startPos.z;
            
            endPositions[i * 3] = endPos.x;
            endPositions[i * 3 + 1] = endPos.y;
            endPositions[i * 3 + 2] = endPos.z;
            
            // Random initial position along the path
            const progress = Math.random();
            positions[i * 3] = startPos.x + (endPos.x - startPos.x) * progress;
            positions[i * 3 + 1] = startPos.y + (endPos.y - startPos.y) * progress;
            positions[i * 3 + 2] = startPos.z + (endPos.z - startPos.z) * progress;
            
            sizes[i] = 0.05 + Math.random() * 0.05;
            speeds[i] = 0.2 + Math.random() * 0.3;
            offsets[i] = Math.random();
            lives[i] = 0.3 + Math.random() * 0.7;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('startPosition', new THREE.BufferAttribute(startPositions, 3));
        geometry.setAttribute('endPosition', new THREE.BufferAttribute(endPositions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));
        geometry.setAttribute('life', new THREE.BufferAttribute(lives, 1));

        return { geometry, connections };
    }, [universities, radius, hoveredUniversity]);

    // Animate particles
    useFrame((state, delta) => {
        if (materialRef.current) {
            materialRef.current.uniforms.time.value += delta;
            materialRef.current.uniforms.progress.value = (state.clock.elapsedTime % 1);
        }
    });

    if (connections.length === 0) return null;

    return (
        <points ref={pointsRef}>
            <primitive object={geometry} attach="geometry" />
            <primitive ref={materialRef} object={new ParticleFlowMaterial()} attach="material" />
        </points>
    );
}

// Helper function to convert lat/lng to 3D position
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
} 