'use client'

/**
 * Atmosphere — the moody weather/mood layer for the shattered-glass network.
 *
 * Owns:
 *  - a controlled moody Environment (Lightformers) the glass reflects as glints
 *  - FogExp2 that thickens & cools with storminess
 *  - world-space rain whose intensity follows storminess
 *  - lightning flashes + renderer exposure
 *  - the DRIVER that derives storminess + intent from application deadlines and
 *    the user's current selection/filters (when atmosphereAuto is on)
 *
 * Components read storminess/intent via getState() inside their own frame loops,
 * so writing them here every frame triggers no React re-renders.
 */

import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { useSchoolStore } from '@/stores/schoolStore';
import { ATMO } from './config';
import { MoodySky } from './MoodySky';

const lerp = THREE.MathUtils.lerp;

// ----------------------------------------------------------------------------
// Rain — shader-driven streaks, one draw call, animated entirely on the GPU.
// ----------------------------------------------------------------------------
function buildRain(): THREE.LineSegments {
  const { drops, range, spread, color, maxOpacity } = ATMO.rain;
  const pos = new Float32Array(drops * 2 * 3);
  const aTop = new Float32Array(drops * 2);
  const aPhase = new Float32Array(drops * 2);
  const aSpeed = new Float32Array(drops * 2);
  const aLen = new Float32Array(drops * 2);
  const aWind = new Float32Array(drops * 2);
  for (let i = 0; i < drops; i++) {
    const x = (Math.random() - 0.5) * spread * 2;
    const z = (Math.random() - 0.5) * spread * 2;
    const ph = Math.random();
    const sp = range * (0.35 + Math.random() * 0.4);
    const ln = range * (0.015 + Math.random() * 0.02);
    const wd = range * (0.01 + Math.random() * 0.02);
    for (let k = 0; k < 2; k++) {
      const j = i * 2 + k;
      pos[j * 3] = x; pos[j * 3 + 1] = 0; pos[j * 3 + 2] = z;
      aTop[j] = k; aPhase[j] = ph; aSpeed[j] = sp; aLen[j] = ln; aWind[j] = wd;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aTop', new THREE.BufferAttribute(aTop, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  g.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
  g.setAttribute('aLen', new THREE.BufferAttribute(aLen, 1));
  g.setAttribute('aWind', new THREE.BufferAttribute(aWind, 1));

  const c = new THREE.Color(color);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uRange: { value: range },
      uWeather: { value: 0 },
      uColor: { value: new THREE.Vector3(c.r, c.g, c.b) },
      uMaxOpacity: { value: maxOpacity },
    },
    vertexShader: /* glsl */`
      attribute float aTop, aPhase, aSpeed, aLen, aWind;
      uniform float uTime, uRange;
      varying float vA; uniform float uWeather;
      void main() {
        vec3 p = position;
        float fall = mod(uTime * aSpeed + aPhase * uRange, uRange);
        p.y = uRange * 0.5 - fall + aTop * aLen;
        p.x += sin(uTime * 0.6 + aPhase * 6.28) * aWind;
        vA = uWeather;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying float vA; uniform vec3 uColor; uniform float uMaxOpacity;
      void main() { gl_FragColor = vec4(uColor, vA * uMaxOpacity); }
    `,
  });

  const ls = new THREE.LineSegments(g, mat);
  ls.frustumCulled = false;
  ls.renderOrder = 2;
  return ls;
}

function Rain() {
  const obj = useMemo(buildRain, []);
  useEffect(() => () => { obj.geometry.dispose(); (obj.material as THREE.Material).dispose(); }, [obj]);
  useFrame(({ clock }) => {
    const m = obj.material as THREE.ShaderMaterial;
    m.uniforms.uTime.value = clock.elapsedTime;
    m.uniforms.uWeather.value = useSchoolStore.getState().storminess;
  });
  return <primitive object={obj} />;
}

