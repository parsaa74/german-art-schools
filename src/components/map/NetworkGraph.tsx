// src/components/map/NetworkGraph.tsx
import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as d3 from 'd3-force-3d';
import { type ProcessedUniversity } from '@/stores/schoolStore';
import { type Simulation as D3Simulation } from 'd3-force';
// No longer using shader material

// Constants for node appearance - significantly increased for better visibility
const NODE_BASE_SCALE = 1.5 // Much larger base scale for maximum visibility
const NODE_HOVER_SCALE = 1.4 // Scale multiplier for hover state
const NODE_SELECT_SCALE = 1.8 // Scale multiplier for selected state
const LERP_SPEED = 8.0; // Speed for scale interpolation

// Ethereal blue color mapping for university types - optimized for visibility and beauty
const typeColors: { [key: string]: THREE.Color } = {
  university: new THREE.Color('#2979FF'), // Ethereal blue for universities - higher contrast
  art_academy: new THREE.Color('#5D9DFF'), // Lighter blue for art academies - more visible
  design_school: new THREE.Color('#4D9EFF'), // Medium blue for design schools - harmonious
  music_academy: new THREE.Color('#85B8FF'), // Pale blue for music academies - delicate
  film_school: new THREE.Color('#3D8BFF'), // Deep blue for film schools - rich
  default: new THREE.Color('#2979FF') // Default ethereal blue - beautiful and harmonious
}

// Enhanced emissive color mapping for stronger glow effects - ethereal blue theme
const typeEmissiveColors: { [key: string]: THREE.Color } = {
  university: new THREE.Color('#5D9DFF'), // Bright blue glow - ethereal
  art_academy: new THREE.Color('#85B8FF'), // Lighter blue glow - delicate
  design_school: new THREE.Color('#4D9EFF'), // Medium blue glow - balanced
  music_academy: new THREE.Color('#A7CBFF'), // Very light blue glow - airy
  film_school: new THREE.Color('#3D8BFF'), // Deep blue glow - intense
  default: new THREE.Color('#5D9DFF') // Default ethereal blue glow - magical
}

// Color mapping for node states (hover, selected) - ethereal theme
const stateColors: { [key: string]: THREE.Color } = {
  hover: new THREE.Color('#FFFFFF'), // White for hover state - clean and bright
  selected: new THREE.Color('#A7CBFF'), // Light blue for selected state - ethereal
  default: new THREE.Color('#5D9DFF') // Blue for default state - matches our theme
}

