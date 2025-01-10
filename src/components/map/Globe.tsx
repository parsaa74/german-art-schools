'use client'

import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import dynamic from 'next/dynamic';

const UniversityNodes = dynamic(() => import('./UniversityNodes'), { 
    ssr: false,
    loading: () => null
});

interface GlobeProps {
    radius?: number;
}

export default function Globe({ radius = 5 }: GlobeProps) {
    const globeRef = useRef<THREE.Group>(null);

    return (
        <group ref={globeRef}>
            {/* Base globe sphere */}
            <mesh>
                <sphereGeometry args={[radius, 64, 64]} />
                <meshPhysicalMaterial
                    color="#eeeeff"
                    transparent
                    opacity={0.6}
                    metalness={0.3}
                    roughness={0.4}
                    envMapIntensity={1.5}
                    transmission={0.6}
                    ior={1.5}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <Suspense fallback={null}>
                {/* University nodes */}
                <UniversityNodes radius={radius + 0.01} color="#00ffd5" />
            </Suspense>

            {/* Lighting */}
            <ambientLight intensity={0.15} />
            <directionalLight position={[10, 10, 5]} intensity={0.6} />
            <pointLight position={[0, 0, 10]} intensity={1} color="#ffffff" distance={20} />
            <pointLight position={[10, 5, 0]} intensity={0.8} color="#00ffd5" distance={15} />
            <pointLight position={[-10, -5, 0]} intensity={0.8} color="#4400ff" distance={15} />
        </group>
    );
} 