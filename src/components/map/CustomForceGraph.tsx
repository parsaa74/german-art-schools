'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Line, Html, Instance, Instances } from '@react-three/drei'
import * as THREE from 'three'
// import * as d3 from 'd3' // Remove D3 import
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore'

// Constants
const LERP_FACTOR = 0.1;
const FORCE_SCALE = 5; // General scale for forces
const CENTER_ATTRACTION = 0.02 * FORCE_SCALE; // How strongly nodes are pulled to the center
const REPULSION_STRENGTH = 0.8 * FORCE_SCALE; // How strongly nodes push each other away
const REPULSION_DISTANCE_MIN = 0.5; // Minimum distance before repulsion starts
const REPULSION_DISTANCE_MAX = 4.0; // Maximum distance where repulsion has effect
const DAMPING = 0.95; // Slows down node movement

// Interface for node data managed within R3F
interface GraphNode {
  id: string
  name: string
  type: string
  state: string
  university: ProcessedUniversity
  // R3F managed position and velocity
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  // Visual properties for smooth interpolation
  currentScale: number;
  targetScale: number;
  currentOpacity: number;
  targetOpacity: number;
  currentColor: THREE.Color;
  targetColor: THREE.Color;
  currentEmissiveIntensity: number;
  targetEmissiveIntensity: number;
  // Instance tracking
  instanceId: number;
}

// Link data structure (source/target are IDs)
interface GraphLink {
  source: string // ID of source node
  target: string // ID of target node
  value: number // Could be used for link strength/distance later
  // Visual properties for smooth interpolation
  currentWidth: number;
  targetWidth: number;
  currentOpacity: number;
  targetOpacity: number;
}


interface CustomForceGraphProps {
  scale?: number
  position?: [number, number, number]
}

// Reusable node geometry and material for instancing
const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16); // Slightly lower poly for performance
const nodeMaterial = new THREE.MeshStandardMaterial({
    transparent: true,
    roughness: 0.3,
    metalness: 0.4,
    envMapIntensity: 1.5
});
const tempVec3 = new THREE.Vector3(); // Reusable vector for calculations

