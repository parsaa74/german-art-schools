import * as THREE from 'three';

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

  // Check for NaN values
  if (isNaN(x) || isNaN(y) || isNaN(z)) {
    console.error('NaN coordinates generated:', {
      input: { lat, lng, radius },
      radians: { phi, theta },
      output: { x, y, z }
    });
    return new THREE.Vector3();
  }

  return new THREE.Vector3(x, y, z);
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

/**
 * Projects 2D coordinates onto a sphere surface
 */
export const projectToSphere = (vertices: Float32Array, radius: number): void => {
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

    // Verify projection
    const projectedLength = Math.sqrt(
      vertices[i] * vertices[i] +
      vertices[i + 1] * vertices[i + 1] +
      vertices[i + 2] * vertices[i + 2]
    );

    if (Math.abs(projectedLength - radius) > 0.0001) {
      console.warn('Projection error:', {
        expected: radius,
        actual: projectedLength,
        difference: Math.abs(projectedLength - radius)
      });
    }
  }
}; 