'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';

import { Billboard, Text, Line } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { LineMaterial } from 'three-stdlib';
import * as THREE from 'three';
import { MAP_CONFIG } from '@/lib/geo/index';
import { useSchoolStore } from '@/stores/schoolStore';

const AnimatedText = animated(Text);

const DEGREE_COLORS: Record<string, string> = {
  bachelor: '#22D3EE',
  master: '#F472B6',
  diploma: '#FBBF24',
  phd: '#C4B5FD',
  doctorate: '#C4B5FD',
  certificate: '#A7F3D0',
  default: '#E2E8F0',
};

const DEGREE_ABBREV: Record<string, string> = {
  bachelor: 'BA',
  master: 'MA',
  diploma: 'Dip',
  phd: 'PhD',
  doctorate: 'PhD',
  certificate: 'Cert',
  default: '—',
};

function degreeKey(degree: string | undefined): keyof typeof DEGREE_COLORS {
  if (!degree) return 'default';
  const d = degree.toLowerCase();
  if (d.includes('bachelor')) return 'bachelor';
  if (d.includes('master')) return 'master';
  if (d.includes('diploma')) return 'diploma';
  if (d.includes('phd') || d.includes('doctor')) return 'phd';
  if (d.includes('certif')) return 'certificate';
  return 'default';
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Points arranged on outward-facing hemisphere around the parent, biased toward the camera-facing side
function hemispherePoint(i: number, n: number, radius: number, schoolDir: THREE.Vector3, seed: number): THREE.Vector3 {
  // Fibonacci on hemisphere: only positive component along schoolDir
  const golden = Math.PI * (3 - Math.sqrt(5));
  const phi = Math.acos(1 - (i + 0.5) / n); // angle from pole (0..π/2 for hemisphere: use full and flip)
  // Map i to hemisphere: use i/n in [0,1], then y = 1 - 2*(i+0.5)/(2n)  -> keep y in [0,1]
  const t = (i + 0.5) / n;
  const y = 1 - t; // [0..1], top of hemisphere at i=0
  const r = Math.sqrt(1 - y * y);
  const theta = golden * i + (seed % 1000) / 1000 * Math.PI * 2;
  const local = new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r);

  // Rotate so local +Y aligns with schoolDir (outward from globe center)
  const up = new THREE.Vector3(0, 1, 0);
  const axis = new THREE.Vector3().crossVectors(up, schoolDir);
  const angle = Math.acos(THREE.MathUtils.clamp(up.dot(schoolDir.clone().normalize()), -1, 1));
  if (axis.lengthSq() > 1e-6) {
    axis.normalize();
    local.applyAxisAngle(axis, angle);
  } else if (schoolDir.y < 0) {
    // antipodal — flip
    local.negate();
  }
  return local.multiplyScalar(radius);
}

interface ProgramNodeProps {
  localPos: THREE.Vector3;
  worldAnchor: THREE.Vector3;
  program: any;
  isSelected: boolean;
}

function ProgramNode({ localPos, worldAnchor, program, isSelected }: ProgramNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const setSelectedProgramId = useSchoolStore(s => s.setSelectedProgramId);
  const selectedProgramId = useSchoolStore(s => s.selectedProgramId);

  const chipRadius = MAP_CONFIG.radius * 0.022;
  const deg = degreeKey(program.degree);
  const color = DEGREE_COLORS[deg];
  const abbrev = DEGREE_ABBREV[deg];

  const { scale, ringOpacity, labelOpacity } = useSpring({
    scale: isSelected ? 1.6 : hover ? 1.25 : 1.0,
    ringOpacity: isSelected ? 1.0 : hover ? 0.95 : 0.7,
    labelOpacity: hover || isSelected ? 1 : 0,
    config: { mass: 0.8, tension: 240, friction: 22 },
  });

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime() * 0.15 + (simpleHash(program.program_id ?? program.name) % 100) / 50;
    const wobble = Math.sin(t) * MAP_CONFIG.radius * 0.003;
    groupRef.current.position.set(
      worldAnchor.x + localPos.x,
      worldAnchor.y + localPos.y + wobble,
      worldAnchor.z + localPos.z,
    );
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = program.program_id;
    setSelectedProgramId(selectedProgramId === id ? null : id);
  };

  const labelFont = MAP_CONFIG.radius * 0.022;
  const abbrevFont = MAP_CONFIG.radius * 0.014;

  const ringInner = chipRadius * 0.92;
  const ringOuter = chipRadius * 1.06;

  return (
    <group ref={groupRef}>
      <Billboard follow={true}>
        {/* Flat chip — disk with thin ring border, a data tag (not a planet) */}
        <animated.group scale={scale}>
          {/* Invisible hit target */}
          <mesh
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto'; }}
            onClick={handleClick}
          >
            <circleGeometry args={[chipRadius * 1.1, 24]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Dark chip fill */}
          <mesh position={[0, 0, -0.0005]}>
            <circleGeometry args={[chipRadius, 32]} />
            <meshBasicMaterial color="#0B1220" transparent opacity={0.88} depthWrite={false} />
          </mesh>

          {/* Colored ring border (degree tint) */}
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[ringInner, ringOuter, 48]} />
            <animated.meshBasicMaterial
              color={color}
              transparent
              opacity={ringOpacity}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Degree abbrev, tinted in degree color */}
          <Text
            position={[0, 0, 0.001]}
            color={color}
            fontSize={abbrevFont}
            anchorY="middle"
            anchorX="center"
            fontWeight="bold"
            outlineWidth={0.0006}
            outlineColor="#0B1220"
          >
            {abbrev}
          </Text>
        </animated.group>

        {/* Full program name on hover/select */}
        <animated.group visible={labelOpacity.to(o => o > 0.01)}>
          <AnimatedText
            position={[0, chipRadius * 2.2, 0]}
            color="#F1F5F9"
            fontSize={labelFont}
            anchorY="bottom"
            anchorX="center"
            outlineWidth={0.002}
            outlineColor="#000000"
            material-transparent={true}
            material-opacity={labelOpacity}
            material-depthWrite={false}
            fontWeight="bold"
            maxWidth={MAP_CONFIG.radius * 0.4}
          >
            {program.name}
          </AnimatedText>
          <AnimatedText
            position={[0, chipRadius * 1.6, 0]}
            color={color}
            fontSize={labelFont * 0.65}
            anchorY="top"
            anchorX="center"
            outlineWidth={0.001}
            outlineColor="#000000"
            material-transparent={true}
            material-opacity={labelOpacity}
            material-depthWrite={false}
          >
            {program.degree}
          </AnimatedText>
        </animated.group>
      </Billboard>
    </group>
  );
}

