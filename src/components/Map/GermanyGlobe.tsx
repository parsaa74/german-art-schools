import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import GermanyMap from './GermanyMap';

const LoadingFallback: React.FC = () => (
  <mesh>
    <sphereGeometry args={[1, 32, 32]} />
    <meshStandardMaterial color="#444444" wireframe />
  </mesh>
);

const GermanyGlobe: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ensure all Three.js components are loaded
    const loadComponents = async () => {
      try {
        await Promise.all([
          import('@react-three/fiber'),
          import('@react-three/drei'),
          import('three')
        ]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading components:', error);
      }
    };
    loadComponents();
  }, []);

  if (isLoading) {
    return <div>Loading required components...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#111111' }}>
      <Canvas
        camera={{
          position: [0, 0, 2.5],
          fov: 45,
          near: 0.1,
          far: 1000
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Suspense fallback={<LoadingFallback />}>
          <GermanyMap />
        </Suspense>
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          zoomSpeed={0.6}
          panSpeed={0.5}
          rotateSpeed={0.4}
          minDistance={1.5}
          maxDistance={4}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
};

export default GermanyGlobe; 