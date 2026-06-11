'use client'

/**
 * GlassWall — the schools as siblings from ONE shattered window, hovering in 3D.
 *
 * Each school is a glass shard cut from the same fracture (so they're siblings).
 * Panes are assigned to fracture cells by lat/lng, so the wall loosely maps
 * Germany (north up top, Bavaria lower right) without being a globe.
 *
 * The old node hierarchy lives on as fracture hierarchy:
 *   - every pane carries a faint etched crack web — one facet per program — so
 *     program count reads as crack density;
 *   - selecting a school cracks its pane open IN PLACE: the facets separate and
 *     pop forward, tinted by degree (BA/MA/Dip/PhD), click → ProgramInfoPanel;
 *   - related schools (same type / state / shared specializations) don't get
 *     connecting lines — they catch the same light: kin panes glow and shimmer
 *     together while one is hovered or selected;
 *   - looming application deadlines pulse amber→red along a pane's crack lines
 *     (type colours stay untouched — urgency is layered on top).
 *
 * Applying a filter that excludes a school makes its shard break loose, tumble
 * and fly away; clearing it lets the shard reassemble. Camera is locked frontal
 * (SceneContent); weather (rain/lightning) ramps with filter count (Atmosphere).
 *
 * The wall answers the cursor (the preview-lab feel, without unlocking the
 * camera): the whole field eases after the pointer with a storm-ramped sway so
 * reflections keep sweeping the glass; panes under the cursor lift and tip
 * toward it; hovering turns a pane crisp and camera-facing while the rest of
 * the wall gently frosts and desaturates (focus = clarity, like the lab's
 * intent slider). A billboarded name tag (carried over from the orbital-globe
 * version) floats above whatever is hovered — the school's name on a pane,
 * the program's name on an open facet.
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useSchoolStore, ProcessedUniversity } from '@/stores/schoolStore';
import { buildFractureWindow, subdivideCell, buildFacetGeometry, FacetCell } from '@/lib/glass/fracture';
import { Filters, passesFilters } from '@/lib/glass/filter';
import { daysUntilClosestDeadline } from '@/lib/glass/deadline';
import { ATMO } from './atmosphere/config';

const lerp = THREE.MathUtils.lerp;
const smoothstep = THREE.MathUtils.smoothstep;

function getTypeColor(type: string): string {
  switch (type) {
    case 'art_academy':
    case 'kunsthochschule': return '#EF4444';
    case 'design_school': return '#10B981';
    case 'university_of_arts': return '#8B5CF6';
    case 'film_university': return '#F59E0B';
    default: return '#3B82F6';
  }
}

// Degree colour language carried over from the old ProgramSatellites.
const DEGREE_COLORS: Record<string, string> = {
  bachelor: '#22D3EE',
  master: '#F472B6',
  diploma: '#FBBF24',
  phd: '#C4B5FD',
  doctorate: '#C4B5FD',
  certificate: '#A7F3D0',
  default: '#E2E8F0',
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

interface ShardData {
  school: ProcessedUniversity;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshPhysicalMaterial;
  tint: THREE.Color;       // this school's type colour (revealed on shatter)
  base: THREE.Vector3;     // resting position (with depth)
  tilt: THREE.Vector3;     // resting tilt that catches light
  size: number;
  baseEmissive: number;
  dirX: number; dirZ: number; spinX: number; spinY: number; spinZ: number;
  phase: number;
  facets: FacetCell[];     // one per program — the pane's inner crack web
  crackGeometry: THREE.BufferGeometry | null; // etched facet edges on the glass face
  crackMaterial: THREE.LineBasicMaterial | null;
  urgencyLevel: number;    // 0 none … 3 urgent (closest application deadline)
  urgencyPulse: number;    // crack-line pulse speed
}

interface OpenFacet {
  facet: FacetCell;
  program: NonNullable<ProcessedUniversity['programs']>[number] | undefined;
  geometry: THREE.BufferGeometry;
  material: THREE.MeshPhysicalMaterial;
  zJit: number;
  tiltX: number;
  tiltY: number;
  phase: number;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function GlassWall() {
  const { camera } = useThree();
  const processedUniversities = useSchoolStore((s) => s.processedUniversities);
  const selectedUniversity = useSchoolStore((s) => s.selectedUniversity);
  const setSelectedUniversity = useSchoolStore((s) => s.setSelectedUniversity);
  const setSelectedProgramId = useSchoolStore((s) => s.setSelectedProgramId);
  const setCameraPosition = useSchoolStore((s) => s.setCameraPosition);
  const setCameraTarget = useSchoolStore((s) => s.setCameraTarget);

  const search = useSchoolStore((s) => s.searchQuery);
  const aState = useSchoolStore((s) => s.activeStateFilter);
  const aProgram = useSchoolStore((s) => s.activeProgramFilter);
  const aType = useSchoolStore((s) => s.activeTypeFilter);
  const aSemester = useSchoolStore((s) => s.activeSemesterFilter);
  const aNc = useSchoolStore((s) => s.activeNcFilter);
  const aMethod = useSchoolStore((s) => s.activeApplicationMethodFilter);
  const aLang = useSchoolStore((s) => s.activeCourseLanguageFilter);
  const aDegree = useSchoolStore((s) => s.activeDegreeFilter);
  const timeline = useSchoolStore((s) => s.timelineFilter);

  // Lock camera to a frontal view of the field (once).
  useEffect(() => {
    const z = ATMO.wall.cameraZ;
    camera.position.set(0, 0, z);
    camera.lookAt(0, 0, 0);
    setCameraPosition([0, 0, z]);
    setCameraTarget([0, 0, 0]);
  }, [camera, setCameraPosition, setCameraTarget]);

  const shards = useMemo<ShardData[]>(() => {
    const win = buildFractureWindow(Math.max(processedUniversities.length, 1), {
      seed: ATMO.fracture.seed,
      depth: ATMO.wall.glassDepth,
      bevel: ATMO.wall.bevel,
    });

    // Geographic cell assignment: schools land on fracture cells by lat/lng, so
    // the wall reads as a loose stained-glass map of Germany.
    const coords = processedUniversities.filter((u) => u.location[0] && u.location[1]);
    let latMin = 47.2, latMax = 55.1, lngMin = 5.8, lngMax = 15.1;
    if (coords.length > 1) {
      latMin = Math.min(...coords.map((u) => u.location[0]));
      latMax = Math.max(...coords.map((u) => u.location[0]));
      lngMin = Math.min(...coords.map((u) => u.location[1]));
      lngMax = Math.max(...coords.map((u) => u.location[1]));
    }
    const latSpan = Math.max(latMax - latMin, 1e-6);
    const lngSpan = Math.max(lngMax - lngMin, 1e-6);
    const free = new Set(win.cells.map((_, i) => i));
    const cellIdxFor = new Map<string, number>();
    [...processedUniversities]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((school) => {
        const lat = THREE.MathUtils.clamp(school.location[0] || latMin, latMin, latMax);
        const lng = THREE.MathUtils.clamp(school.location[1] || lngMin, lngMin, lngMax);
        const tx = ((lng - lngMin) / lngSpan - 0.5) * win.paneW * 0.92;
        const ty = ((lat - latMin) / latSpan - 0.5) * win.paneH * 0.92;
        let best = -1, bestD = Infinity;
        free.forEach((i) => {
          const c = win.cells[i];
          const d = (c.cx - tx) * (c.cx - tx) + (c.cy - ty) * (c.cy - ty);
          if (d < bestD) { bestD = d; best = i; }
        });
        if (best >= 0) { free.delete(best); cellIdxFor.set(school.name, best); }
      });

    const S = ATMO.wall.scale;
    const D = ATMO.wall.depth;
    const T = ATMO.wall.tilt;
    const mono = new THREE.Color(ATMO.glass.monoColor);
    const crackZ = ATMO.wall.glassDepth / 2 + 0.006;
    const { urgentDays, soonDays, approachingDays } = ATMO.deadlineStorm;

    return processedUniversities.map((school) => {
      const idx = cellIdxFor.get(school.name) ?? 0;
      const cell = win.cells[idx % win.cells.length];
      const tint = new THREE.Color(getTypeColor(school.type));
      const material = new THREE.MeshPhysicalMaterial({
        color: '#ffffff', metalness: 0,
        roughness: ATMO.glass.roughness,
        transmission: ATMO.glass.transmission,
        thickness: ATMO.glass.thickness,
        ior: ATMO.glass.ior,
        attenuationColor: mono.clone(), // starts monochromatic (intact)
        attenuationDistance: 1 - ATMO.glass.tintStrength + 0.001,
        clearcoat: ATMO.glass.clearcoat,
        clearcoatRoughness: ATMO.glass.clearcoatRoughness,
        envMapIntensity: ATMO.glass.envIntensity,
        emissive: mono.clone(),
        emissiveIntensity: ATMO.glass.emissiveIntensity,
        iridescence: ATMO.glass.iridescence,
        iridescenceIOR: ATMO.glass.iridescenceIor,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const h = hash(school.id || school.name);
      const r = (n: number) => ((h * 9301 + n * 49297) % 233280) / 233280;

      // Inner crack web: one facet per program, cut inside this pane's outline.
      const programCount = school.programs?.length ?? 0;
      const facets = subdivideCell(cell.poly, programCount, ATMO.fracture.seed + (h % 9973));
      let crackGeometry: THREE.BufferGeometry | null = null;
      let crackMaterial: THREE.LineBasicMaterial | null = null;
      const days = daysUntilClosestDeadline(school);
      let urgencyLevel = 0, urgencyPulse = 0, crackColor = '#b9cfee';
      if (days !== null) {
        if (days <= urgentDays) { urgencyLevel = 3; urgencyPulse = 3.2; crackColor = '#ff5a4d'; }
        else if (days <= soonDays) { urgencyLevel = 2; urgencyPulse = 1.7; crackColor = '#ffb84d'; }
        else if (days <= approachingDays) { urgencyLevel = 1; urgencyPulse = 0.9; crackColor = '#ffd9a6'; }
      }
      if (facets.length > 1) {
        const segs: number[] = [];
        for (const f of facets) {
          for (let k = 0; k < f.poly.length; k++) {
            const p = f.poly[k];
            const q = f.poly[(k + 1) % f.poly.length];
            segs.push(p[0], p[1], crackZ, q[0], q[1], crackZ);
          }
        }
        crackGeometry = new THREE.BufferGeometry();
        crackGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
        crackMaterial = new THREE.LineBasicMaterial({
          color: crackColor,
          transparent: true,
          opacity: ATMO.facets.crackOpacity,
          depthWrite: false,
        });
      }

      return {
        school,
        geometry: cell.geometry,
        material,
        tint,
        // tiny per-pane z epsilon avoids seam z-fighting without breaking flatness
        base: new THREE.Vector3(cell.cx * S, cell.cy * S, (r(1) - 0.5) * (2 * D + 0.006)),
        tilt: new THREE.Vector3((r(2) - 0.5) * 2 * T, (r(3) - 0.5) * 2 * T, (r(4) - 0.5) * 2 * T),
        size: cell.r * S * ATMO.wall.gap,
        baseEmissive: ATMO.glass.emissiveIntensity,
        dirX: (r(5) - 0.5) * 2,
        dirZ: 0.5 + r(6) * 0.9,
        spinX: (r(7) - 0.5) * 2,
        spinY: (r(8) - 0.5) * 2,
        spinZ: (r(9) - 0.5) * 2,
        phase: r(10) * Math.PI * 2,
        facets,
        crackGeometry,
        crackMaterial,
        urgencyLevel,
        urgencyPulse,
      };
    });
  }, [processedUniversities]);

  const nameToIdx = useMemo(
    () => new Map(shards.map((s, i) => [s.school.name, i] as const)),
    [shards]
  );

  // Kinship: same type weighs most, then shared specializations, then same state.
  // These panes "catch the same light" when one of them is hovered/selected.
  const kin = useMemo<number[][]>(() => {
    const specs = shards.map((s) => new Set(s.school.specializationVector ?? []));
    return shards.map((s, i) => {
      const scored: [number, number][] = [];
      for (let j = 0; j < shards.length; j++) {
        if (j === i) continue;
        let score = 0;
        if (shards[j].school.type === s.school.type) score += 2;
        if (s.school.state && shards[j].school.state === s.school.state) score += 1;
        let shared = 0;
        specs[i].forEach((sp) => { if (specs[j].has(sp)) shared++; });
        score += Math.min(shared, 3) * 0.8;
        if (score >= 2) scored.push([score, j]);
      }
      scored.sort((a, b) => b[0] - a[0]);
      return scored.slice(0, ATMO.kin.maxSiblings).map(([, j]) => j);
    });
  }, [shards]);

  const monoColor = useMemo(() => new THREE.Color(ATMO.glass.monoColor), []);
  const frostColor = useMemo(() => new THREE.Color(ATMO.glass.frostColor), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const wallPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const cursorPoint = useMemo(() => new THREE.Vector3(), []);
  const revealRef = useRef(0); // 0 = intact monochrome … 1 = shattered, type colours shown

  useEffect(() => () => {
    shards.forEach((s) => {
      s.material.dispose();
      s.crackGeometry?.dispose();
      s.crackMaterial?.dispose();
    });
  }, [shards]);

  // High-contrast structure BEHIND the glass so the scene bends richly through each shard.
  const backdropPoints = useMemo(() => {
    const N = 700;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const palette = ['#9fc2ff', '#ffd9b0', '#c7a0ff', '#9affd1', '#ffffff'];
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 36;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 36;
      pos[i * 3 + 2] = -4 - Math.random() * 22; // a slab well behind the field
      c.set(palette[(Math.random() * palette.length) | 0]);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  useEffect(() => () => backdropPoints.dispose(), [backdropPoints]);

  const matched = useMemo(() => {
    const f: Filters = {
      search, state: aState, program: aProgram, type: aType, semester: aSemester,
      nc: aNc, method: aMethod, language: aLang, degree: aDegree, timeline,
    };
    return shards.map((s) => passesFilters(s.school, f));
  }, [shards, search, aState, aProgram, aType, aSemester, aNc, aMethod, aLang, aDegree, timeline]);

  const fieldRef = useRef<THREE.Group>(null);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const breakT = useRef<number[]>([]);
  const kinGlow = useRef<number[]>([]);
  const hoverT = useRef<number[]>([]);
  const frostT = useRef<number[]>([]);
  const hoveredRef = useRef<number>(-1);
  const fieldYaw = useRef(0);
  const fieldPitch = useRef(0);
  if (breakT.current.length !== shards.length) breakT.current = shards.map(() => 0);
  if (kinGlow.current.length !== shards.length) kinGlow.current = shards.map(() => 0);
  if (hoverT.current.length !== shards.length) hoverT.current = shards.map(() => 0);
  if (frostT.current.length !== shards.length) frostT.current = shards.map(() => 0);

  // The pane that's currently cracked open into program facets. `openT` eases
  // 0→1 (open) and back; the pane only switches once it has resealed.
  const [openIdx, setOpenIdx] = useState(-1);
  const openT = useRef(0);
  const facetHoverRef = useRef(-1);
  const facetRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Hover name tag (carried over from the orbital-globe version): the school
  // name floats above the hovered pane; with a pane cracked open, the hovered
  // facet shows its program instead. State mirrors the refs so the label text
  // re-renders; position/opacity are animated per-frame without re-rendering.
  const [hoverIdx, setHoverIdx] = useState(-1);
  const [facetHoverIdx, setFacetHoverIdx] = useState(-1);
  const labelRef = useRef<THREE.Group>(null);
  const labelTitleRef = useRef<any>(null);
  const labelSubRef = useRef<any>(null);
  const labelOpacity = useRef(0);
  const labelTarget = useMemo(() => new THREE.Vector3(), []);

  const openFacets = useMemo<OpenFacet[] | null>(() => {
    if (openIdx < 0 || openIdx >= shards.length) return null;
    const s = shards[openIdx];
    if (s.facets.length === 0) return null;
    const programs = s.school.programs ?? [];
    const baseH = hash(s.school.name);
    return s.facets.map((facet, j) => {
      const program = programs[Math.min(j, Math.max(programs.length - 1, 0))];
      const color = new THREE.Color(DEGREE_COLORS[degreeKey(program?.degree)]);
      const r = (n: number) => ((baseH * 7349 + (j + 1) * 49297 + n * 15485863) % 233280) / 233280;
      return {
        facet,
        program,
        geometry: buildFacetGeometry(facet, ATMO.wall.glassDepth, 0.012),
        material: new THREE.MeshPhysicalMaterial({
          color: '#ffffff', metalness: 0,
          roughness: ATMO.glass.roughness,
          transmission: ATMO.glass.transmission,
          thickness: ATMO.glass.thickness,
          ior: ATMO.glass.ior,
          attenuationColor: color.clone(),
          attenuationDistance: 1 - ATMO.glass.tintStrength + 0.001,
          clearcoat: ATMO.glass.clearcoat,
          clearcoatRoughness: ATMO.glass.clearcoatRoughness,
          envMapIntensity: ATMO.glass.envIntensity,
          emissive: color.clone(),
          emissiveIntensity: ATMO.facets.emissive,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
        }),
        zJit: r(1) * 0.5,
        tiltX: (r(2) - 0.5) * 0.5,
        tiltY: (r(3) - 0.5) * 0.5,
        phase: r(4) * Math.PI * 2,
      };
    });
  }, [openIdx, shards]);

  useEffect(() => () => {
    openFacets?.forEach((f) => { f.geometry.dispose(); f.material.dispose(); });
  }, [openFacets]);

  // What the name tag says right now: a hovered program facet wins over the pane.
  const hoverFacet = openIdx >= 0 && facetHoverIdx >= 0 ? openFacets?.[facetHoverIdx] : null;
  const hoverShard = hoverIdx >= 0 ? shards[hoverIdx] : null;
  const labelTitle = hoverFacet?.program?.name ?? hoverShard?.school.name ?? '';
  const labelSub = hoverFacet
    ? [hoverFacet.program?.degree, shards[openIdx]?.school.name].filter(Boolean).join(' · ')
    : hoverShard
      ? [hoverShard.school.city, hoverShard.school.state].filter(Boolean).join(', ')
      : '';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const storm = useSchoolStore.getState().storminess;
    const selName = selectedUniversity?.name;
    const selIdx = selName != null ? (nameToIdx.get(selName) ?? -1) : -1;

    // The wall answers the cursor: the field eases toward the pointer, with an
    // idle sway (storm-ramped) so reflections keep sweeping across the glass.
    const I = ATMO.interact;
    const ptr = state.pointer;
    const swayY = Math.sin(t * 0.22) * lerp(I.swayYawCalm, I.swayYawStorm, storm);
    const swayX = Math.sin(t * 0.16) * lerp(I.swayPitchCalm, I.swayPitchStorm, storm);
    fieldYaw.current = lerp(fieldYaw.current, ptr.x * I.parallaxYaw + swayY, I.followLerp);
    fieldPitch.current = lerp(fieldPitch.current, -ptr.y * I.parallaxPitch + swayX, I.followLerp);
    if (fieldRef.current) {
      fieldRef.current.rotation.y = fieldYaw.current;
      fieldRef.current.rotation.x = fieldPitch.current;
    }
    // Where the cursor ray meets the wall plane — drives the local ripple.
    const hasCursor = state.raycaster.ray.intersectPlane(wallPlane, cursorPoint) !== null;

    // Crack-open state machine: reseal the current pane before opening the next.
    const wantIdx = selIdx >= 0 && matched[selIdx] ? selIdx : -1;
    if (openIdx !== wantIdx) {
      openT.current = lerp(openT.current, 0, 0.16);
      if (openT.current < 0.02) {
        openT.current = 0;
        facetHoverRef.current = -1;
        setFacetHoverIdx(-1);
        setOpenIdx(wantIdx);
      }
    } else if (openIdx >= 0) {
      openT.current = lerp(openT.current, 1, ATMO.facets.openLerp);
    }
    const open = openT.current;

    // Monochrome while intact; per-school type colours emerge once it's shattering.
    const filtering = matched.some((m) => !m) ? 1 : 0;
    revealRef.current = lerp(revealRef.current, filtering, 0.05);
    const reveal = revealRef.current;

    // Kinship light follows the hovered pane, falling back to the selected one.
    const focusIdx = hoveredRef.current >= 0 ? hoveredRef.current : selIdx;
    const kinList = focusIdx >= 0 && focusIdx < kin.length ? kin[focusIdx] : null;

    for (let i = 0; i < shards.length; i++) {
      const group = groupRefs.current[i];
      if (!group) continue;
      const s = shards[i];

      const target = matched[i] ? 0 : 1;
      const bt = lerp(breakT.current[i], target, ATMO.wall.breakLerp);
      breakT.current[i] = bt;
      if (bt > 0.995) { group.visible = false; continue; }
      group.visible = true;

      const isSel = selName === s.school.name;
      const isHov = hoveredRef.current === i;
      const isKin = !!kinList && i !== focusIdx && kinList.includes(i);
      const kg = (kinGlow.current[i] = lerp(kinGlow.current[i], isKin ? 1 : 0, 0.08));
      const hv = (hoverT.current[i] = lerp(hoverT.current[i], isHov ? 1 : 0, I.hoverEase));
      // non-focused panes frost while something is hovered/selected (kin stay lit)
      const frostTarget = focusIdx >= 0 && i !== focusIdx && !isKin && !isSel ? 1 : 0;
      const ft = (frostT.current[i] = lerp(frostT.current[i], frostTarget, I.frostEase));
      const rattle = storm * 0.05 * s.size; // panes tremble only as the storm builds

      // cursor ripple — panes near the pointer lift and tip toward it
      let ripple = 0, rdx = 0, rdy = 0;
      if (hasCursor && matched[i]) {
        const dx = cursorPoint.x - s.base.x;
        const dy = cursorPoint.y - s.base.y;
        const d = Math.hypot(dx, dy);
        ripple = 1 - smoothstep(0, I.rippleRadius, d);
        rdx = dx; rdy = dy;
      }

      // resting transform — intact & still, tilted to catch light; storm rattle,
      // cursor ripple, and selection/hover lift (hover eased for responsiveness)
      let px = s.base.x + Math.sin(t * 7 + s.phase) * rattle;
      let py = s.base.y + Math.cos(t * 8 + s.phase) * rattle;
      let pz = s.base.z + (isSel ? 4.0 : 0) + hv * 1.2 + ripple * I.rippleLift;
      // hovered/selected panes turn flat toward the camera (glass facing you)
      const flatten = Math.max(0, 1 - hv * 0.7 - (isSel ? 0.5 : 0));
      let rx = s.tilt.x * flatten - rdy * ripple * I.rippleTilt;
      let ry = s.tilt.y * flatten + rdx * ripple * I.rippleTilt;
      let rz = s.tilt.z * flatten;

      // broken transform — fly outward + tumble + fall, fading out
      if (bt > 0.0001) {
        const fe = bt * bt;
        px += s.dirX * bt * 4;
        py -= fe * ATMO.wall.fallDistance;
        pz += s.dirZ * bt * 10;
        rx += s.spinX * bt * 4;
        ry += s.spinY * bt * 3;
        rz += s.spinZ * bt * 4;
      }

      group.position.set(px, py, pz);
      group.rotation.set(rx, ry, rz);
      const selScale = (isSel ? 1.18 : 1.0) + hv * 0.07;
      group.scale.setScalar(s.size * selScale * (1 - 0.25 * bt));

      const openHere = i === openIdx ? open : 0;
      const m = s.material;
      const kinShimmer = kg * ATMO.kin.glow * (0.75 + 0.35 * Math.sin(t * 2.6 + s.phase * 3.7));
      m.emissiveIntensity =
        s.baseEmissive * ((isSel ? 3.0 : 1.0 + hv * 0.9) + kinShimmer + ripple * 0.4) * (1 - bt) * (1 - 0.5 * ft);
      // the pane itself fades as it cracks open into its facets
      m.opacity = (1 - smoothstep(0.35, 1.0, bt)) * (1 - 0.85 * openHere) * (1 - 0.12 * ft);

      // focus = clarity (the lab's intent): the focused pane turns crisp and
      // extra reflective, the rest of the wall frosts and desaturates
      const frost = ft * I.focusFrost;
      m.roughness = lerp(ATMO.glass.roughness, ATMO.glass.frostRoughness, frost);
      m.envMapIntensity = ATMO.glass.envIntensity * (1 - 0.55 * frost) * (1 + 0.5 * hv + 0.25 * ripple);

      // intact → uniform mono glass; shattering → this school's type colour;
      // frosted panes drift toward the washed-out cold tone
      tmpColor.copy(monoColor).lerp(s.tint, reveal).lerp(frostColor, frost * 0.7);
      m.attenuationColor.copy(tmpColor);
      m.emissive.copy(tmpColor);

      // etched crack web: brightens on hover, pulses with deadline urgency,
      // hands over to the facets while the pane is open
      if (s.crackMaterial) {
        const pulse = s.urgencyPulse > 0 ? 0.5 + 0.5 * Math.sin(t * s.urgencyPulse + s.phase) : 0;
        const base = ATMO.facets.crackOpacity * (isHov || isSel ? 2.2 : 1 + kg * 0.8);
        const urgency = [0, 0.10, 0.18, 0.30][s.urgencyLevel] * pulse;
        s.crackMaterial.opacity = (base + urgency) * (1 - bt) * (1 - openHere);
      }
    }

    // Program facets of the open pane: separate radially, pop toward the camera.
    if (openIdx >= 0 && openFacets) {
      const selProgId = useSchoolStore.getState().selectedProgramId;
      const sep = ATMO.facets.separation * open;
      for (let j = 0; j < openFacets.length; j++) {
        const mesh = facetRefs.current[j];
        if (!mesh) continue;
        const f = openFacets[j];
        const isFHov = facetHoverRef.current === j;
        const isFSel = !!f.program && (f.program as any).program_id === selProgId;
        mesh.position.set(
          f.facet.cx * (1 + sep),
          f.facet.cy * (1 + sep),
          0.02 + open * ATMO.facets.zPop * (0.6 + f.zJit) + (isFSel ? 0.22 : isFHov ? 0.12 : 0)
        );
        mesh.rotation.set(f.tiltX * open, f.tiltY * open, 0);
        mesh.scale.setScalar(isFSel ? 1.05 : 1);
        const fm = f.material;
        fm.opacity = Math.min(1, open * 2.2);
        fm.emissiveIntensity =
          ATMO.facets.emissive * (isFSel ? 2.6 : isFHov ? 1.8 : 1.0) * (0.85 + 0.15 * Math.sin(t * 1.8 + f.phase));
      }
    }

    // Name tag follows whatever is hovered — a program facet (if a pane is
    // open) or a pane — easing into place and fading like the old globe labels.
    const label = labelRef.current;
    if (label) {
      let anchor: THREE.Object3D | null = null;
      let lift = 0;
      const fj = facetHoverRef.current;
      if (openIdx >= 0 && fj >= 0 && facetRefs.current[fj]) {
        anchor = facetRefs.current[fj];
        lift = shards[openIdx].size * 0.45 + 0.25;
      } else if (hoveredRef.current >= 0 && matched[hoveredRef.current]) {
        anchor = groupRefs.current[hoveredRef.current];
        lift = shards[hoveredRef.current].size * 0.8 + 0.3;
      }
      const o = (labelOpacity.current = lerp(labelOpacity.current, anchor ? 1 : 0, 0.16));
      label.visible = o > 0.02;
      if (anchor) {
        anchor.getWorldPosition(labelTarget);
        label.parent?.worldToLocal(labelTarget);
        labelTarget.y += lift;
        labelTarget.z += 1.4;
        if (o < 0.06) label.position.copy(labelTarget); // snap when (re)appearing
        else label.position.lerp(labelTarget, 0.3);
      }
      label.scale.setScalar(0.92 + 0.08 * o);
      if (labelTitleRef.current?.material) labelTitleRef.current.material.opacity = o;
      if (labelSubRef.current?.material) labelSubRef.current.material.opacity = o * 0.85;
    }
  });

  const onOver = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!matched[i]) return;
    hoveredRef.current = i;
    setHoverIdx(i);
    if (typeof document !== 'undefined') document.body.style.cursor = 'pointer';
  };
  const onOut = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (hoveredRef.current === i) hoveredRef.current = -1;
    setHoverIdx((cur) => (cur === i ? -1 : cur));
    if (typeof document !== 'undefined') document.body.style.cursor = 'auto';
  };
  const onClick = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!matched[i]) return;
    const school = shards[i].school;
    const cur = useSchoolStore.getState().selectedUniversity;
    setSelectedProgramId(null);
    setSelectedUniversity(cur?.name === school.name ? null : school);
  };

  const onFacetOver = (j: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    facetHoverRef.current = j;
    setFacetHoverIdx(j);
    if (typeof document !== 'undefined') document.body.style.cursor = 'pointer';
  };
  const onFacetOut = (j: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (facetHoverRef.current === j) facetHoverRef.current = -1;
    setFacetHoverIdx((cur) => (cur === j ? -1 : cur));
    if (typeof document !== 'undefined') document.body.style.cursor = 'auto';
  };
  const onFacetClick = (j: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const pid = (openFacets?.[j]?.program as any)?.program_id;
    if (!pid) return;
    const cur = useSchoolStore.getState().selectedProgramId;
    setSelectedProgramId(cur === pid ? null : pid);
  };

  return (
    <group name="glassWall">
      {/* Bright structure behind the glass so the scene bends richly through each shard */}
      <points geometry={backdropPoints}>
        <pointsMaterial
          vertexColors
          size={0.22}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </points>
      <group ref={fieldRef}>
        {shards.map((s, i) => (
          <group
            key={s.school.id || s.school.name}
            ref={(el) => { groupRefs.current[i] = el; }}
            position={s.base}
            scale={s.size}
          >
            <mesh
              geometry={s.geometry}
              material={s.material}
              onPointerOver={onOver(i)}
              onPointerOut={onOut(i)}
              onClick={onClick(i)}
            />
            {s.crackGeometry && s.crackMaterial && (
              <lineSegments
                geometry={s.crackGeometry}
                material={s.crackMaterial}
                raycast={() => null}
              />
            )}
            {i === openIdx && openFacets && openFacets.map((f, j) => (
              <mesh
                key={j}
                ref={(el) => { facetRefs.current[j] = el; }}
                geometry={f.geometry}
                material={f.material}
                position={[f.facet.cx, f.facet.cy, 0.02]}
                onPointerOver={onFacetOver(j)}
                onPointerOut={onFacetOut(j)}
                onClick={onFacetClick(j)}
              />
            ))}
          </group>
        ))}
      </group>
      {/* Hover name tag — school (or program) names appear on hover, like the
          old orbital globe. Drawn over the glass (no depth test). */}
      <group ref={labelRef} visible={false}>
        <Billboard follow>
          <Text
            ref={labelTitleRef}
            fontSize={0.46}
            color="#F8FAFC"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.03}
            outlineColor="#0B1220"
            fontWeight="bold"
            maxWidth={10}
            textAlign="center"
            material-transparent
            material-opacity={0}
            material-depthTest={false}
            material-depthWrite={false}
            renderOrder={1000}
          >
            {labelTitle}
          </Text>
          {labelSub && (
            <Text
              ref={labelSubRef}
              position={[0, -0.12, 0]}
              fontSize={0.28}
              color="#9FC2FF"
              anchorX="center"
              anchorY="top"
              outlineWidth={0.022}
              outlineColor="#0B1220"
              maxWidth={10}
              textAlign="center"
              material-transparent
              material-opacity={0}
              material-depthTest={false}
              material-depthWrite={false}
              renderOrder={1000}
            >
              {labelSub}
            </Text>
          )}
        </Billboard>
      </group>
    </group>
  );
}
