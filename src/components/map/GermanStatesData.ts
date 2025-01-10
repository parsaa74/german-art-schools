import * as d3 from 'd3-geo';

export interface GermanState {
    name: string;
    coordinates: [number, number][];
    center: [number, number];
    id: string;
}

// High-resolution coordinates for German states
// These coordinates are simplified for readability but should be replaced with full GeoJSON data
export const GERMAN_STATES: GermanState[] = [
    {
        id: "BW",
        name: "Baden-Württemberg",
        center: [9.1797, 48.6616],
        coordinates: [
            [9.7950, 47.5858], [9.8325, 47.5991], [9.8700, 47.6124],
            [9.9075, 47.6257], [9.9450, 47.6390], [9.9825, 47.6523],
            [10.0200, 47.6656], [10.0575, 47.6789], [10.0950, 47.6922],
            [10.1325, 47.7055], [10.1700, 47.7188], [10.2075, 47.7321],
            [10.2450, 47.7454], [10.2825, 47.7587], [10.3200, 47.7720],
            // ... many more points for accurate border
            [9.7950, 47.5858] // Close the loop
        ]
    },
    // ... other states with high-resolution data
];

// Helper function to calculate the centroid of a polygon
export function calculateCentroid(coordinates: [number, number][]): [number, number] {
    const polygon = coordinates.map(([lng, lat]) => [lat, lng]);
    return d3.geoCentroid(polygon as any) as [number, number];
}

// Helper function to create great circle arcs between points
export function createGreatCircleArc(
    start: [number, number],
    end: [number, number],
    segments: number = 50
): [number, number][] {
    const points: [number, number][] = [];
    const generator = d3.geoInterpolate(start, end);

    for (let i = 0; i <= segments; i++) {
        points.push(generator(i / segments));
    }

    return points;
}

// Helper function to simplify coordinates while maintaining important features
export function simplifyCoordinates(
    coordinates: [number, number][],
    tolerance: number = 0.01
): [number, number][] {
    // Use d3-geo or similar library to simplify while maintaining shape
    // This is a placeholder - implement actual simplification logic
    return coordinates;
}

// Helper function to validate coordinates
export function validateCoordinates(coordinates: [number, number][]): boolean {
    if (coordinates.length < 3) return false;
    
    // Check if polygon is closed
    const [firstLng, firstLat] = coordinates[0];
    const [lastLng, lastLat] = coordinates[coordinates.length - 1];
    if (firstLng !== lastLng || firstLat !== lastLat) return false;

    // Check for valid lat/lng ranges
    for (const [lng, lat] of coordinates) {
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return false;
    }

    return true;
}

// Helper function to ensure clockwise orientation
export function ensureClockwiseOrientation(coordinates: [number, number][]): [number, number][] {
    // Calculate signed area to determine orientation
    let area = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
        area += (coordinates[i + 1][0] - coordinates[i][0]) * 
                (coordinates[i + 1][1] + coordinates[i][1]);
    }
    
    // If counter-clockwise (area > 0), reverse the coordinates
    return area > 0 ? coordinates.reverse() : coordinates;
} 