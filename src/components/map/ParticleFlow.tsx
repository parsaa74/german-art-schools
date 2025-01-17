'use client'

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import ParticleFlowMaterial from './shaders/ParticleFlowMaterial';
import { School } from '@/types/school';

interface ParticleFlowProps {
    universities: School[];
    radius: number;
}

export default function ParticleFlow({ universities, radius }: ParticleFlowProps) {
    const pointsRef = useRef<THREE.Points>(null);
    const materialRef = useRef<ParticleFlowMaterial>(null);

    // Create particle system
    const { geometry, particleCount } = useMemo(() => {
        const maxConnections = 50; // Maximum number of connections to show
        const particlesPerLine = 50; // Number of particles per connection
        const particleCount = maxConnections * particlesPerLine;
        
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        
        // Generate random pairs of universities for connections
        const connections = [];
        for (let i = 0; i < maxConnections && universities.length >= 2; i++) {
            const idx1 = Math.floor(Math.random() * universities.length);
            let idx2 = Math.floor(Math.random() * (universities.length - 1));
            if (idx2 >= idx1) idx2++;
            
            connections.push([universities[idx1], universities[idx2]]);
        }

        // Create arrays for attributes
        const positions = new Float32Array(particleCount * 3);
        const startPositions = new Float32Array(particleCount * 3);
        const endPositions = new Float32Array(particleCount * 3);
        const randoms = new Float32Array(particleCount);

        // Fill arrays
        connections.forEach((connection, connectionIdx) => {
            const [uni1, uni2] = connection;
            const start = new THREE.Vector3(
                radius * Math.cos(uni1.lat * Math.PI / 180) * Math.cos(uni1.lng * Math.PI / 180),
                radius * Math.sin(uni1.lat * Math.PI / 180),
                radius * Math.cos(uni1.lat * Math.PI / 180) * Math.sin(uni1.lng * Math.PI / 180)
            );
            const end = new THREE.Vector3(
                radius * Math.cos(uni2.lat * Math.PI / 180) * Math.cos(uni2.lng * Math.PI / 180),
                radius * Math.sin(uni2.lat * Math.PI / 180),
                radius * Math.cos(uni2.lat * Math.PI / 180) * Math.sin(uni2.lng * Math.PI / 180)
            );

            for (let i = 0; i < particlesPerLine; i++) {
                const idx = (connectionIdx * particlesPerLine + i) * 3;
                
                // Set initial position (will be updated in shader)
                positions[idx] = start.x;
                positions[idx + 1] = start.y;
                positions[idx + 2] = start.z;
                
                // Store start and end positions
                startPositions[idx] = start.x;
                startPositions[idx + 1] = start.y;
                startPositions[idx + 2] = start.z;
                
                endPositions[idx] = end.x;
                endPositions[idx + 1] = end.y;
                endPositions[idx + 2] = end.z;
                
                // Random offset for each particle
                randoms[connectionIdx * particlesPerLine + i] = Math.random();
            }
        });

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('startPosition', new THREE.BufferAttribute(startPositions, 3));
        geometry.setAttribute('endPosition', new THREE.BufferAttribute(endPositions, 3));
        geometry.setAttribute('random', new THREE.BufferAttribute(randoms, 1));

        return { geometry, particleCount };
    }, [universities, radius]);

    // Animation loop
    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.time.value = state.clock.elapsedTime;
        }
    });

    return (
        <points ref={pointsRef}>
            <primitive object={geometry} attach="geometry" />
            <primitive object={new ParticleFlowMaterial()} ref={materialRef} attach="material" />
        </points>
    );
} 