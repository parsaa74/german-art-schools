'use client'

import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface University {
    name: string;
    location: [number, number]; // [longitude, latitude]
    type: 'University' | 'Hochschule' | 'Kunsthochschule' | 'Akademie';
    description: string;
}

const UNIVERSITIES: University[] = [
    {
        name: "Bauhaus-Universität Weimar",
        location: [11.329, 50.979],
        type: "University",
        description: "Historic institution known for art, design, and architecture, following the Bauhaus tradition."
    },
    {
        name: "Burg Giebichenstein Kunsthochschule Halle",
        location: [11.963, 51.489],
        type: "Kunsthochschule",
        description: "Renowned art and design school with a focus on practical and theoretical artistic education."
    },
    // Add more universities from the list...
];

interface InfoBox {
    name: string;
    position: THREE.Vector3;
    type: string;
    description: string;
}

interface UniversityNodesProps {
    radius: number;
    color?: string;
}

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
}

export default function UniversityNodes({ radius, color = '#00ffd5' }: UniversityNodesProps) {
    const groupRef = useRef<THREE.Group>(null);
    const [selectedUniversity, setSelectedUniversity] = useState<InfoBox | null>(null);
    const [hoverUniversity, setHoverUniversity] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { nodeGeometries, nodePositions } = useMemo(() => {
        const nodeGeometries: Array<{
            name: string;
            geometry: THREE.BufferGeometry;
            position: THREE.Vector3;
        }> = [];

        const nodePositions = new Map<string, THREE.Vector3>();

        UNIVERSITIES.forEach(university => {
            const position = latLngToVector3(university.location[1], university.location[0], radius);
            nodePositions.set(university.name, position);

            const geometry = new THREE.SphereGeometry(0.05, 16, 16);
            nodeGeometries.push({
                name: university.name,
                geometry,
                position
            });
        });

        return { nodeGeometries, nodePositions };
    }, [radius]);

    const handleNodeClick = (university: University, position: THREE.Vector3) => {
        setSelectedUniversity({
            name: university.name,
            position: position.clone().multiplyScalar(1.1),
            type: university.type,
            description: university.description
        });
    };

    if (!mounted) return null;

    return (
        <group ref={groupRef}>
            {/* Render university nodes */}
            {nodeGeometries.map(({ name, geometry, position }) => {
                const university = UNIVERSITIES.find(u => u.name === name)!;
                const isHovered = hoverUniversity === name;
                const scale = isHovered ? 1.5 : 1;

                return (
                    <group key={`node-${name}`}>
                        <mesh
                            geometry={geometry}
                            position={position}
                            scale={scale}
                            onClick={() => handleNodeClick(university, position)}
                            onPointerOver={() => setHoverUniversity(name)}
                            onPointerOut={() => setHoverUniversity(null)}
                        >
                            <meshPhongMaterial
                                color={color}
                                emissive={color}
                                emissiveIntensity={isHovered ? 2 : 1}
                                transparent
                                opacity={0.8}
                            />
                        </mesh>
                        {/* Glow effect */}
                        <mesh
                            geometry={geometry}
                            position={position}
                            scale={scale * 1.2}
                        >
                            <meshBasicMaterial
                                color={color}
                                transparent
                                opacity={0.3}
                            />
                        </mesh>
                    </group>
                );
            })}

            {/* Render info box for selected university */}
            {selectedUniversity && (
                <group position={selectedUniversity.position}>
                    <Text
                        position={[0, 0.2, 0]}
                        fontSize={0.1}
                        color={color}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.004}
                        outlineColor="#000000"
                        outlineOpacity={0.8}
                        maxWidth={2}
                    >
                        {selectedUniversity.name}
                    </Text>
                    <Text
                        position={[0, 0.1, 0]}
                        fontSize={0.08}
                        color={color}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.004}
                        outlineColor="#000000"
                        outlineOpacity={0.8}
                    >
                        {selectedUniversity.type}
                    </Text>
                    <Text
                        position={[0, -0.1, 0]}
                        fontSize={0.06}
                        color={color}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.004}
                        outlineColor="#000000"
                        outlineOpacity={0.8}
                        maxWidth={1.5}
                    >
                        {selectedUniversity.description}
                    </Text>
                </group>
            )}
        </group>
    );
} 