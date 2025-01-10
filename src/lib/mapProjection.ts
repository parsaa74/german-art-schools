import * as THREE from 'three';

// Convert latitude/longitude to 3D coordinates on a sphere
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

// Germany's bounding box (approximate)
export const GERMANY_BOUNDS = {
    minLat: 47.27,
    maxLat: 55.05,
    minLng: 5.87,
    maxLng: 15.04
};

// Create a line geometry from GeoJSON coordinates
export function createLineGeometry(coordinates: [number, number][], radius: number): THREE.BufferGeometry {
    const points: THREE.Vector3[] = coordinates.map(([lng, lat]) => 
        latLngToVector3(lat, lng, radius)
    );

    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);
    
    return geometry;
}

// Create a mesh geometry from GeoJSON polygon
export function createPolygonGeometry(coordinates: [number, number][][], radius: number): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const firstPoint = coordinates[0][0];
    let startPoint = latLngToVector3(firstPoint[1], firstPoint[0], radius);
    
    shape.moveTo(startPoint.x, startPoint.z);
    
    coordinates[0].slice(1).forEach(([lng, lat]) => {
        const point = latLngToVector3(lat, lng, radius);
        shape.lineTo(point.x, point.z);
    });
    
    shape.closePath();
    
    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.1,
        bevelEnabled: false
    });
    
    // Rotate to align with sphere surface
    geometry.rotateX(Math.PI / 2);
    
    return geometry;
} 