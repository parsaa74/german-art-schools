import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { SchoolClusteringSystem } from './systems/SchoolClusteringSystem';
import { schools } from '@/data/schools';

export const GermanyMap: React.FC = () => {
  const { scene, camera, gl } = useThree();
  const clusteringSystemRef = useRef<SchoolClusteringSystem | null>(null);
  const globeRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!globeRef.current) return;

    // Initialize the clustering system
    clusteringSystemRef.current = new SchoolClusteringSystem(globeRef.current);

    // Add all schools to the clustering system
    schools.forEach(school => {
      // Create a marker mesh for each school
      const markerGeometry = new THREE.SphereGeometry(0.01, 16, 16);
      const markerMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0xff0000
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      
      clusteringSystemRef.current?.addSchool(school, marker);
    });

    // Animation loop for clustering updates
    const animate = () => {
      if (clusteringSystemRef.current) {
        clusteringSystemRef.current.update(camera, gl);
      }
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      // Cleanup
      clusteringSystemRef.current = null;
    };
  }, [camera, gl]);

  return (
    <group ref={globeRef}>
      {/* Your existing map components */}
    </group>
  );
}; 