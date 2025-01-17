import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated, config } from '@react-spring/three'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

interface ViewTransitionProps {
  isTransitioning: boolean
  progress: number // 0 to 1
}

export function ViewTransition({ isTransitioning, progress }: ViewTransitionProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Transition animation spring
  const { opacity, scale } = useSpring({
    opacity: isTransitioning ? 1 : 0,
    scale: isTransitioning ? 1.2 : 0,
    config: config.molasses
  })

  // Custom shader for the transition particles
  const vertexShader = `
    uniform float uTime;
    uniform float uProgress;
    attribute float size;
    attribute vec3 destination;
    varying vec3 vColor;
    
    void main() {
      vec3 pos = position;
      float progressFactor = smoothstep(0.0, 1.0, uProgress);
      pos = mix(position, destination, progressFactor);
      
      // Add some movement
      pos.x += sin(uTime * 2.0 + position.z * 0.5) * 0.1;
      pos.y += cos(uTime * 2.0 + position.x * 0.5) * 0.1;
      pos.z += sin(uTime * 2.0 + position.y * 0.5) * 0.1;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = size * (1.0 / -mvPosition.z);
      
      // Color based on position
      vColor = normalize(pos) * 0.5 + 0.5;
    }
  `

  const fragmentShader = `
    varying vec3 vColor;
    
    void main() {
      float d = length(gl_PointCoord - vec2(0.5));
      if (d > 0.5) discard;
      
      // Smooth circle
      float alpha = smoothstep(0.5, 0.4, d);
      gl_FragColor = vec4(vColor, alpha);
    }
  `

  // Generate random particles
  const particleCount = 1000
  const positions = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)
  const destinations = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    // Initial positions in a sphere
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    const r = Math.random() * 2
    
    positions[i3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = r * Math.cos(phi)
    
    // Random destinations in a larger sphere
    const theta2 = Math.random() * Math.PI * 2
    const phi2 = Math.acos(Math.random() * 2 - 1)
    const r2 = 3 + Math.random() * 2
    
    destinations[i3] = r2 * Math.sin(phi2) * Math.cos(theta2)
    destinations[i3 + 1] = r2 * Math.sin(phi2) * Math.sin(theta2)
    destinations[i3 + 2] = r2 * Math.cos(phi2)
    
    // Random sizes
    sizes[i] = Math.random() * 2 + 1
  }

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uProgress.value = progress
    }
  })

  return (
    <>
      <animated.points ref={particlesRef} scale={scale}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleCount}
            array={sizes}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-destination"
            count={particleCount}
            array={destinations}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          uniforms={{
            uTime: { value: 0 },
            uProgress: { value: 0 }
          }}
        />
      </animated.points>
      
      <EffectComposer>
        <Bloom
          intensity={1.0}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          blendFunction={BlendFunction.ADD}
        />
      </EffectComposer>
    </>
  )
} 