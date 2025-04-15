'use client'

import { useRef, useMemo, useEffect } from 'react' // Added useEffect import
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'

// --- START: Shaders for Background Quad ---
const backgroundVertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Position the quad to fill the screen, respecting camera perspective
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); 
  }
`;

const backgroundFragmentShader = /* glsl */`
  uniform float time;
  uniform vec2 resolution;
  varying vec2 vUv;

  // Noise function (e.g., Simplex or Perlin - using a simple one here for brevity)
  // Source: https://thebookofshaders.com/11/
  float random (vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // 2D Noise based on Morgan McGuire @morgan3d
  // https://www.shadertoy.com/view/4dS3Wd
  float noise (vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      // Four corners in 2D of a tile
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      // Smooth Interpolation
      vec2 u = f*f*(3.0-2.0*f);
      // u = smoothstep(0.,1.,f); // Alternative interpolation

      // Mix 4 corners percentages
      return mix(a, b, u.x) +
              (c - a)* u.y * (1.0 - u.x) +
              (d - b) * u.x * u.y;
  }

  // FBM (Fractal Brownian Motion) for more complex patterns
  float fbm (vec2 st) {
      float value = 0.0;
      float amplitude = .5;
      float frequency = 0.;
      // Loop of octaves
      for (int i = 0; i < 5; i++) { // Fewer octaves for performance
          value += amplitude * noise(st);
          st *= 2.;
          amplitude *= .5;
      }
      return value;
  }

  void main() {
    // Adjust UVs based on resolution to avoid stretching
    vec2 uv = vUv; // Use vUv directly for screen space
    vec2 aspectCorrectedUv = uv * vec2(resolution.x / resolution.y, 1.0);

    // Evolving noise pattern
    float noisePattern = fbm(aspectCorrectedUv * 2.5 + time * 0.05); // Slower evolution, adjust scale

    // Add another layer of slower, larger noise for variation
    float slowNoise = fbm(aspectCorrectedUv * 0.8 + time * 0.02);

    // Color mapping - create a dark, ethereal look
    vec3 color1 = vec3(0.01, 0.02, 0.05); // Deep blue/purple
    vec3 color2 = vec3(0.05, 0.1, 0.2);  // Slightly lighter blue
    vec3 color3 = vec3(0.1, 0.05, 0.15); // Hint of magenta/purple

    // --- FIX: Define combinedNoise before use ---
    float combinedNoise = noisePattern * 0.7 + slowNoise * 0.3; // Combine noise patterns

    vec3 finalColor = mix(color1, color2, smoothstep(0.3, 0.6, combinedNoise));
    finalColor = mix(finalColor, color3, smoothstep(0.5, 0.8, slowNoise * 0.5 + noisePattern * 0.5));

    // Add subtle vignette
    float vignette = smoothstep(0.8, 0.3, length(uv - 0.5)); // Inward vignette
    finalColor *= vignette * 1.2; // Apply vignette and slightly boost brightness

    // Add subtle grain (optional)
    // finalColor += (random(uv + time * 0.1) - 0.5) * 0.03;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
// --- END: Shaders for Background Quad ---


export default function Background() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree(); // Get viewport size for resolution uniform

  const uniforms = useMemo(() => ({
      time: { value: 0.0 },
      resolution: { value: new THREE.Vector2(size.width * window.devicePixelRatio, size.height * window.devicePixelRatio) }
  }), [size]);

  // Update resolution uniform if size changes
  useEffect(() => {
      uniforms.resolution.value.set(size.width * window.devicePixelRatio, size.height * window.devicePixelRatio);
  }, [size, uniforms]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    // Fullscreen Quad
    <mesh renderOrder={-1}> {/* Render behind everything else */}
      <planeGeometry args={[2, 2]} /> {/* Simple plane covering the viewport */}
      <shaderMaterial
        ref={materialRef}
        vertexShader={backgroundVertexShader}
        fragmentShader={backgroundFragmentShader}
         uniforms={uniforms}
         depthWrite={false} // No need to write to depth buffer
         depthTest={false} // Prevent interference with objects behind
       />
     </mesh>
  );
}
