import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Physics, useRapier } from '@react-three/rapier'
import { AudioSystem } from '../audio/AudioSystem'
import { OrganicSwarmMaterialUniforms } from './shaders/OrganicSwarmMaterial'
import './shaders/OrganicSwarmMaterial'

interface SwarmBackgroundProps {
  audioSystem: AudioSystem
  position?: [number, number, number]
  scale?: number
}

const PARTICLE_COUNT = 5000
const SWARM_RADIUS = 8
const COHESION_STRENGTH = 0.015
const SEPARATION_STRENGTH = 0.025
const ALIGNMENT_STRENGTH = 0.02

// Add WebGL context event types
interface WebGLContextEvent extends Event {
  statusMessage?: string;
}

function calculateSwarmBehavior(
  positions: Float32Array,
  velocities: Float32Array,
  index: number,
  neighborhoodRadius: number
): [number, number, number] {
  const centerOfMass = [0, 0, 0]
  const averageVelocity = [0, 0, 0]
  const separation = [0, 0, 0]
  let neighbors = 0

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i === index) continue

    const dx = positions[i * 3] - positions[index * 3]
    const dy = positions[i * 3 + 1] - positions[index * 3 + 1]
    const dz = positions[i * 3 + 2] - positions[index * 3 + 2]
    const distSq = dx * dx + dy * dy + dz * dz

    if (distSq < neighborhoodRadius * neighborhoodRadius) {
      // Cohesion
      centerOfMass[0] += positions[i * 3]
      centerOfMass[1] += positions[i * 3 + 1]
      centerOfMass[2] += positions[i * 3 + 2]

      // Alignment
      averageVelocity[0] += velocities[i * 3]
      averageVelocity[1] += velocities[i * 3 + 1]
      averageVelocity[2] += velocities[i * 3 + 2]

      // Separation
      const dist = Math.sqrt(distSq)
      if (dist > 0) {
        const repulsion = 1 / dist
        separation[0] += (dx / dist) * repulsion
        separation[1] += (dy / dist) * repulsion
        separation[2] += (dz / dist) * repulsion
      }

      neighbors++
    }
  }

  if (neighbors > 0) {
    centerOfMass[0] /= neighbors
    centerOfMass[1] /= neighbors
    centerOfMass[2] /= neighbors

    averageVelocity[0] /= neighbors
    averageVelocity[1] /= neighbors
    averageVelocity[2] /= neighbors
  }

  return [
    (centerOfMass[0] - positions[index * 3]) * COHESION_STRENGTH +
      averageVelocity[0] * ALIGNMENT_STRENGTH +
      separation[0] * SEPARATION_STRENGTH,
    (centerOfMass[1] - positions[index * 3 + 1]) * COHESION_STRENGTH +
      averageVelocity[1] * ALIGNMENT_STRENGTH +
      separation[1] * SEPARATION_STRENGTH,
    (centerOfMass[2] - positions[index * 3 + 2]) * COHESION_STRENGTH +
      averageVelocity[2] * ALIGNMENT_STRENGTH +
      separation[2] * SEPARATION_STRENGTH
  ]
}