// Define the structure for simulation nodes
interface NodeData /* extends d3.SimulationNodeDatum */ {
  id: string // University name (use 'name' from ProcessedUniversity)
  type: string
  programCount: number
  originalData: ProcessedUniversity // Store original processed university data
  // Explicitly add optional properties added by d3-force
  index?: number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

interface NetworkGraphProps {
  universities: ProcessedUniversity[] // Expect ProcessedUniversity[] now
  onLayoutUpdate: (positions: Map<string, THREE.Vector3>) => void
  hoverNodeName: string | null
  selectedNodeName: string | null
  userData?: { [key: string]: any } // Add optional userData prop
}

// Create a more visually striking base geometry for the instances
const createNodeGeometry = () => {
  const radius = NODE_BASE_SCALE * 0.5;
  const mainShape = new THREE.IcosahedronGeometry(radius, 2);
  return mainShape;
};

const baseGeometry = createNodeGeometry();

// Helper object for matrix calculation
const dummyObject = new THREE.Object3D();

export default function NetworkGraph({
  universities,
  onLayoutUpdate,
  hoverNodeName,
  selectedNodeName,
  userData
}: NetworkGraphProps) {

  if (!universities || universities.length === 0) {
    console.log("NetworkGraph: No universities data provided or empty array.");
    return null;
  }

  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const simulationRef = useRef<D3Simulation<NodeData, undefined> | null>(null);
  const nodesRef = useRef<NodeData[]>([]);
  const positionMapRef = useRef<Map<string, THREE.Vector3>>(new Map());
  // Add refs to store current and target scales for smooth interpolation
  const currentScalesRef = useRef<Float32Array | null>(null);
  const targetScalesRef = useRef<Float32Array | null>(null);

  const createMaterialsForTypes = () => {
    const materials: { [key: string]: THREE.Material } = {};
    Object.entries(typeColors).forEach(([type, color]) => {
      const emissiveColor = typeEmissiveColors[type as keyof typeof typeEmissiveColors];
      materials[type] = new THREE.MeshStandardMaterial({
        color: color,
        emissive: emissiveColor,
        emissiveIntensity: 1.5,
        metalness: 0.9,
        roughness: 0.2,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide
      });
    });
    return materials;
  };

  const typeMaterials = createMaterialsForTypes();
  const nodeMaterial = typeMaterials['default'];

  const instanceColors = useMemo(() => {
    const colors = new Float32Array(universities.length * 3);
    universities.forEach((uni, i) => {
      const baseColor = typeColors[uni.type] || typeColors.default;
      const hsl = {h: 0, s: 0, l: 0};
      baseColor.getHSL(hsl);
      const uniqueColor = new THREE.Color().setHSL(
        hsl.h + (Math.random() * 0.05 - 0.025),
        hsl.s + (Math.random() * 0.1 - 0.05),
        hsl.l
      );
      uniqueColor.toArray(colors, i * 3);
    });
    return colors;
  }, [universities]);

  const instanceStates = useMemo(() => {
    const states = new Float32Array(universities.length);
    universities.forEach((uni, i) => {
      let nodeState = 0.0; // Normal
      if (selectedNodeName) {
        if (uni.name === selectedNodeName) {
          nodeState = 2.0; // Selected
        } else {
          const selectedUniType = universities.find(u => u.name === selectedNodeName)?.type;
          const isRelated = selectedUniType && uni.type === selectedUniType;
          nodeState = isRelated ? 4.0 : 3.0; // Related or Inactive
        }
      } else if (hoverNodeName && uni.name === hoverNodeName) {
        nodeState = 1.0; // Hover
      }
      states[i] = nodeState;
    });
    return states;
  }, [universities, hoverNodeName, selectedNodeName]);

  // Update instance attributes and initialize scale refs
  useEffect(() => {
    if (meshRef.current) {
      // Update instance attributes
      if (!meshRef.current.geometry.hasAttribute('instanceColor')) {
        meshRef.current.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(instanceColors, 3));
      } else {
        const colorAttribute = meshRef.current.geometry.getAttribute('instanceColor') as THREE.InstancedBufferAttribute;
        colorAttribute.array = instanceColors;
        colorAttribute.needsUpdate = true;
      }

      if (!meshRef.current.geometry.hasAttribute('instanceState')) {
        meshRef.current.geometry.setAttribute('instanceState', new THREE.InstancedBufferAttribute(instanceStates, 1));
      } else {
        const stateAttribute = meshRef.current.geometry.getAttribute('instanceState') as THREE.InstancedBufferAttribute;
        stateAttribute.array = instanceStates;
        stateAttribute.needsUpdate = true;
      }

      // Initialize scale refs if needed (e.g., if university count changes)
      if (!currentScalesRef.current || currentScalesRef.current.length !== universities.length) {
        currentScalesRef.current = new Float32Array(universities.length).fill(NODE_BASE_SCALE);
        targetScalesRef.current = new Float32Array(universities.length).fill(NODE_BASE_SCALE);
        console.log("Initialized scale refs for", universities.length, "universities.");
      } else {
         // If only instanceStates changed, update targetScales immediately for responsiveness
         // This prevents waiting for the next frame to start interpolation
         universities.forEach((_, i) => {
            if (targetScalesRef.current) { // Check if targetScalesRef.current is not null
                const nodeState = instanceStates[i];
                let newTargetScale = NODE_BASE_SCALE;
                switch(Math.floor(nodeState)) {
                    case 2: newTargetScale = NODE_BASE_SCALE * NODE_SELECT_SCALE; break;
                    case 1: newTargetScale = NODE_BASE_SCALE * NODE_HOVER_SCALE; break;
                    case 4: newTargetScale = NODE_BASE_SCALE * NODE_HOVER_SCALE * 0.9; break;
                    case 3: newTargetScale = NODE_BASE_SCALE * 0.7; break;
                    default: newTargetScale = NODE_BASE_SCALE;
                }
                // Update target scale immediately without pulse for this effect update
                targetScalesRef.current[i] = newTargetScale;
            }
         });
      }

      console.log("Updated instance attributes:",
        meshRef.current.geometry.hasAttribute('instanceColor'),
        meshRef.current.geometry.hasAttribute('instanceState'));
    }
  }, [instanceColors, instanceStates, universities]); // universities dependency added