// ----------------------------------------------------------------------------
// Driver + fog + lightning + exposure
// ----------------------------------------------------------------------------
function useAtmosphereTargets() {
  // Subscribe to each low-frequency input as a primitive so the driver's
  // per-frame storminess writes never re-render this component.
  const selectedUniversity = useSchoolStore((s) => s.selectedUniversity);
  const aState = useSchoolStore((s) => s.activeStateFilter);
  const aProgram = useSchoolStore((s) => s.activeProgramFilter);
  const aType = useSchoolStore((s) => s.activeTypeFilter);
  const aSemester = useSchoolStore((s) => s.activeSemesterFilter);
  const aNc = useSchoolStore((s) => s.activeNcFilter);
  const aMethod = useSchoolStore((s) => s.activeApplicationMethodFilter);
  const aLang = useSchoolStore((s) => s.activeCourseLanguageFilter);
  const aDegree = useSchoolStore((s) => s.activeDegreeFilter);
  const timeline = useSchoolStore((s) => s.timelineFilter);
  const search = useSchoolStore((s) => s.searchQuery);

  return useMemo(() => {
    let activeFilters = 0;
    if (aState) activeFilters++;
    if (aProgram) activeFilters++;
    if (aType) activeFilters++;
    if (aSemester) activeFilters++;
    if (aNc != null) activeFilters++;
    if (aMethod != null) activeFilters++;
    if (aLang != null) activeFilters++;
    if (aDegree != null) activeFilters++;
    if (timeline) activeFilters++;
    if (search && search.trim()) activeFilters++;

    // Storm builds as the user piles on filters: rain comes in, then lightning.
    const stormTarget = Math.min(1, 0.06 + activeFilters * 0.2);
    const intentTarget = Math.min(1, (selectedUniversity ? 0.4 : 0) + activeFilters * 0.18);

    return { stormTarget, intentTarget };
  }, [selectedUniversity, aState, aProgram, aType, aSemester, aNc, aMethod, aLang, aDegree, timeline, search]);
}

export function Atmosphere() {
  const { gl, scene } = useThree();
  const { stormTarget, intentTarget } = useAtmosphereTargets();
  const flashRef = useRef(0);

  // Fog lives on the scene; create once and mutate per-frame.
  const fog = useMemo(() => new THREE.FogExp2(ATMO.fog.colorCalm, ATMO.fog.densityCalm), []);
  const fogCalm = useMemo(() => new THREE.Color(ATMO.fog.colorCalm), []);
  const fogStorm = useMemo(() => new THREE.Color(ATMO.fog.colorStorm), []);
  useEffect(() => {
    const prev = scene.fog;
    scene.fog = fog;
    return () => { scene.fog = prev; };
  }, [scene, fog]);

  useFrame(() => {
    const store = useSchoolStore.getState();

    // --- driver: ease current storminess/intent toward the data-derived target
    if (store.atmosphereAuto) {
      store.setStorminess(lerp(store.storminess, stormTarget, 0.05));
      store.setIntent(lerp(store.intent, intentTarget, 0.06));
    }
    const W = store.storminess;

    // --- lightning
    let flash = flashRef.current * ATMO.lightning.decay;
    if (W > ATMO.lightning.threshold && Math.random() < ATMO.lightning.chancePerFrame * W) {
      flash = 0.7 + Math.random() * 0.5;
    }
    flashRef.current = flash;
    store.setLightningFlash(flash);

    // --- fog: cooler + denser as it storms
    fog.density = lerp(ATMO.fog.densityCalm, ATMO.fog.densityStorm, W);
    fog.color.copy(fogCalm).lerp(fogStorm, W);

    // --- exposure: storms dim the world; lightning briefly over-exposes it
    gl.toneMappingExposure = ATMO.exposure * (1 + flash * 0.7) * (1 - W * 0.25);
  });

  return (
    <>
      {/* 3D moody cloud sky (preview-lab look) — also what the glass refracts */}
      <MoodySky />

      {/* Studio-ish reflection environment — bright key + cool/warm streaks so the
          glass glints and refracts like the preview lab (background stays moody). */}
      <Environment resolution={256} frames={1} background={false}>
        <Lightformer form="rect" intensity={0.9} color="#2a3550" scale={[30, 30, 1]} position={[0, 0, -16]} />
        <Lightformer form="rect" intensity={3.2} color="#e6eeff" scale={[18, 7, 1]} position={[0, 13, 6]} rotation={[-0.45, 0, 0]} />
        <Lightformer form="rect" intensity={4.2} color="#bcd4ff" scale={[0.6, 12, 1]} position={[9, 5, 7]} rotation={[0, -0.4, 0]} />
        <Lightformer form="rect" intensity={3.0} color="#ffd9b0" scale={[0.6, 11, 1]} position={[-9, -3, 6]} rotation={[0, 0.5, 0]} />
        <Lightformer form="ring" intensity={1.6} color="#c7d2fe" scale={[3, 3, 1]} position={[0, 8, -2]} />
      </Environment>

      <Rain />
    </>
  );
}
