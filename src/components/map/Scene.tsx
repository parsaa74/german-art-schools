'use client'

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('./Globe'), { 
    ssr: false,
    loading: () => <mesh>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial color="#eeeeff" opacity={0.5} transparent />
    </mesh>
});

const Background = dynamic(() => import('./Background'), { 
    ssr: false,
    loading: () => null
});

export default function Scene() {
    return (
        <div style={{ 
            width: '100%', 
            height: '100vh',
            background: 'linear-gradient(135deg, #000022 0%, #0a0442 50%, #000033 100%)'
        }}>
            <Canvas
                camera={{
                    position: [0, 0, 15],
                    fov: 45,
                    near: 0.1,
                    far: 1000
                }}
                gl={{ antialias: true }}
            >
                <color attach="background" args={['#000022']} />
                <fog attach="fog" args={['#000022', 10, 50]} />
                
                <Suspense fallback={null}>
                    <Background />
                    <Globe />
                    
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        minDistance={6}
                        maxDistance={50}
                        rotateSpeed={0.4}
                        target={[0, 0, 0]}
                        autoRotate
                        autoRotateSpeed={0.5}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
} 