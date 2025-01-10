import * as THREE from 'three';

export interface GeoPoint {
  lat: number;
  lng: number;
}

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

export const toRad = (degrees: number): number => {
  return degrees * Math.PI / 180;
};

export const toDeg = (radians: number): number => {
  return radians * 180 / Math.PI;
};

export function projectToSphere(lat: number, lng: number, radius: number): THREE.Vector3 {
  // Ensure consistent coordinate system
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  // Adjust for proper orientation
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

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