import * as THREE from 'three'
import { extend } from '@react-three/fiber'

export class SwarmMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        time: { value: 0 },
        audioReactivity: { value: 0 },
        lowBand: { value: 0 },
        midBand: { value: 0 },
        highBand: { value: 0 },
        resolution: { value: new THREE.Vector2() },
        pointSize: { value: 2.0 }
      },
      vertexShader: `
        uniform float time;
        uniform float audioReactivity;
        uniform float lowBand;
        uniform float midBand;
        uniform float highBand;
        
        attribute vec3 velocity;
        attribute float phase;
        
        varying vec3 vPosition;
        varying float vPhase;
        
        void main() {
          vPhase = phase;
          
          // Calculate organic movement
          float t = time * 0.5;
          vec3 pos = position;
          
          // Add swarm behavior
          float noise = sin(phase * 6.28 + t) * cos(phase * 3.14 + t * 0.5);
          pos += velocity * (noise * 0.3 + audioReactivity * 0.2);
          
          // Add wave motion influenced by audio
          pos.x += sin(pos.z * 0.2 + t) * (0.1 + lowBand * 0.2);
          pos.y += cos(pos.x * 0.2 + t) * (0.1 + midBand * 0.2);
          pos.z += sin(pos.y * 0.2 + t) * (0.1 + highBand * 0.2);
          
          vPosition = pos;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Dynamic point size based on audio and distance
          float size = pointSize * (1.0 + audioReactivity * 0.5);
          gl_PointSize = size * (1.0 - length(mvPosition.xyz) * 0.1);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float audioReactivity;
        
        varying vec3 vPosition;
        varying float vPhase;
        
        void main() {
          // Calculate distance from center of point
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r = dot(cxy, cxy);
          
          // Soft particles
          float alpha = 1.0 - smoothstep(0.0, 1.0, r);
          
          // Dynamic color based on position and audio
          vec3 color = vec3(0.5) + 0.5 * cos(vPhase + time * 0.3 + vec3(0, 2, 4));
          color = mix(color, vec3(1.0), audioReactivity * 0.3);
          
          gl_FragColor = vec4(color, alpha * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }

  update(time: number, audioData: { 
    reactivity: number, 
    bands: { low: number; mid: number; high: number } 
  }) {
    this.uniforms.time.value = time
    this.uniforms.audioReactivity.value = audioData.reactivity
    this.uniforms.lowBand.value = audioData.bands.low
    this.uniforms.midBand.value = audioData.bands.mid
    this.uniforms.highBand.value = audioData.bands.high
  }

  setResolution(width: number, height: number) {
    this.uniforms.resolution.value.set(width, height)
  }
}

// Extend for use in React Three Fiber
extend({ SwarmMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      swarmMaterial: JSX.IntrinsicElements['shaderMaterial']
    }
  }
} 