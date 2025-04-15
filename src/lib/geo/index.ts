import * as THREE from 'three';

// Constants from map.ts
export const MAP_CONFIG = {
  radius: 5,
  centerLat: 51.1657,
  centerLng: 10.4515,
  origin: new THREE.Vector3(0, 0, 0),
  markerElevation: 0.1,
  labelElevation: 0.05
} as const;

export const COLORS = {
  background: '#18212B',
  globe: '#2979FF', // Updated to ethereal blue from purple
  borders: '#E8CF39',
  marker: '#5D9DFF', // Updated to lighter blue
  text: '#F2EFEA',
  textOutline: '#18212B'
} as const;

export const MATERIALS = {
  globe: {
    opacity: 0.6,
    wireframe: true
  },
  state: {
    opacity: 0.8,
    shininess: 30
  },
  border: {
    opacity: 1.0,
    lineWidth: 2
  },
  marker: {
    opacity: 1.0
  }
} as const;

// Germany's bounding box (approximate)
export const GERMANY_BOUNDS = {
  minLat: 47.27,
  maxLat: 55.05,
  minLng: 5.87,
  maxLng: 15.04
};

// Types
export interface GeoPoint {
  lat: number;
  lng: number;
}

// Common Utilities
export const toRad = (degrees: number): number => {
  return degrees * Math.PI / 180;
};

export const toDeg = (radians: number): number => {
  return radians * 180 / Math.PI;
};

/**
 * Converts latitude and longitude coordinates to a 3D vector position on a sphere
 */
export const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  // Ensure inputs are valid numbers
  if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
    console.error('Invalid coordinates:', { lat, lng, radius });
    return new THREE.Vector3();
  }

  // Clamp latitude to valid range (-90 to 90)
  lat = Math.max(-90, Math.min(90, lat));

  // Normalize longitude to -180 to 180
  lng = ((lng + 180) % 360) - 180;

  // Convert to radians
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  // Calculate the position on the sphere
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
};

// Alias for backward compatibility
export const projectToSphere = (lat: number, lng: number, radius: number): THREE.Vector3 => {
  return latLngToVector3(lat, lng, radius);
};

// Project vertices onto a sphere surface
export const projectVerticesToSphere = (vertices: Float32Array, radius: number): void => {
  if (!vertices || vertices.length % 3 !== 0) {
    console.error('Invalid vertices array:', vertices);
    return;
  }

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];

    // Check for invalid values
    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      console.error('Invalid vertex:', { x, y, z });
      continue;
    }

    // Calculate the length of the vector
    const length = Math.sqrt(x * x + y * y + z * z);
    if (length === 0) {
      console.warn('Zero length vector at index:', i);
      continue;
    }

    // Project onto sphere
    vertices[i] = (x / length) * radius;
    vertices[i + 1] = (y / length) * radius;
    vertices[i + 2] = (z / length) * radius;
  }
};

export const calculateDistance = (point1: GeoPoint, point2: GeoPoint): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.lat - point1.lat);
  const dLng = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const projectToMercator = (
  lat: number,
  lng: number,
  center: [number, number] = [10.4515, 51.1657], // Center of Germany
  scale: number = 100
): THREE.Vector2 => {
  // Limit latitude to prevent infinite scaling near poles
  lat = Math.max(Math.min(lat, 85), -85);

  // Convert to radians
  const lambda = toRad(lng);
  const phi = toRad(lat);
  const lambda0 = toRad(center[0]);
  const phi0 = toRad(center[1]);

  // Mercator projection equations
  const x = scale * (lambda - lambda0);

  // Use proper Mercator formula
  const y = scale * (Math.log(Math.tan(Math.PI / 4 + phi / 2)) -
                    Math.log(Math.tan(Math.PI / 4 + phi0 / 2)));

  return new THREE.Vector2(x, y);
};

export const interpolateGeoPath = (
  start: GeoPoint,
  end: GeoPoint,
  steps: number = 100
): GeoPoint[] => {
  const points: GeoPoint[] = [];

  // Use great circle interpolation for more accurate paths
  const startRad = { lat: toRad(start.lat), lng: toRad(start.lng) };
  const endRad = { lat: toRad(end.lat), lng: toRad(end.lng) };

  // Calculate great circle parameters
  const d = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin((endRad.lat - startRad.lat) / 2), 2) +
    Math.cos(startRad.lat) * Math.cos(endRad.lat) *
    Math.pow(Math.sin((endRad.lng - startRad.lng) / 2), 2)
  ));

  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(startRad.lat) * Math.cos(startRad.lng) +
             B * Math.cos(endRad.lat) * Math.cos(endRad.lng);
    const y = A * Math.cos(startRad.lat) * Math.sin(startRad.lng) +
             B * Math.cos(endRad.lat) * Math.sin(endRad.lng);
    const z = A * Math.sin(startRad.lat) + B * Math.sin(endRad.lat);

    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lng = toDeg(Math.atan2(y, x));

    points.push({ lat, lng });
  }

  return points;
};

export const getBoundingBox = (points: GeoPoint[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} => {
  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
};

/**
 * Calculates the centroid of a set of coordinates
 */
export const calculateCentroid = (coordinates: [number, number][]): [number, number] => {
  if (!coordinates.length) {
    console.error('Empty coordinates array');
    return [0, 0];
  }

  const sum = coordinates.reduce(
    (acc, [lng, lat]) => {
      // Ensure valid numbers
      if (isNaN(lng) || isNaN(lat)) {
        console.error('Invalid coordinate:', { lng, lat });
        return acc;
      }
      return [acc[0] + lng, acc[1] + lat];
    },
    [0, 0]
  );

  return [
    sum[0] / coordinates.length,
    sum[1] / coordinates.length
  ];
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