'use client'

import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function NetworkArt() {
    const networkRef = useRef<THREE.Group>(null);
    const nodesCount = 100;
    const maxConnections = 3;
    const sphereRadius = 8;

    const { nodes, connections, flowPoints } = useMemo(() => {
        const nodes: THREE.Vector3[] = [];
        const connections: Array<[THREE.Vector3, THREE.Vector3]> = [];
        const flowPoints: Array<{
            start: THREE.Vector3;
            end: THREE.Vector3;
            speed: number;
            progress: number;
            length: number;
        }> = [];

        // Create nodes in spherical formation
        for (let i = 0; i < nodesCount; i++) {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = sphereRadius + (Math.random() - 0.5) * 2;

            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(theta);

            nodes.push(new THREE.Vector3(x, y, z));
        }

        // Create connections between nearby nodes
        nodes.forEach((node, i) => {
            const nodeConnections = [];
            for (let j = 0; j < nodes.length && nodeConnections.length < maxConnections; j++) {
                if (i !== j) {
                    const distance = node.distanceTo(nodes[j]);
                    if (distance < 4) {
                        nodeConnections.push(j);
                        connections.push([node, nodes[j]]);

                        // Create flow points for this connection
                        const numFlows = 1 + Math.floor(Math.random() * 2);
                        for (let f = 0; f < numFlows; f++) {
                            flowPoints.push({
                                start: node.clone(),
                                end: nodes[j].clone(),
                                speed: 0.2 + Math.random() * 0.3,
                                progress: Math.random(),
                                length: distance
                            });
                        }
                    }
                }
            }
        });

        return { nodes, connections, flowPoints };
    }, []);

    return (
        <group ref={networkRef}>
            {/* Static connections */}
            {connections.map((connection, i) => (
                <line key={`connection-${i}`}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={2}
                            array={new Float32Array([
                                connection[0].x, connection[0].y, connection[0].z,
                                connection[1].x, connection[1].y, connection[1].z
                            ])}
                            itemSize={3}
                        />
                    </bufferGeometry>
                    <lineBasicMaterial color="#00ffd5" transparent opacity={0.1} />
                </line>
            ))}

            {/* Nodes */}
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={nodes.length}
                        array={new Float32Array(nodes.flatMap(n => [n.x, n.y, n.z]))}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.1}
                    color="#00ffd5"
                    transparent
                    opacity={0.8}
                    sizeAttenuation
                />
            </points>

            {/* Flowing points */}
            {flowPoints.map((flow, i) => (
                <mesh key={`flow-${i}`}
                    position={[
                        flow.start.x + (flow.end.x - flow.start.x) * flow.progress,
                        flow.start.y + (flow.end.y - flow.start.y) * flow.progress,
                        flow.start.z + (flow.end.z - flow.start.z) * flow.progress
                    ]}
                >
                    <sphereGeometry args={[0.03, 8, 8]} />
                    <meshBasicMaterial
                        color="#00ffd5"
                        transparent
                        opacity={0.8}
                    />
                </mesh>
            ))}
        </group>
    );
}

function HolographicGrid() {
    const gridRef = useRef<THREE.Group>(null);
    const size = 120;
    const divisions = 30;

    const gridPoints = useMemo(() => {
        const points = [];
        const step = size / divisions;

        for (let i = -size/2; i <= size/2; i += step) {
            points.push(
                new THREE.Vector3(-size/2, i, -20 - Math.abs(i/10)),
                new THREE.Vector3(size/2, i, -20 - Math.abs(i/10))
            );
            points.push(
                new THREE.Vector3(i, -size/2, -20 - Math.abs(i/10)),
                new THREE.Vector3(i, size/2, -20 - Math.abs(i/10))
            );
        }
        return points;
    }, []);

    return (
        <group ref={gridRef}>
            <line>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={gridPoints.length}
                        array={new Float32Array(gridPoints.flatMap(p => [p.x, p.y, p.z]))}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial color="#4400ff" transparent opacity={0.07} />
            </line>
        </group>
    );
}

export default function Background() {
    return (
        <group>
            <NetworkArt />
            <HolographicGrid />
            <fog attach="fog" args={['#000033', 20, 90]} />
        </group>
    );
} 