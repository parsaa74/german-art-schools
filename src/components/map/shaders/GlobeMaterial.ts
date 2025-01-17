'use client'

import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

// Create the shader material
const GlobeMaterial = shaderMaterial(
  // Uniforms
  {
    time: 0,
    dayProgress: 0.0,
    filteredCount: 1.0,
    artsScienceRatio: 0.5,
    mousePosition: new THREE.Vector2(0, 0),
    mouseStrength: 0.0,
    dawnColor: new THREE.Color('#080808'),
    dayColor: new THREE.Color('#FCFCFC'),
    duskColor: new THREE.Color('#242424'),
    nightColor: new THREE.Color('#000000'),
    artsColor: new THREE.Color('#FFFFFF'),
    scienceColor: new THREE.Color('#111111'),
    aberrationStrength: 0.012,
    flowSpeed: 0.25,
    // Audio reactive uniforms
    audioIntensity: 0.0,
    audioLowBand: 0.0,
    audioMidBand: 0.0,
    audioHighBand: 0.0
  },
  // Vertex shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    varying float vDisplacement;
    
    uniform float time;
    uniform float audioIntensity;
    uniform float audioLowBand;
    uniform float audioMidBand;
    uniform float audioHighBand;
    
    // Rotation matrix around the Y axis.
    mat3 rotateY(float angle) {
      float s = sin(angle);
      float c = cos(angle);
      return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
      );
    }
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Create dynamic rotation with audio influence
      float rotationSpeed = time * 0.1 * (1.0 + audioLowBand * 0.5);
      mat3 rotation = rotateY(rotationSpeed);
      vec3 rotatedPosition = rotation * position;
      vPosition = rotatedPosition;
      
      // Create dynamic wave pattern with audio reactivity
      float frequency = 8.0 + audioHighBand * 16.0;
      float amplitude = 0.08 * (1.0 + audioMidBand * 2.0);
      float wave = sin(rotatedPosition.x * frequency + time) * 
                  cos(rotatedPosition.y * frequency + time) * 
                  sin(rotatedPosition.z * frequency + time);
      
      // Add audio-reactive displacement
      float audioDisplacement = audioIntensity * 0.2;
      vec3 displaced = position + normal * (wave * amplitude + audioDisplacement);
      vDisplacement = wave;
      
      vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
      vViewPosition = cameraPosition - worldPosition.xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `,
  // Fragment shader
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    varying float vDisplacement;
    
    uniform float time;
    uniform float dayProgress;
    uniform float filteredCount;
    uniform float artsScienceRatio;
    uniform vec3 dawnColor;
    uniform vec3 dayColor;
    uniform vec3 duskColor;
    uniform vec3 nightColor;
    uniform vec3 artsColor;
    uniform vec3 scienceColor;
    uniform float flowSpeed;
    uniform float audioIntensity;
    uniform float audioLowBand;
    uniform float audioMidBand;
    uniform float audioHighBand;
    
    // Stripe pattern with dynamic frequency
    float stripes(vec3 pos, float frequency) {
      return sin(pos.x * frequency + pos.y * frequency + time * flowSpeed * (1.0 + audioMidBand));
    }
    
    // Moiré pattern generator with audio reactivity
    float moire(vec3 pos) {
      float baseFreq = 40.0 * (1.0 + audioHighBand * 2.0);
      float pattern1 = stripes(pos, baseFreq);
      float pattern2 = stripes(pos * (1.01 + audioLowBand * 0.1), baseFreq);
      return (pattern1 - pattern2) * 0.5 + 0.5;
    }
    
    // Smooth abs function for softer patterns
    float sabs(float x, float k) {
      float h = k * x;
      return (sqrt(1.0 + h * h) - 1.0) / k;
    }

    void main() {
      // Create base moiré pattern
      float moirePattern = moire(vPosition);
      
      // Dynamic stripe frequency based on filtered count and audio
      float stripeFreq = 20.0 + filteredCount * 30.0 + audioHighBand * 50.0;
      float stripePattern = stripes(vPosition, stripeFreq);
      
      // Create interference pattern with audio modulation
      float interference = sabs(stripePattern * moirePattern, 1.0 + audioMidBand);
      
      // Time-based color mixing with audio influence
      vec3 timeColor1 = mix(nightColor, dawnColor, dayProgress + audioLowBand * 0.2);
      vec3 timeColor2 = mix(dayColor, duskColor, dayProgress + audioHighBand * 0.2);
      vec3 baseColor = mix(timeColor1, timeColor2, interference);
      
      // Add discipline influence
      vec3 disciplineColor = mix(scienceColor, artsColor, artsScienceRatio);
      
      // Create dynamic mask based on view angle and audio
      float viewMask = pow(1.0 - abs(dot(normalize(vViewPosition), vNormal)), 2.0);
      float audioMask = audioIntensity * 0.5;
      
      // Combine everything with dynamic masking
      vec3 finalColor = mix(
        baseColor,
        disciplineColor,
        (viewMask + audioMask) * abs(sin(time * 0.5)) * 0.8
      );
      
      // Add high-contrast edges with audio reactivity
      float edge = 1.0 - pow(abs(dot(vNormal, normalize(vViewPosition))), 0.5 + audioHighBand * 0.5);
      finalColor = mix(finalColor, vec3(1.0), edge * (0.15 + audioIntensity * 0.2));
      
      // Dynamic contrast adjustment with audio influence
      float contrast = 1.0 + sin(time * 0.2) * 0.2 + audioMidBand * 0.3;
      finalColor = pow(finalColor, vec3(contrast));
      
      // Add subtle audio-reactive glow
      float glow = audioIntensity * 0.3;
      finalColor += vec3(glow);
      
      // Ensure we stay in valid range
      finalColor = clamp(finalColor, 0.0, 1.0);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
)

// Extend Three.js with our custom material
extend({ GlobeMaterial })

// Add proper TypeScript types
type GlobeMaterialImpl = {
  uniforms: {
    time: { value: number }
    dayProgress: { value: number }
    filteredCount: { value: number }
    artsScienceRatio: { value: number }
    mousePosition: { value: THREE.Vector2 }
    mouseStrength: { value: number }
    dawnColor: { value: THREE.Color }
    dayColor: { value: THREE.Color }
    duskColor: { value: THREE.Color }
    nightColor: { value: THREE.Color }
    artsColor: { value: THREE.Color }
    scienceColor: { value: THREE.Color }
    aberrationStrength: { value: number }
    flowSpeed: { value: number }
    audioIntensity: { value: number }
    audioLowBand: { value: number }
    audioMidBand: { value: number }
    audioHighBand: { value: number }
  }
} & THREE.ShaderMaterial

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'globeMaterial': Partial<GlobeMaterialImpl> & JSX.IntrinsicElements['shaderMaterial']
    }
  }
}

export type { GlobeMaterialImpl as GlobeMaterial }
export default GlobeMaterial 