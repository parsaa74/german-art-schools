import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface State {
    name: string;
    coordinates: [number, number][];
    center: [number, number];
}

const GERMAN_STATES: State[] = [
    {
        name: "Baden-Württemberg",
        center: [9.05, 48.53],
        coordinates: [
            [9.7950, 47.5858], [9.8322, 47.6013], [9.9021, 47.5801], [10.0234, 47.5912],
            [10.2367, 47.6742], [10.4733, 47.5808], [10.4891, 47.5912], [10.4556, 47.6821],
            [10.3234, 47.7432], [10.2891, 47.8123], [10.1234, 47.9432], [10.0556, 48.1234],
            [9.8934, 48.2845], [9.8117, 48.6842], [9.7234, 48.8321], [9.5891, 48.9432],
            [9.4234, 49.0123], [9.2891, 49.1234], [9.1234, 49.2321], [8.9891, 49.3432],
            [8.8234, 49.4123], [8.6583, 49.4042], [8.5234, 49.3321], [8.3891, 49.2123],
            [8.3408, 49.0092], [8.2234, 48.8321], [8.0891, 48.7123], [7.9234, 48.6321],
            [7.7891, 48.5123], [7.6234, 48.4321], [7.5958, 48.3325], [7.5234, 48.2123],
            [7.6891, 48.1321], [7.8234, 48.0123], [7.9891, 47.9321], [8.1142, 47.9925],
            [8.2891, 47.8321], [8.4234, 47.7123], [8.5891, 47.6321], [8.7234, 47.5912],
            [8.8891, 47.5801], [9.0234, 47.5702], [9.1891, 47.5603], [9.3234, 47.5504],
            [9.4891, 47.5605], [9.6234, 47.5706], [9.7950, 47.5858]
        ]
    },
    {
        name: "Bavaria",
        center: [11.4, 48.9],
        coordinates: [
            [10.4733, 47.5808], [10.5891, 47.5912], [10.7234, 47.6123], [10.8891, 47.6321],
            [11.0234, 47.6532], [11.1891, 47.6723], [11.3234, 47.6912], [11.4891, 47.7123],
            [11.6234, 47.7321], [11.7891, 47.7532], [11.9234, 47.7723], [12.0891, 47.7912],
            [12.1000, 47.7000], [12.2891, 47.8123], [12.4234, 47.9321], [12.5891, 48.0532],
            [12.7234, 48.1723], [12.8891, 48.2912], [13.0234, 48.3123], [13.1891, 48.4321],
            [13.3234, 48.5532], [13.4891, 48.6723], [13.6234, 48.7912], [13.8333, 48.7667],
            [13.9234, 48.9123], [13.8891, 49.0321], [13.8234, 49.1532], [13.7891, 49.2723],
            [13.7234, 49.3912], [13.6891, 49.5123], [13.6234, 49.6321], [13.5891, 49.7532],
            [13.5234, 49.8723], [13.4891, 49.9912], [13.4234, 50.1123], [13.3891, 50.2321],
            [13.7167, 50.4333], [13.5891, 50.3912], [13.4234, 50.3723], [13.2891, 50.3532],
            [13.1234, 50.3321], [12.9891, 50.3123], [12.8234, 50.2912], [12.6891, 50.2723],
            [12.5234, 50.2532], [12.3891, 50.2321], [12.2234, 50.2123], [12.0891, 50.1912],
            [11.8833, 50.3667], [11.7234, 50.3321], [11.5891, 50.3123], [11.4234, 50.2912],
            [11.2891, 50.2723], [11.1234, 50.2532], [10.9891, 50.2321], [10.8234, 50.2123],
            [10.6891, 50.1912], [10.5234, 50.1723], [10.3891, 50.1532], [10.1667, 50.3667],
            [10.0891, 50.2321], [9.9234, 49.9123], [9.8117, 48.6842], [9.9234, 48.5123],
            [10.0891, 48.3321], [10.2234, 48.1532], [10.3891, 47.9723], [10.4733, 47.5808]
        ]
    },
    // ... other states ...
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

function createSphericalPolygon(coordinates: [number, number][], radius: number): THREE.BufferGeometry {
    const points = coordinates.map(([lng, lat]) => latLngToVector3(lat, lng, radius));
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    // Create triangles using fan triangulation from the center point
    const center = points.reduce((acc, p) => acc.add(p), new THREE.Vector3()).divideScalar(points.length);
    center.normalize().multiplyScalar(radius);

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i].clone().normalize().multiplyScalar(radius);
        const p2 = points[i + 1].clone().normalize().multiplyScalar(radius);

        vertices.push(
            center.x, center.y, center.z,
            p1.x, p1.y, p1.z,
            p2.x, p2.y, p2.z
        );
        
        const baseIndex = i * 3;
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

interface GermanStatesProps {
    radius: number;
    color?: string;
    lineWidth?: number;
}

export function GermanStates({ radius, color = '#00ffd5', lineWidth = 2 }: GermanStatesProps) {
    const stateGroupRef = useRef<THREE.Group>(null);

    const { stateGeometries, borderGeometries, labelPositions } = useMemo(() => {
        const stateGeometries: Array<{
            name: string;
            geometry: THREE.BufferGeometry;
        }> = [];
        const borderGeometries: Array<{
            name: string;
            geometry: THREE.BufferGeometry;
        }> = [];
        const labelPositions: Array<{
            name: string;
            position: THREE.Vector3;
        }> = [];

        for (const state of GERMAN_STATES) {
            // Create state geometry
            const geometry = createSphericalPolygon(state.coordinates, radius);
            stateGeometries.push({ name: state.name, geometry });

            // Create border geometry
            const borderPoints = state.coordinates.map(([lng, lat]) => 
                latLngToVector3(lat, lng, radius)
            );
            borderPoints.push(borderPoints[0]); // Close the loop
            const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
            borderGeometries.push({ name: state.name, geometry: borderGeometry });

            // Calculate label position
            labelPositions.push({
                name: state.name,
                position: latLngToVector3(state.center[1], state.center[0], radius + 0.02)
            });
        }

        return { stateGeometries, borderGeometries, labelPositions };
    }, [radius]);

    return (
        <group ref={stateGroupRef}>
            {/* Render state fills */}
            {stateGeometries.map(({ name, geometry }) => (
                <mesh key={`fill-${name}`}>
                    <primitive object={geometry} />
                    <meshPhysicalMaterial
                        color={color}
                        transparent
                        opacity={0.2}
                        side={THREE.DoubleSide}
                        metalness={0.2}
                        roughness={0.8}
                        envMapIntensity={1}
                    />
                </mesh>
            ))}

            {/* Render state borders with glow effect */}
            {borderGeometries.map(({ name, geometry }) => (
                <group key={`border-${name}`}>
                    <line>
                        <primitive object={geometry} />
                        <lineBasicMaterial color={color} linewidth={lineWidth} />
                    </line>
                    <line>
                        <primitive object={geometry} />
                        <lineBasicMaterial
                            color={color}
                            linewidth={lineWidth + 2}
                            transparent
                            opacity={0.3}
                        />
                    </line>
                </group>
            ))}

            {/* Render state labels */}
            {labelPositions.map(({ name, position }) => (
                <Text
                    key={`label-${name}`}
                    position={[position.x, position.y, position.z]}
                    fontSize={0.15}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.004}
                    outlineColor="#000000"
                    outlineOpacity={0.8}
                >
                    {name}
                </Text>
            ))}
        </group>
    );
} 