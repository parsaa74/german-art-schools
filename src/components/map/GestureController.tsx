import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useGestureControls } from '../../hooks/useGestureControls'
import * as THREE from 'three'
import { GroupProps } from '@react-three/fiber'

interface ForceFieldParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
}

export function GestureController() {
  const { camera, size } = useThree()
  const { bind, springs, forceField, cursor } = useGestureControls()
  const particlesRef = useRef<THREE.Points>(null)
  const particleSystem = useRef<ForceFieldParticle[]>([])
  
  // Initialize force field particles
  useEffect(() => {
    const particles: ForceFieldParticle[] = []
    for (let i = 0; i < 100; i++) {
      particles.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ),
        velocity: new THREE.Vector3(),
        life: Math.random()
      })
    }
    particleSystem.current = particles
  }, [])

  // Update force field particles
  useFrame((state, delta) => {
    if (!particlesRef.current) return

    const positions = particlesRef.current.geometry.attributes.position
    const sizes = particlesRef.current.geometry.attributes.size

    particleSystem.current.forEach((particle, i) => {
      // Apply force field effect
      const distance = particle.position.distanceTo(new THREE.Vector3(cursor.x * 5, cursor.y * 5, 0))
      if (distance < 2) {
        const force = (1 - distance / 2) * 0.1
        particle.velocity.add(
          new THREE.Vector3(
            forceField.x * force,
            forceField.y * force,
            0
          )
        )
      }

      // Update particle position
      particle.position.add(particle.velocity)
      particle.velocity.multiplyScalar(0.95) // Apply friction

      // Update life and reset if needed
      particle.life -= delta * 0.2
      if (particle.life < 0) {
        particle.life = 1
        particle.position.set(
          cursor.x * 5 + (Math.random() - 0.5) * 2,
          cursor.y * 5 + (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        )
        particle.velocity.set(0, 0, 0)
      }

      // Update geometry
      positions.setXYZ(i, particle.position.x, particle.position.y, particle.position.z)
      sizes.setX(i, 0.1 * (1 - particle.life))
    })

    positions.needsUpdate = true
    sizes.needsUpdate = true
  })

  // Create particle geometry
  const particleGeometry = new THREE.BufferGeometry()
  const positions = new Float32Array(100 * 3)
  const sizes = new Float32Array(100)
  
  for (let i = 0; i < 100; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    sizes[i] = 0.1
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const groupProps = bind() as unknown as GroupProps

  return (
    <group {...groupProps}>
      <points ref={particlesRef} frustumCulled={false}>
        <primitive object={particleGeometry} attach="geometry" />
        <pointsMaterial
          size={0.1}
          sizeAttenuation={true}
          transparent
          opacity={0.6}
          color="#88ccff"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
} 