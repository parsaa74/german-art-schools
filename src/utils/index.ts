import * as THREE from 'three';

export const latLongToVector3 = (lat: number, lng: number, radius: number = 1) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

export const getColorByType = (type: string): string => {
  const colors = {
    art: '#ff4444',
    music: '#4caf50',
    film: '#2196f3',
    design: '#9c27b0',
    theater: '#ffeb3b',
    dance: '#00bcd4',
    media: '#ff9800'
  };
  return colors[type as keyof typeof colors] || '#ffffff';
}; 