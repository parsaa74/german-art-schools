'use client'

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { audioSystem } from '../audio/AudioSystem';
import { SwarmBackground } from './SwarmBackground';

// Custom shader for the nebula effect
const NebulaShader = {
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() },
    baseColor: { value: new THREE.Color('#050520') },
    accentColor: { value: new THREE.Color('#1a0040') },
    audioReactivity: { value: 0 },
    lowBand: { value: 0 },
    midBand: { value: 0 },
    highBand: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec2 resolution;
    uniform vec3 baseColor;
    uniform vec3 accentColor;
    uniform float audioReactivity;
    uniform float lowBand;
    uniform float midBand;
    uniform float highBand;
    varying vec2 vUv;

    float noise(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 0.0;
      for(int i = 0; i < 6; i++) {
        value += amplitude * noise(p);
        p *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 pos = vUv * 2.0 - 1.0;
      float dist = length(pos);
      
      // Audio-reactive distortion
      vec2 distortedPos = pos * (1.0 + audioReactivity * 0.2);
      
      vec2 q = vec2(0);
      q.x = fbm(distortedPos + 0.1 * time);
      q.y = fbm(distortedPos + vec2(1.0));
      
      vec2 r = vec2(0);
      r.x = fbm(distortedPos + 1.0 * q + vec2(1.7, 9.2) + 0.15 * time);
      r.y = fbm(distortedPos + 1.0 * q + vec2(8.3, 2.8) + 0.126 * time);
      
      float f = fbm(distortedPos + r);
      
      // Audio-reactive color mixing
      vec3 color = mix(baseColor, accentColor, f * f * (1.0 + lowBand));
      color = mix(color, accentColor * 1.5, midBand * 0.5);
      color = mix(color, vec3(1.0), highBand * 0.2);
      color = mix(color, vec3(0.0), smoothstep(0.0, 2.0, dist));
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
};

function GenerativeNebula() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const time = useRef(0);

  useFrame((state, delta) => {
    time.current += delta * 0.2;
    if (materialRef.current) {
      const bands = audioSystem.getFrequencyBands();
      const reactivity = audioSystem.getReactivity();
      
      materialRef.current.uniforms.time.value = time.current;
      materialRef.current.uniforms.audioReactivity.value = reactivity;
      materialRef.current.uniforms.lowBand.value = bands.low;
      materialRef.current.uniforms.midBand.value = bands.mid;
      materialRef.current.uniforms.highBand.value = bands.high;
    }
  });

  return (
    <mesh position={[0, 0, -50]}>
      <planeGeometry args={[100, 100]} />
      <shaderMaterial
        ref={materialRef}
        args={[NebulaShader]}
        transparent
      />
    </mesh>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const time = useRef(0);

  useFrame((state, delta) => {
    time.current += delta * 0.5;
    
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const sizes = particlesRef.current.geometry.attributes.size.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Organic movement
        positions[i] += Math.sin(time.current + i * 0.1) * 0.01;
        positions[i + 1] += Math.cos(time.current + i * 0.1) * 0.01;
        positions[i + 2] += Math.sin(time.current * 0.5 + i * 0.1) * 0.01;
        
        // Audio-reactive sizes
        const index = Math.floor(i / 3);
        const audioIntensity = audioSystem.getAudioIntensity();
        sizes[index] = 0.1 + audioIntensity * 0.2 * Math.sin(time.current + index);
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.geometry.attributes.size.needsUpdate = true;
    }
  });

  // Create particle system
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    sizes[i] = 0.1;
    
    // Color gradient from deep purple to blue
    colors[i * 3] = 0.2 + Math.random() * 0.2;     // R
    colors[i * 3 + 1] = 0.1 + Math.random() * 0.2; // G
    colors[i * 3 + 2] = 0.5 + Math.random() * 0.5; // B
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return (
    <points ref={particlesRef}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        size={1}
        sizeAttenuation={true}
        transparent
        opacity={0.6}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function VolumetricLight() {
  const lightRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state, delta) => {
    time.current += delta * 0.5;
    if (lightRef.current) {
      // More organic movement
      lightRef.current.rotation.z = Math.sin(time.current * 0.2) * 0.15 + Math.cos(time.current * 0.1) * 0.1;
      lightRef.current.position.y = Math.sin(time.current * 0.3) * 3;
      lightRef.current.position.x = Math.cos(time.current * 0.2) * 2;
      
      // Dynamic scale based on audio
      const intensity = audioSystem.getAudioIntensity();
      const scale = 1 + intensity * 0.2;
      lightRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <mesh ref={lightRef} position={[0, 0, -20]} rotation={[0, 0, Math.PI * 0.25]}>
      <coneGeometry args={[25, 50, 128, 1, true]} />
      <meshBasicMaterial
        color="#090418"
        transparent
        opacity={0.15}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function Background() {
  return (
    <group>
      <FloatingParticles />
      <VolumetricLight />
      
      <fog attach="fog" args={['#000005', 35, 100]} />
      <ambientLight intensity={0.15} />
      <pointLight position={[10, 10, 10]} intensity={0.3} color="#4400ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#000066" />
      <pointLight position={[0, 0, -20]} intensity={0.1} color="#ff00ff" />
    </group>
  );
} 