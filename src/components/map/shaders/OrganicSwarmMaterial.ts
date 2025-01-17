import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

export type OrganicSwarmMaterialUniforms = {
  time: { value: number }
  audioReactivity: { value: number }
  lowBand: { value: number }
  midBand: { value: number }
  highBand: { value: number }
  mousePosition: { value: THREE.Vector2 }
  resolution: { value: THREE.Vector2 }
  pointSize: { value: number }
  interactionRadius: { value: number }
  interactionStrength: { value: number }
  baseColor: { value: THREE.Color }
  accentColor: { value: THREE.Color }
}

const OrganicSwarmMaterial = shaderMaterial(
  {
    time: 0,
    audioReactivity: 0,
    lowBand: 0,
    midBand: 0,
    highBand: 0,
    mousePosition: new THREE.Vector2(),
    resolution: new THREE.Vector2(),
    pointSize: 2.0,
    interactionRadius: 0.3,
    interactionStrength: 0.2,
    baseColor: new THREE.Color('#4D1BFF'),
    accentColor: new THREE.Color('#FF3366')
  },
  /* glsl */ `
    uniform float time;
    uniform float audioReactivity;
    uniform float lowBand;
    uniform float midBand;
    uniform float highBand;
    uniform vec2 mousePosition;
    uniform vec2 resolution;
    uniform float interactionRadius;
    uniform float interactionStrength;
    
    attribute vec3 velocity;
    attribute float phase;
    attribute float size;
    
    varying vec3 vPosition;
    varying float vPhase;
    varying float vDistance;
    varying float vAudioInfluence;
    
    // Improved noise function for more organic movement
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float n = i.x + i.y * 157.0 + 113.0 * i.z;
      return mix(
        mix(
          mix(fract(sin(n + 0.0) * 43758.5453123),
              fract(sin(n + 1.0) * 43758.5453123),
              f.x),
          mix(fract(sin(n + 157.0) * 43758.5453123),
              fract(sin(n + 158.0) * 43758.5453123),
              f.x),
          f.y),
        mix(
          mix(fract(sin(n + 113.0) * 43758.5453123),
              fract(sin(n + 114.0) * 43758.5453123),
              f.x),
          mix(fract(sin(n + 270.0) * 43758.5453123),
              fract(sin(n + 271.0) * 43758.5453123),
              f.x),
          f.y),
        f.z
      );
    }
    
    void main() {
      vPhase = phase;
      
      // Organic movement with improved noise
      float t = time * 0.5;
      vec3 pos = position;
      
      // Multi-layered noise for more organic movement
      float noise1 = noise(pos * 0.5 + t);
      float noise2 = noise(pos * 1.0 - t * 0.7);
      float noise3 = noise(pos * 2.0 + t * 1.3);
      float combinedNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
      
      // Add swarm behavior with audio influence
      float swarmEffect = sin(phase * 6.28 + t) * cos(phase * 3.14 + t * 0.5);
      pos += velocity * (swarmEffect * 0.3 + audioReactivity * 0.2);
      
      // Add wave motion influenced by audio bands
      pos.x += sin(pos.z * 0.2 + t) * (0.1 + lowBand * 0.2) * combinedNoise;
      pos.y += cos(pos.x * 0.2 + t) * (0.1 + midBand * 0.2) * combinedNoise;
      pos.z += sin(pos.y * 0.2 + t) * (0.1 + highBand * 0.2) * combinedNoise;
      
      // Mouse interaction
      vec4 viewPos = modelViewMatrix * vec4(pos, 1.0);
      vec2 screenPos = (viewPos.xy / viewPos.w) * 0.5 + 0.5;
      float mouseDistance = length(screenPos - mousePosition);
      float mouseInfluence = smoothstep(interactionRadius, 0.0, mouseDistance);
      pos += normalize(pos - vec3(mousePosition, 0.0)) * mouseInfluence * interactionStrength;
      
      vPosition = pos;
      vDistance = mouseDistance;
      vAudioInfluence = audioReactivity;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Dynamic point size based on audio, distance and interaction
      float baseSize = size * (1.0 + audioReactivity * 0.5);
      float distanceAttenuation = 1.0 - length(mvPosition.xyz) * 0.1;
      float interactionScale = 1.0 + mouseInfluence * 0.5;
      gl_PointSize = baseSize * distanceAttenuation * interactionScale;
    }
  `,
  /* glsl */ `
    uniform float time;
    uniform float audioReactivity;
    uniform vec3 baseColor;
    uniform vec3 accentColor;
    
    varying vec3 vPosition;
    varying float vPhase;
    varying float vDistance;
    varying float vAudioInfluence;
    
    void main() {
      // Improved soft particle effect
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r = dot(cxy, cxy);
      float softEdge = 1.0 - smoothstep(0.5, 1.0, r);
      
      // Dynamic color based on position, audio, and phase
      vec3 phaseColor = vec3(0.5) + 0.5 * cos(vPhase + time * 0.3 + vec3(0, 2, 4));
      vec3 audioColor = mix(baseColor, accentColor, vAudioInfluence);
      vec3 finalColor = mix(phaseColor, audioColor, 0.5);
      
      // Add glow effect
      float glow = exp(-r * 2.0) * (1.0 + vAudioInfluence);
      finalColor += glow * accentColor * 0.5;
      
      // Adjust alpha based on distance and audio
      float alpha = softEdge * (0.7 + vAudioInfluence * 0.3);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
)

extend({ OrganicSwarmMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      organicSwarmMaterial: Partial<THREE.ShaderMaterial> & {
        ref?: React.RefObject<THREE.ShaderMaterial>
      } & OrganicSwarmMaterialUniforms
    }
  }
}

export { OrganicSwarmMaterial }
export default OrganicSwarmMaterial 