import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioData } from '../../hooks/useAudioData'
import { useMouse } from '../../hooks/useMouse'
import { OrganicSwarmMaterialUniforms } from './shaders/OrganicSwarmMaterial'
import './shaders/OrganicSwarmMaterial'

const PARTICLE_COUNT = 2000 // Adjust based on device performance
const BOUNDS = 5.0

interface OrganicSwarmProps {
  color?: string
  accentColor?: string
  scale?: number
  intensity?: number
  audioReactivity?: number
}

export function OrganicSwarm({
  color = '#4D1BFF',
  accentColor = '#FF3366',
  scale = 1,
  intensity = 1,
  audioReactivity = 1
}: OrganicSwarmProps) {
  const meshRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size, viewport } = useThree()
  const { audioData } = useAudioData()
  const mouse = useMouse()

  // Generate particles with optimized attributes
  const particles = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const phases = new Float32Array(PARTICLE_COUNT)
    const sizes = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Position
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const radius = Math.random() * BOUNDS

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      // Velocity (normalized direction for organic movement)
      const vTheta = Math.random() * Math.PI * 2
      const vPhi = Math.acos(Math.random() * 2 - 1)
      velocities[i * 3] = Math.sin(vPhi) * Math.cos(vTheta)
      velocities[i * 3 + 1] = Math.sin(vPhi) * Math.sin(vTheta)
      velocities[i * 3 + 2] = Math.cos(vPhi)

      // Phase (for varied animation timing)
      phases[i] = Math.random() * Math.PI * 2

      // Size (varied for depth perception)
      sizes[i] = (Math.random() * 0.5 + 0.5) * 2
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    return geometry
  }, [])

  // Update material uniforms
  useFrame((state) => {
    if (!materialRef.current) return

    const uniforms = materialRef.current.uniforms
    uniforms.time.value = state.clock.elapsedTime
    uniforms.audioReactivity.value = audioData.reactivity * audioReactivity
    uniforms.lowBand.value = audioData.bands.low
    uniforms.midBand.value = audioData.bands.mid
    uniforms.highBand.value = audioData.bands.high
    uniforms.mousePosition.value.set(mouse.x, mouse.y)
    uniforms.resolution.value.set(size.width, size.height)
  })

  // Handle resize
  useEffect(() => {
    if (!materialRef.current) return
    materialRef.current.uniforms.resolution.value.set(size.width, size.height)
  }, [size])

  return (
    <points ref={meshRef} scale={scale}>
      <primitive object={particles} attach="geometry" />
      <organicSwarmMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        time={{ value: 0 }}
        audioReactivity={{ value: 0 }}
        lowBand={{ value: 0 }}
        midBand={{ value: 0 }}
        highBand={{ value: 0 }}
        mousePosition={{ value: new THREE.Vector2() }}
        resolution={{ value: new THREE.Vector2() }}
        baseColor={{ value: new THREE.Color(color) }}
        accentColor={{ value: new THREE.Color(accentColor) }}
        pointSize={{ value: 2.0 }}
        interactionRadius={{ value: 0.3 }}
        interactionStrength={{ value: 0.2 * intensity }}
      />
    </points>
  )
} 