// Animated flowing tether line school → program
function FlowingTether({ from, to, color }: { from: THREE.Vector3; to: THREE.Vector3; color: string }) {
  const matRef = useRef<any>(null);
  const len = useMemo(() => from.distanceTo(to), [from, to]);
  const { size } = useThree();
  const resolution = useMemo(() => new THREE.Vector2(size.width, size.height), [size.width, size.height]);
  const points = useMemo<[THREE.Vector3, THREE.Vector3]>(() => [from, to], [from, to]);

  useFrame((_s, delta) => {
    if (matRef.current) {
      matRef.current.dashOffset -= delta * len * 0.4;
    }
  });

  return (
    <Line
      points={points}
      color={color}
      lineWidth={2}
      dashed={true}
      dashSize={len * 0.08}
      gapSize={len * 0.06}
      transparent
      opacity={0.75}
      depthWrite={false}
    >
      <lineMaterialImpl
        ref={matRef}
        linewidth={2}
        transparent
        opacity={0.75}
        dashed
        dashSize={len * 0.08}
        gapSize={len * 0.06}
        dashOffset={0}
        resolution={resolution}
        blending={THREE.AdditiveBlending}
      />
    </Line>
  );
}

export function ProgramSatellites() {
  const selectedUniversity = useSchoolStore(s => s.selectedUniversity);
  const nodePositions = useSchoolStore(s => s.nodePositions);
  const showPrograms = useSchoolStore(s => s.showPrograms);
  const selectedProgramId = useSchoolStore(s => s.selectedProgramId);
  const programEdges = useSchoolStore(s => s.programEdges);

  const data = useMemo(() => {
    if (!showPrograms || !selectedUniversity) return null;
    const parent = nodePositions.get(selectedUniversity.name);
    const progs = selectedUniversity.programs ?? [];
    if (!parent || !progs.length) return null;
    const seed = simpleHash(selectedUniversity.name);
    const radius = MAP_CONFIG.radius * 0.22;
    // School direction = outward from globe center
    const schoolDir = parent.clone().normalize();
    const items = progs.map((p, i) => ({
      program: p,
      localPos: hemispherePoint(i, progs.length, radius, schoolDir, seed + i),
    }));
    const posById = new Map<string, THREE.Vector3>();
    items.forEach(({ program, localPos }) => {
      const id = (program as any).program_id;
      if (id) posById.set(id, new THREE.Vector3().addVectors(parent, localPos));
    });
    const visibleEdges = programEdges.filter(e => posById.has(e.src) && posById.has(e.dst));
    return { parent, items, posById, visibleEdges };
  }, [showPrograms, selectedUniversity, nodePositions, programEdges]);

  if (!data) return null;

  return (
    <group name="programSatellitesGroup">
      {/* Anchor pulse at school */}
      <mesh position={data.parent}>
        <sphereGeometry args={[MAP_CONFIG.radius * 0.038, 24, 24]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.08}
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Tether lines school → program (animated dashes) */}
      {data.items.map(({ program, localPos }) => {
        const end = new THREE.Vector3().addVectors(data.parent, localPos);
        return (
          <FlowingTether
            key={`tether-${(program as any).program_id ?? program.name}`}
            from={data.parent}
            to={end}
            color={DEGREE_COLORS[degreeKey(program.degree)]}
          />
        );
      })}

      {/* Similarity edges program ↔ program */}
      {data.visibleEdges.map((e, i) => {
        const a = data.posById.get(e.src)!;
        const b = data.posById.get(e.dst)!;
        const op = Math.max(0.22, Math.min(0.7, (e.weight - 0.55) / 0.45));
        return (
          <Line
            key={`sim-${i}`}
            points={[a, b]}
            color="#E2E8F0"
            lineWidth={1}
            transparent
            opacity={op}
            depthWrite={false}
          />
        );
      })}

      {/* Nodes */}
      {data.items.map(({ program, localPos }) => (
        <ProgramNode
          key={(program as any).program_id ?? program.name}
          localPos={localPos}
          worldAnchor={data.parent}
          program={program}
          isSelected={selectedProgramId === (program as any).program_id}
        />
      ))}
    </group>
  );
}
