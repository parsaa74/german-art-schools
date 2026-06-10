'use client'

/**
 * MoodySky — the preview lab's sky, as a real 3D dome.
 *
 * A big BackSide sphere with the FBM storm-cloud shader ported straight from
 * scratch/glass-node-preview.html: deep-indigo gradient, drifting clouds that
 * darken/churn with storminess, and a cool lightning flash. Because it's a 3D
 * dome (not a flat fullscreen quad) it gives the scene real depth/parallax and
 * doubles as the structure the glass refracts. Driven by the store's weather.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSchoolStore } from '@/stores/schoolStore';

const VERT = /* glsl */`
  varying vec3 vP;
  void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const FRAG = /* glsl */`
  varying vec3 vP;
  uniform float uTime, uWeather, uFlash;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }
  void main(){
    vec3 d = normalize(vP);
    float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 topC = mix(vec3(0.05,0.07,0.15), vec3(0.005,0.01,0.03), uWeather);
    vec3 horC = mix(vec3(0.18,0.13,0.20), vec3(0.04,0.05,0.09), uWeather);
    vec3 col = mix(horC, topC, smoothstep(0.0, 1.0, h));
    vec2 uv = vec2(atan(d.z, d.x), h);
    float speed = mix(0.012, 0.06, uWeather);
    float n = fbm(uv * vec2(2.5, 3.5) + vec2(uTime * speed, uTime * speed * 0.3));
    float cloud = smoothstep(0.45, 0.95, n) * smoothstep(0.02, 0.5, h);
    vec3 cloudCol = mix(vec3(0.28,0.24,0.30), vec3(0.015,0.02,0.04), uWeather);
    col = mix(col, cloudCol, cloud * mix(0.35, 0.95, uWeather));
    col += uFlash * vec3(0.55, 0.65, 0.95) * (0.4 + cloud);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function MoodySky() {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uWeather: { value: 0 }, uFlash: { value: 0 },
  }), []);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const { storminess, lightningFlash } = useSchoolStore.getState();
    matRef.current.uniforms.uTime.value = clock.elapsedTime;
    matRef.current.uniforms.uWeather.value = storminess;
    matRef.current.uniforms.uFlash.value = lightningFlash;
  });

  return (
    <mesh scale={80} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial
        ref={matRef}
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
      />
    </mesh>
  );
}