export function SwarmBackground({ 
  audioSystem, 
  position = [0, 0, -48],
  scale = 10 
}: SwarmBackgroundProps) {
  const meshRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial & { uniforms: OrganicSwarmMaterialUniforms }>(null)
  const positionsRef = useRef<Float32Array>()
  const velocitiesRef = useRef<Float32Array>()
  const geometryRef = useRef<THREE.BufferGeometry>()
  const { gl, size } = useThree()

  // Handle WebGL context loss
  useEffect(() => {
    const handleContextLost = (event: Event) => {
      event.preventDefault()
      console.log('WebGL context lost. Attempting to restore...')
    }

    const handleContextRestored = () => {
      console.log('WebGL context restored')
      if (geometryRef.current) {
        geometryRef.current.dispose()
        initializeParticles()
      }
    }

    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', handleContextLost as EventListener)
    canvas.addEventListener('webglcontextrestored', handleContextRestored)

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost as EventListener)
      canvas.removeEventListener('webglcontextrestored', handleContextRestored)
    }
  }, [gl])

  // Initialize particles with improved performance
  const initializeParticles = () => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const phases = new Float32Array(PARTICLE_COUNT)
    const sizes = new Float32Array(PARTICLE_COUNT)

    // Pre-calculate values for better performance
    const TWO_PI = Math.PI * 2
    const PHI_SCALE = Math.PI
    const R_MIN = SWARM_RADIUS * 0.2
    const R_RANGE = SWARM_RADIUS * 0.8
    const VEL_SCALE = 0.02

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * TWO_PI
      const phi = Math.acos(2 * Math.random() - 1)
      const r = R_MIN + Math.random() * R_RANGE

      const sinPhi = Math.sin(phi)
      positions[i * 3] = sinPhi * Math.cos(theta) * r
      positions[i * 3 + 1] = sinPhi * Math.sin(theta) * r
      positions[i * 3 + 2] = Math.cos(phi) * r

      velocities[i * 3] = (Math.random() - 0.5) * VEL_SCALE
      velocities[i * 3 + 1] = (Math.random() - 0.5) * VEL_SCALE
      velocities[i * 3 + 2] = (Math.random() - 0.5) * VEL_SCALE

      phases[i] = Math.random() * TWO_PI
      sizes[i] = (Math.random() * 0.5 + 0.5) * 2
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    positionsRef.current = positions
    velocitiesRef.current = velocities
    geometryRef.current = geometry

    return geometry
  }

  // Generate particles with improved initialization
  const particles = useMemo(() => initializeParticles(), [])

  useFrame((state) => {
    if (!materialRef.current?.uniforms || !positionsRef.current || !velocitiesRef.current || !geometryRef.current) return

    const positions = positionsRef.current
    const velocities = velocitiesRef.current
    const reactivity = audioSystem.getReactivity()
    const bands = audioSystem.getFrequencyBands()
    
    // Audio-reactive parameters
    const neighborhoodRadius = 1 + reactivity * 3
    const swarmRadius = SWARM_RADIUS * (1 + bands.low * 0.5)
    const speedMultiplier = 1 + bands.high * 2
    
    // Update particle positions and velocities
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Calculate flocking behavior with audio-reactive strengths
      const [ax, ay, az] = calculateSwarmBehavior(positions, velocities, i, neighborhoodRadius)

      // Add some noise-based movement
      const time = state.clock.elapsedTime
      const noiseScale = 0.5
      const px = positions[i * 3]
      const py = positions[i * 3 + 1]
      const pz = positions[i * 3 + 2]
      
      const noise = new THREE.Vector3(
        Math.sin(time * 0.5 + px * noiseScale) * 0.001,
        Math.cos(time * 0.4 + py * noiseScale) * 0.001,
        Math.sin(time * 0.3 + pz * noiseScale) * 0.001
      )

      // Update velocities with flocking forces and noise
      velocities[i * 3] += (ax + noise.x) * speedMultiplier
      velocities[i * 3 + 1] += (ay + noise.y) * speedMultiplier
      velocities[i * 3 + 2] += (az + noise.z) * speedMultiplier

      // Apply velocity damping
      const damping = 0.98 + bands.mid * 0.01
      velocities[i * 3] *= damping
      velocities[i * 3 + 1] *= damping
      velocities[i * 3 + 2] *= damping

      // Update positions
      positions[i * 3] += velocities[i * 3]
      positions[i * 3 + 1] += velocities[i * 3 + 1]
      positions[i * 3 + 2] += velocities[i * 3 + 2]

      // Contain within bounds with audio-reactive radius
      const pos = new THREE.Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
      if (pos.length() > swarmRadius) {
        pos.normalize().multiplyScalar(swarmRadius)
        positions[i * 3] = pos.x
        positions[i * 3 + 1] = pos.y
        positions[i * 3 + 2] = pos.z
      }
    }

    // Update geometry attributes
    geometryRef.current.attributes.position.needsUpdate = true

    // Update material uniforms directly
    const uniforms = materialRef.current.uniforms
    uniforms.time.value = state.clock.elapsedTime
    uniforms.audioReactivity.value = reactivity
    uniforms.lowBand.value = bands.low
    uniforms.midBand.value = bands.mid
    uniforms.highBand.value = bands.high
    uniforms.mousePosition.value.set(0, 0) // We'll add mouse interaction later
    uniforms.resolution.value.set(size.width, size.height)
  })

  // Add cleanup
  useEffect(() => {
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose()
      }
      if (materialRef.current) {
        Object.values(materialRef.current.uniforms).forEach(uniform => {
          if (uniform.value?.dispose) {
            uniform.value.dispose()
          }
        })
      }
    }
  }, [])

  // Only render on client side
  if (typeof window === 'undefined') return null

  return (
    <points ref={meshRef} position={position} scale={scale}>
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
        resolution={{ value: new THREE.Vector2(size.width, size.height) }}
        baseColor={{ value: new THREE.Color('#4D1BFF') }}
        accentColor={{ value: new THREE.Color('#FF3366') }}
        pointSize={{ value: 2.0 }}
        interactionRadius={{ value: 0.3 }}
        interactionStrength={{ value: 0.2 }}
      />
    </points>
  )
} 