  // Animation loop for nodes with smooth scale interpolation
  useFrame((state, delta) => {
    if (meshRef.current && currentScalesRef.current && targetScalesRef.current) {
      if (!meshRef.current.visible) {
        meshRef.current.visible = true;
        console.log("Made mesh visible");
      }

      const time = state.clock.getElapsedTime();

      for (let i = 0; i < meshRef.current.count; i++) {
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();

        meshRef.current.getMatrixAt(i, matrix);
        matrix.decompose(position, quaternion, scale);

        const nodeName = Array.from(positionMapRef.current.entries())
          .find(([_, pos]) => pos.distanceToSquared(position) < 0.01)?.[0];
        const university = nodeName ? universities.find(u => u.name === nodeName) : null;
        const uniType = university?.type || 'default';

        let floatOffset = 0;
        let rotationX = 0;
        let rotationY = 0;
        let rotationZ = 0;

        const nodeState = instanceStates[i];
        const isActive = nodeState < 3.0;
        const animationIntensity = isActive ? 1.0 : 0.3;

        // --- Idle Animation Calculations ---
        switch(uniType) {
          case 'university':
            floatOffset = Math.sin(time * 0.4 + i * 0.2) * 0.15 * animationIntensity;
            position.x += Math.cos(time * 0.3 + i * 0.1) * 0.03 * animationIntensity;
            position.z += Math.sin(time * 0.2 + i * 0.1) * 0.03 * animationIntensity;
            rotationX = Math.sin(time * 0.2 + i * 0.1) * 0.03 * animationIntensity;
            rotationY = Math.cos(time * 0.3 + i * 0.1) * 0.03 * animationIntensity;
            break;
          case 'art_academy':
            floatOffset = Math.sin(time * 0.5 + i * 0.2) * 0.12 * animationIntensity;
            position.x += Math.cos(time * 0.3 + i * 0.2) * 0.05 * animationIntensity;
            position.z += Math.sin(time * 0.25 + i * 0.15) * 0.04 * animationIntensity;
            rotationX = Math.sin(time * 0.4 + i * 0.1) * 0.05 * animationIntensity;
            rotationY = Math.cos(time * 0.3 + i * 0.1) * 0.05 * animationIntensity;
            rotationZ = Math.sin(time * 0.2 + i * 0.1) * 0.02 * animationIntensity;
            break;
          // ... other cases remain the same ...
           case 'design_school':
            // Structured yet dynamic motion for design schools
            floatOffset = Math.sin(time * 0.6 + i * 0.3) * 0.1 * animationIntensity;
            position.x += Math.cos(time * 0.4 + i * 0.2) * 0.04 * animationIntensity;
            position.z += Math.sin(time * 0.4 + i * 0.2) * 0.04 * animationIntensity;
            rotationX = Math.sin(time * 0.5 + i * 0.2) * 0.04 * animationIntensity;
            rotationY = Math.cos(time * 0.4 + i * 0.2) * 0.04 * animationIntensity;
            break;
          case 'music_academy':
            // Rhythmic, wave-like motion for music academies
            floatOffset = Math.sin(time * 0.7 + i * 0.1) * 0.14 * animationIntensity;
            position.x += Math.cos(time * 0.6 + i * 0.1) * 0.03 * animationIntensity;
            position.z += Math.sin(time * 0.5 + i * 0.2) * 0.03 * animationIntensity;
            rotationX = Math.sin(time * 0.6 + i * 0.3) * 0.04 * animationIntensity;
            rotationY = Math.cos(time * 0.5 + i * 0.2) * 0.04 * animationIntensity;
            rotationZ = Math.sin(time * 0.4 + i * 0.1) * 0.03 * animationIntensity;
            break;
          case 'film_school':
            // Cinematic, sweeping motion for film schools
            floatOffset = Math.sin(time * 0.4 + i * 0.2) * 0.13 * animationIntensity;
            position.x += Math.cos(time * 0.3 + i * 0.1) * 0.06 * animationIntensity;
            position.z += Math.sin(time * 0.35 + i * 0.15) * 0.05 * animationIntensity;
            rotationX = Math.sin(time * 0.3 + i * 0.2) * 0.05 * animationIntensity;
            rotationY = Math.cos(time * 0.25 + i * 0.15) * 0.05 * animationIntensity;
            rotationZ = Math.sin(time * 0.2 + i * 0.1) * 0.02 * animationIntensity;
            break;
          default:
            // Gentle, subtle motion for other types
            floatOffset = Math.sin(time * 0.3 + i * 0.1) * 0.08 * animationIntensity;
            position.x += Math.cos(time * 0.2 + i * 0.1) * 0.02 * animationIntensity;
            position.z += Math.sin(time * 0.25 + i * 0.15) * 0.02 * animationIntensity;
            rotationX = Math.sin(time * 0.2 + i * 0.1) * 0.02 * animationIntensity;
            rotationY = Math.cos(time * 0.2 + i * 0.1) * 0.02 * animationIntensity;
        }
        position.y += floatOffset;
        quaternion.setFromEuler(new THREE.Euler(rotationX, rotationY, rotationZ));

        // --- Scale Interpolation ---
        let targetScaleValue = NODE_BASE_SCALE; // Base target scale
        const pulseTime = time; // Use consistent time for pulse calculation

        switch(Math.floor(nodeState)) {
          case 2: // Selected
            targetScaleValue = NODE_BASE_SCALE * NODE_SELECT_SCALE * (1 + Math.sin(pulseTime * 2.5) * 0.12);
            break;
          case 1: // Hovered
            targetScaleValue = NODE_BASE_SCALE * NODE_HOVER_SCALE * (1 + Math.sin(pulseTime * 3.5) * 0.07);
            break;
          case 4: // Related
            targetScaleValue = NODE_BASE_SCALE * NODE_HOVER_SCALE * 0.9 * (1 + Math.sin(pulseTime * 1.8 + i * 0.2) * 0.05);
            break;
          case 3: // Inactive
            targetScaleValue = NODE_BASE_SCALE * 0.7 * (1 + Math.sin(pulseTime * 0.6 + i) * 0.01);
            break;
          default: // Normal
            targetScaleValue = NODE_BASE_SCALE * (1 + Math.sin(pulseTime * 1.0 + i * 0.3) * 0.03);
        }
        // Update the target scale for this instance
        targetScalesRef.current[i] = targetScaleValue;

        // Interpolate the current scale towards the target scale
        const interpolationFactor = Math.min(delta * LERP_SPEED, 1.0); // Use delta time
        currentScalesRef.current[i] = THREE.MathUtils.lerp(
          currentScalesRef.current[i],
          targetScalesRef.current[i],
          interpolationFactor
        );
        const currentInterpolatedScale = currentScalesRef.current[i];
        scale.setScalar(currentInterpolatedScale); // Apply the interpolated scale

        // Recompose and update matrix
        matrix.compose(position, quaternion, scale);
        meshRef.current.setMatrixAt(i, matrix);
      }

      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  // --- D3 Force Simulation ---
  useEffect(() => {
    console.log('NetworkGraph: Initializing simulation for InstancedMesh.');

    nodesRef.current = universities.map((uni) => ({
      id: uni.name,
      type: uni.type,
      programCount: uni.programTypes?.length || 0,
      originalData: uni,
    }));

    const simulation = d3
      .forceSimulation(nodesRef.current, 3)
      .force('link', d3.forceLink().id((d: any) => d.id).strength(0.02).distance(3.0))
      .force('charge', d3.forceManyBody().strength(-30))
      .force('center', d3.forceCenter(0, 0, 0).strength(0.2))
      .force('collision', d3.forceCollide().radius(1.0).strength(0.6))
      .force('x', d3.forceX().strength(0.05))
      .force('y', d3.forceY().strength(0.05))
      .force('z', d3.forceZ().strength(0.05))
      .alphaDecay(0.01) // Slightly faster decay
      .stop();

    simulationRef.current = simulation;

    const handleTick = () => {
      if (!meshRef.current) return;

      if (!meshRef.current.visible) {
        meshRef.current.visible = true;
      }

      const currentNodes: NodeData[] = simulationRef.current?.nodes() || [];
      const newPositionsMap = new Map<string, THREE.Vector3>();
      let positionsChanged = false;

      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      if (meshRef.current && meshRef.current.count !== universities.length) {
         meshRef.current.count = universities.length;
      }

      currentNodes.forEach((node: NodeData, i: number) => {
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        const z = node.z ?? 0;

        // Update only position from simulation, keep scale/rotation from useFrame
        const matrix = new THREE.Matrix4();
        meshRef.current.getMatrixAt(i, matrix); // Get current matrix (with animated scale/rotation)
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        matrix.decompose(position, quaternion, scale); // Decompose to keep scale/rotation

        position.set(x, y, z); // Update position from simulation

        matrix.compose(position, quaternion, scale); // Recompose with updated position
        if (i < meshRef.current.count) {
          meshRef.current.setMatrixAt(i, matrix);
        }

        const newPos = new THREE.Vector3(x, y, z);
        const oldPos = positionMapRef.current.get(node.id);
        if (!oldPos || oldPos.distanceToSquared(newPos) > 0.0001) {
          positionsChanged = true;
        }
        newPositionsMap.set(node.id, newPos);

        if (node.x !== undefined) { minX = Math.min(minX, node.x); maxX = Math.max(maxX, node.x); }
        if (node.y !== undefined) { minY = Math.min(minY, node.y); maxY = Math.max(maxY, node.y); }
        if (node.z !== undefined) { minZ = Math.min(minZ, node.z); maxZ = Math.max(maxZ, node.z); }
      });

      meshRef.current.instanceMatrix.needsUpdate = true;

      if (positionsChanged || newPositionsMap.size !== positionMapRef.current.size) {
        positionMapRef.current = newPositionsMap;
        onLayoutUpdate(newPositionsMap);
      }

      // Optional: Log position extents less frequently
      // if(currentNodes.length > 0 && positionsChanged && Math.random() < 0.1) {
      //   console.log(`NetworkGraph Positions Extents: X[${minX.toFixed(2)}, ${maxX.toFixed(2)}], Y[${minY.toFixed(2)}, ${maxY.toFixed(2)}], Z[${minZ.toFixed(2)}, ${maxZ.toFixed(2)}]`);
      // }

      if (simulationRef.current && simulationRef.current.alpha() < 0.01) {
        // console.log("NetworkGraph: Simulation cooled down."); // Reduce logging
        simulationRef.current.stop();
      }
    };

    simulation.on('tick', handleTick)
    console.log("NetworkGraph: Starting simulation heating.");
    simulation.alpha(1).restart();

    return () => {
      console.log('NetworkGraph: Stopping simulation and cleaning up.')
      if (simulationRef.current) {
        simulationRef.current.stop()
        simulationRef.current.on('tick', null);
      }
      simulationRef.current = null
      nodesRef.current = []
      positionMapRef.current.clear()
    }
  }, [universities, onLayoutUpdate])

  if (universities.length === 0) return null
  console.log(`Rendering InstancedMesh with ${universities.length} instances.`);

  // Accessibility useEffect remains the same

  return (
    <group name="networkNodesGroup">
      <instancedMesh
        ref={meshRef}
        args={[baseGeometry, nodeMaterial, universities.length]}
        userData={{
          ...userData,
          accessibilityInfo: {
            type: 'visualization',
            count: universities.length,
            description: 'Interactive 3D network of German art schools'
          }
        }}
        name="networkNodes"
        frustumCulled={false}
      >
        <instancedBufferAttribute
          attach="geometry.attributes.instanceColor"
          args={[instanceColors, 3]}
          needsUpdate={true}
        />
        <instancedBufferAttribute
          attach="geometry.attributes.instanceState"
          args={[instanceStates, 1]}
          needsUpdate={true}
        />
      </instancedMesh>
    </group>
  );
}