export default function CustomForceGraph({
  scale = 1,
  position = [0, 0, 0]
}: CustomForceGraphProps) {
  const groupRef = useRef<THREE.Group>(null)
  const instancesRef = useRef<THREE.InstancedMesh>(null)
  const { scene } = useThree();

  const { processedUniversities, selectedUniversity, setSelectedUniversity } = useSchoolStore()

  // Use state to hold our node data, including positions managed by R3F
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const nodesRef = useRef<GraphNode[]>([]); // Ref to access current node state in useFrame

  const [hoveredInstanceId, setHoveredInstanceId] = useState<number | null>(null)
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null)

  // --- Color Helper Functions (remain the same) ---
  const getNodeColor = useCallback((type: string): THREE.Color => {
    const colors: Record<string, string> = {
      university: '#2979FF', art_academy: '#5D9DFF', design_school: '#4D9EFF',
      music_academy: '#85B8FF', film_school: '#3D8BFF',
    }
    return new THREE.Color(colors[type] || '#2979FF')
  }, []);

  const getEmissiveColor = useCallback((type: string): THREE.Color => {
     const baseColor = getNodeColor(type);
     return baseColor.clone().multiplyScalar(1.3);
  }, [getNodeColor]);

  // Effect to create initial node/link structure
  useEffect(() => {
    if (processedUniversities.length === 0) {
        setNodes([]);
        setLinks([]);
        nodesRef.current = [];
        return;
    };

    console.log("GraphLayout: Creating initial data structure.");

    const newNodes: GraphNode[] = processedUniversities.map((uni, i) => ({
      id: uni.name,
      name: uni.name,
      type: uni.type,
      state: uni.state,
      university: uni,
      // Initial random position and zero velocity
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ),
      vel: new THREE.Vector3(0, 0, 0),
      // Initial visual states
      currentScale: 1.0, targetScale: 1.0,
      currentOpacity: 0.8, targetOpacity: 0.8,
      currentColor: getNodeColor(uni.type),
      targetColor: getNodeColor(uni.type),
      currentEmissiveIntensity: 0.8, targetEmissiveIntensity: 0.8,
      instanceId: i // Assign instanceId based on index
    }));

    // --- Create Links (Simplified - based on state only for now) ---
    const stateGroups: Record<string, GraphNode[]> = {};
    newNodes.forEach(node => {
      if (!stateGroups[node.state]) stateGroups[node.state] = [];
      stateGroups[node.state].push(node);
    });

    const newLinks: GraphLink[] = [];
    Object.values(stateGroups).forEach(group => {
      if (group.length > 1) {
        for (let i = 0; i < group.length; i++) {
          // Link to only a few nearby nodes within the state for performance
          for (let j = i + 1; j < Math.min(group.length, i + 3); j++) {
            newLinks.push({
              source: group[i].id, // Link by ID
              target: group[j].id, // Link by ID
              value: 1, // Base value for state links
              currentWidth: 1.5, targetWidth: 1.5,
              currentOpacity: 0.4, targetOpacity: 0.4,
            });
          }
        }
      }
    });

     // --- Add links for type (weaker) ---
     const typeGroups: Record<string, GraphNode[]> = {};
     newNodes.forEach(node => {
         if (!typeGroups[node.type]) typeGroups[node.type] = [];
         typeGroups[node.type].push(node);
     });
     const linkSet = new Set(newLinks.map(l => [l.source, l.target].sort().join('--')));

     Object.values(typeGroups).forEach(group => {
         if (group.length > 1) {
             for (let i = 0; i < group.length; i++) {
                 for (let j = i + 1; j < Math.min(group.length, i + 3); j++) {
                     const linkKey = [group[i].id, group[j].id].sort().join('--');
                     if (!linkSet.has(linkKey)) {
                         newLinks.push({
                             source: group[i].id,
                             target: group[j].id,
                             value: 0.5, // Weaker value for type links
                             currentWidth: 0.75, targetWidth: 0.75,
                             currentOpacity: 0.3, targetOpacity: 0.3,
                         });
                         linkSet.add(linkKey);
                     }
                 }
             }
         }
     });


    setNodes(newNodes);
    setLinks(newLinks);
    nodesRef.current = newNodes; // Update ref

    console.log("GraphLayout: Initial data structure created.");
  }, [processedUniversities, getNodeColor, getEmissiveColor]); // Dependencies remain


  // Effect to update target visual properties based on hover/selection
  useEffect(() => {
    // No D3 simulation ref needed here
    const currentNodes = nodesRef.current; // Use the ref
    if (!currentNodes) return;

    let changed = false;
    currentNodes.forEach(node => {
      const isSelected = selectedUniversity?.name === node.id;
      const isHovered = hoveredInstanceId === node.instanceId;
      const newTargetScale = isSelected ? 2.2 : isHovered ? 1.8 : 1.2;
      const newTargetOpacity = isSelected ? 0.95 : isHovered ? 0.9 : 0.8;

      if (node.targetScale !== newTargetScale || node.targetOpacity !== newTargetOpacity) {
          node.targetScale = newTargetScale;
          node.targetOpacity = newTargetOpacity;
          changed = true;
      }
    });

    // Update link targets
     links.forEach(link => {
        const sourceNode = currentNodes.find(n => n.id === link.source);
        const targetNode = currentNodes.find(n => n.id === link.target);

        if (sourceNode && targetNode) {
            const isSourceSelected = selectedUniversity?.name === sourceNode.id;
            const isTargetSelected = selectedUniversity?.name === targetNode.id;
            const isSourceHovered = hoveredInstanceId === sourceNode.instanceId;
            const isTargetHovered = hoveredInstanceId === targetNode.instanceId;
            const isHighlighted = isSourceSelected || isTargetSelected || isSourceHovered || isTargetHovered;

            const newTargetWidth = isHighlighted ? link.value * 2.5 : link.value * 1.5;
            const newTargetOpacity = isHighlighted ? 0.8 : 0.4;

             if (link.targetWidth !== newTargetWidth || link.targetOpacity !== newTargetOpacity) {
                link.targetWidth = newTargetWidth;
                link.targetOpacity = newTargetOpacity;
                changed = true;
            }
        } else {
             const defaultWidth = link.value * 1.5;
             const defaultOpacity = 0.4;
             if (link.targetWidth !== defaultWidth || link.targetOpacity !== defaultOpacity) {
                link.targetWidth = defaultWidth;
                link.targetOpacity = defaultOpacity;
                changed = true;
             }
        }
    });

    // Force a re-render if targets changed - triggers useFrame update implicitly
    // if (changed) {
    //    // This might not be strictly necessary if useFrame reads the ref directly
    //    // setNodes([...currentNodes]); // Or a more efficient update pattern
    // }

    // console.log("GraphLayout: Updating targets based on hover/select.");
  }, [hoveredInstanceId, selectedUniversity, links]); // Depend on links as well now


  // Update Three.js objects in animation loop
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]); // Map for quick link lookups


  useFrame((state, delta) => {
    if (!groupRef.current || !instancesRef.current || nodesRef.current.length === 0) {
        return;
    }

    const lerpFactor = Math.min(delta * 10.0, 1.0); // Clamp lerp factor
    const dt = Math.min(delta, 0.05); // Clamp delta time for stability
    const elapsedTime = state.clock.getElapsedTime(); // Get elapsed time here

    const currentNodes = nodesRef.current;

    // --- Calculate Forces and Update Positions ---
    currentNodes.forEach((node) => {
        // 1. Center Attraction
        tempVec3.copy(node.pos).multiplyScalar(-CENTER_ATTRACTION);
        node.vel.addScaledVector(tempVec3, dt); // Apply force towards center (0,0,0)

        // 2. Repulsion from other nodes
        currentNodes.forEach((otherNode) => {
            if (node.id === otherNode.id) return;

            tempVec3.copy(node.pos).sub(otherNode.pos);
            const distSq = tempVec3.lengthSq();

             // Only apply repulsion within a certain range
            if (distSq > REPULSION_DISTANCE_MIN * REPULSION_DISTANCE_MIN && distSq < REPULSION_DISTANCE_MAX * REPULSION_DISTANCE_MAX) {
                 const distance = Math.sqrt(distSq);
                 // Force weakens with distance squared, stronger when closer
                 const force = REPULSION_STRENGTH / distSq;
                 node.vel.addScaledVector(tempVec3.normalize(), force * dt);
            } else if (distSq <= REPULSION_DISTANCE_MIN * REPULSION_DISTANCE_MIN && distSq > 1e-6) {
                 // Apply a constant stronger force if nodes are too close or overlapping
                 const force = REPULSION_STRENGTH * 2 / (REPULSION_DISTANCE_MIN * REPULSION_DISTANCE_MIN);
                 node.vel.addScaledVector(tempVec3.normalize(), force * dt);
            }
        });

        // 3. Link Force (Optional - basic implementation)
        // links.forEach(link => {
        //     const sourceId = link.source;
        //     const targetId = link.target;
        //     if (node.id === sourceId || node.id === targetId) {
        //         const otherNodeId = node.id === sourceId ? targetId : sourceId;
        //         const otherNode = nodeMap.get(otherNodeId);
        //         if (otherNode) {
        //             const desiredDist = 5 / link.value; // Example desired distance
        //             tempVec3.copy(otherNode.pos).sub(node.pos);
        //             const dist = tempVec3.length();
        //             const displacement = dist - desiredDist;
        //             const strength = 0.05 * link.value; // Link strength
        //             node.vel.addScaledVector(tempVec3.normalize(), displacement * strength * dt);
        //         }
        //     }
        // });

         // 4. Damping
         node.vel.multiplyScalar(DAMPING);

         // 5. Update position
         node.pos.addScaledVector(node.vel, dt);

         // Optional: Keep nodes within a boundary sphere
         // if (node.pos.length() > 15) {
         //     node.pos.normalize().multiplyScalar(15);
         //     node.vel.multiplyScalar(0.8); // Dampen velocity if hitting boundary
         // }
    });


    // --- Update Instances Visuals ---
    let updateMatrices = false;
    let updateColors = false;
    currentNodes.forEach((node, i) => {
        // Interpolate visual properties (scale, opacity)
        if (node.currentScale !== undefined && node.targetScale !== undefined) {
            node.currentScale = THREE.MathUtils.lerp(node.currentScale, node.targetScale, lerpFactor);
        }
        if (node.currentOpacity !== undefined && node.targetOpacity !== undefined) {
            node.currentOpacity = THREE.MathUtils.lerp(node.currentOpacity, node.targetOpacity, lerpFactor);
             // Apply opacity directly to instance material (requires specific setup or use of transparent=true on base material)
             // This part might need adjustment depending on how InstancedMesh handles opacity per instance
        }

        // Apply floating animation (can keep this)
        const time = state.clock.getElapsedTime();
        const uniqueOffset = i * 0.1;
        const floatY = Math.sin(time * 0.5 + uniqueOffset) * 0.05;
        const floatX = Math.cos(time * 0.3 + uniqueOffset) * 0.03;
        const floatZ = Math.sin(time * 0.4 + uniqueOffset) * 0.04;

        // Calculate final position including float
        tempVec3.copy(node.pos).add(new THREE.Vector3(floatX, floatY, floatZ));

        // Apply interpolated scale with pulse (can keep this)
        const currentTargetScale = node.targetScale ?? 1.2;
        const pulseIntensity = currentTargetScale > 1.5 ? 0.15 : currentTargetScale > 1.3 ? 0.1 : 0.05;
        const pulseSpeed = currentTargetScale > 1.5 ? 1.2 : currentTargetScale > 1.3 ? 1.1 : 0.8;
        const pulse = 1 + (Math.sin(time * pulseSpeed + uniqueOffset) * pulseIntensity);
        const finalScale = node.currentScale * pulse;


        // Update Instance Matrix
        tempObject.position.copy(tempVec3); // Use calculated position
        tempObject.scale.set(finalScale, finalScale, finalScale); // Use calculated scale
        tempObject.updateMatrix();
        instancesRef.current!.setMatrixAt(node.instanceId, tempObject.matrix);
        updateMatrices = true;

        // Update Instance Color (if needed - simplified here)
        // Interpolate color if targetColor exists
        // node.currentColor.lerp(node.targetColor, lerpFactor);
        // instancesRef.current!.setColorAt(node.instanceId, node.currentColor);
        // updateColors = true;
        // For now, set color once during init unless hover/select changes targetColor

        // Set initial color if instanceColor is available
         if (instancesRef.current?.instanceColor) {
            instancesRef.current.setColorAt(node.instanceId, node.currentColor);
            updateColors = true;
         }
    });

    // Signal instance updates
    if (updateMatrices) {
      instancesRef.current.instanceMatrix.needsUpdate = true;
    }
    if (updateColors && instancesRef.current.instanceColor) {
        instancesRef.current.instanceColor.needsUpdate = true;
    }

    // --- Update Links ---
    // Iterate through THREE group children, assuming links are added after nodes
    links.forEach((link, i) => {
        const linkObjectIndex = currentNodes.length + i; // Calculate index in group children
        const lineObject = groupRef.current?.children[linkObjectIndex] as THREE.Line & { material: THREE.LineBasicMaterial, geometry: THREE.BufferGeometry };

        if (!lineObject || !lineObject.material || !lineObject.geometry) return;

        // Interpolate link visual properties
        link.currentWidth = THREE.MathUtils.lerp(link.currentWidth ?? 1.5, link.targetWidth ?? 1.5, lerpFactor);
        link.currentOpacity = THREE.MathUtils.lerp(link.currentOpacity ?? 0.4, link.targetOpacity ?? 0.4, lerpFactor);

        lineObject.material.opacity = link.currentOpacity;
        // lineObject.material.linewidth = link.currentWidth; // LineWidth limited in LineBasicMaterial
        lineObject.material.needsUpdate = true;

        // Update link geometry points using node positions from our state/ref
        const sourceNode = nodeMap.get(link.source);
        const targetNode = nodeMap.get(link.target);

        if (sourceNode && targetNode) {
             const midPoint = new THREE.Vector3().addVectors(sourceNode.pos, targetNode.pos).multiplyScalar(0.5);
             // Add slight curve (simplified) - could be based on index or other factors
             const curveOffset = new THREE.Vector3(0, Math.sin(i * 0.5 + elapsedTime * 0.2) * 0.5, 0); // Use elapsedTime
             midPoint.add(curveOffset);

             const curve = new THREE.QuadraticBezierCurve3(
               sourceNode.pos,
               midPoint,
               targetNode.pos
             );
             try {
                 const points = curve.getPoints(10);
                 lineObject.geometry.setFromPoints(points);
                 lineObject.geometry.attributes.position.needsUpdate = true;
             } catch (error) {
                 console.error("Error updating link geometry:", error, link);
             }
        }
    });
  });


  const handleNodeClick = useCallback((instanceId: number | undefined) => {
    if (instanceId === undefined) return;
    // Find node using ref which should be up-to-date
    const node = nodesRef.current.find(n => n.instanceId === instanceId);
    if (!node) return;

    if (selectedUniversity?.name === node.id) {
      setSelectedUniversity(null);
      setSelectedInstanceId(null); // Update local state
    } else {
       if (node.university) {
           setSelectedUniversity(node.university);
           setSelectedInstanceId(node.instanceId); // Update local state
           console.log('GraphLayout: Selected university set to:', node.university.name);
       } else {
           console.error('GraphLayout: University data missing for node:', node.id);
       }
    }
  }, [selectedUniversity, setSelectedUniversity]); // Removed nodesData dependency


  const handlePointerOver = useCallback((instanceId: number | undefined) => {
    if (instanceId === undefined) return;
    setHoveredInstanceId(instanceId);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHoveredInstanceId(null);
    document.body.style.cursor = 'auto';
  }, []);

  // Find the currently active node data for the label
  const activeNode = useMemo(() => {
      const activeId = selectedInstanceId ?? hoveredInstanceId;
      if (activeId === null) return null;
      // Find from state `nodes` as this affects rendering directly
      const node = nodes.find(n => n.instanceId === activeId);
      return node ? { ...node, pos: node.pos } : null; // Return a copy including pos
  }, [selectedInstanceId, hoveredInstanceId, nodes]); // Depend on nodes state

  // Render only when nodes state has items
  if (nodes.length === 0) {
      return null;
  }

  return (
    <group ref={groupRef} position={position} scale={scale}>
        {/* Render Nodes using InstancedMesh */}
        <Instances
            ref={instancesRef}
            limit={nodes.length} // Use state length for limit
            geometry={nodeGeometry}
            material={nodeMaterial}
            castShadow
            receiveShadow
            onClick={(e) => { e.stopPropagation(); handleNodeClick(e.instanceId); }}
            onPointerOver={(e) => { e.stopPropagation(); handlePointerOver(e.instanceId); }}
            onPointerOut={(e) => { e.stopPropagation(); handlePointerOut(); }}
        >
            {/* We NEED a child material here if we want per-instance color/opacity, */}
            {/* otherwise the base `nodeMaterial` properties are used globally. */}
            {/* <meshStandardMaterial attach="material" transparent vertexColors /> */}
            {/* If not using per-instance color/opacity from the Instances component, */}
            {/* the base material's opacity is used */}
        </Instances>

       {/* Render links declaratively based on links state */}
       {links.map((link, i) => {
            const sourceNode = nodeMap.get(link.source); // Use map for lookup
            const targetNode = nodeMap.get(link.target);

            // Don't render if nodes aren't found yet (e.g., during init)
            if (!sourceNode || !targetNode) return null;

            const isSelected = sourceNode.instanceId === selectedInstanceId || targetNode.instanceId === selectedInstanceId;
            const isHovered = sourceNode.instanceId === hoveredInstanceId || targetNode.instanceId === hoveredInstanceId;
            const isHighlighted = isSelected || isHovered;

            // Determine color based on highlight state (adjust logic as needed)
            let linkColor = isHighlighted ? "rgba(65, 145, 255, 0.8)" : "rgba(41, 121, 255, 0.4)";
            // Example: Different color for type links?
            // if (link.type === 'type') { linkColor = isHighlighted ? ... : ...; }

            // Initial points (will be updated in useFrame)
            const points = [sourceNode.pos.clone(), targetNode.pos.clone()];

            return (
            <Line
                key={`link-${link.source}-${link.target}-${i}`}
                points={points}
                color={linkColor}
                lineWidth={link.currentWidth} // Use currentWidth which is lerped
                transparent={true}
                opacity={link.currentOpacity} // Use currentOpacity which is lerped
                dashed={false}
            />
            )
        })}

        {/* Render Label for active node */}
        {activeNode && (
            <Html
                // Use the node's current position from the activeNode state
                position={[activeNode.pos.x, activeNode.pos.y + 0.4 * (activeNode.currentScale ?? 1.0), activeNode.pos.z]}
                center distanceFactor={10} sprite={false} transform occlude
                style={{ pointerEvents: 'none' }}
            >
                <div className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-lg transform transition-all duration-300"
                     style={{
                        background: 'linear-gradient(135deg, rgba(18,24,33,0.95) 0%, rgba(41,121,255,0.8) 100%)',
                        border: '1px solid rgba(65,145,255,0.6)',
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        boxShadow: '0 0 15px rgba(41,121,255,0.5), 0 0 30px rgba(41,121,255,0.3)',
                     }}
                >
                    {activeNode.name}
                </div>
            </Html>
        )}
    </group>
  )
}
