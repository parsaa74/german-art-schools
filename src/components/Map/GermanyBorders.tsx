import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { germanStates } from '@/data/germanStates';

const GermanyBorders: React.FC = () => {
  const borderRef = useRef<THREE.Group>(null);

  const latLongToVector3 = (lat: number, lng: number, radius: number = 1.01) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  };

  useEffect(() => {
    if (!borderRef.current) return;

    germanStates.forEach(state => {
      const points: THREE.Vector3[] = [];
      state.coordinates.forEach(([lat, lng]) => {
        points.push(latLongToVector3(lat, lng));
      });

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: state.color,
        linewidth: 2,
        transparent: true,
        opacity: 0.7
      });

      const line = new THREE.Line(geometry, material);
      borderRef.current?.add(line);

      // Add state fill
      const shape = new THREE.Shape();
      points.forEach((point, i) => {
        if (i === 0) shape.moveTo(point.x, point.y);
        else shape.lineTo(point.x, point.y);
      });

      const fillGeometry = new THREE.ShapeGeometry(shape);
      const fillMaterial = new THREE.MeshBasicMaterial({
        color: state.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
      });

      const fill = new THREE.Mesh(fillGeometry, fillMaterial);
      borderRef.current?.add(fill);
    });
  }, []);

  return <group ref={borderRef} />;
};

export default GermanyBorders; 