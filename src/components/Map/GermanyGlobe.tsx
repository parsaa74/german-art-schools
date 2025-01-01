import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SchoolClusteringSystem } from './systems/SchoolClusteringSystem';
import { schools } from '@/data/schools';
import GermanyMap from './GermanyMap';

const LoadingFallback: React.FC = () => (
  <mesh>
    <sphereGeometry args={[1, 32, 32]} />
    <meshStandardMaterial color="#444444" wireframe />
  </mesh>
);

// Create a component to handle the clustering system
const ClusteringManager: React.FC = () => {
  const { scene, camera, gl } = useThree();
  const clusteringSystemRef = useRef<SchoolClusteringSystem | null>(null);
  const clusterGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Create a group for clusters
    const clusterGroup = new THREE.Group();
    scene.add(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Initialize clustering system with the group
    clusteringSystemRef.current = new SchoolClusteringSystem(clusterGroup);

    // Add all schools
    schools.forEach(school => {
      const position = latLongToVector3(school.lat, school.lng, 1.02);
      const markerGeometry = new THREE.SphereGeometry(0.01, 16, 16);
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        transparent: true,
        opacity: 0.8
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.copy(position);
      clusterGroup.add(marker);
      
      clusteringSystemRef.current?.addSchool(school, marker);
    });

    return () => {
      scene.remove(clusterGroup);
      clusteringSystemRef.current = null;
    };
  }, [scene]);

  // Update clustering system in animation loop
  useFrame(() => {
    if (clusteringSystemRef.current) {
      clusteringSystemRef.current.update(camera, gl);
    }
  });

  return null;
};

export const GermanyGlobe: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
          <ClusteringManager />
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