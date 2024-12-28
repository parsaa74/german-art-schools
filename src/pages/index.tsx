import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const GermanyMap = dynamic(
  () => import('@/components/Map/GermanyMap'),
  { ssr: false }
);

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{
          position: [0, 0, 2],
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        style={{
          background: '#1a1a1a'
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <GermanyMap />
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minDistance={1.5}
            maxDistance={4}
          />
        </Suspense>
      </Canvas>
    </div>
  );
} 