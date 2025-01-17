import { useRef, useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useGestureControls } from '../../hooks/useGestureControls'

const PARTICLE_COUNT = 50
const FORCE_RADIUS = 2

export function ForceFieldCursor() {
  const instancesRef = useRef<any>()
  const { cursor, forceField } = useGestureControls()
  
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      position: new Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        0
      ),
      scale: Math.random() * 0.2 + 0.1,
      velocity: new Vector3()
    }))
  }, [])

  useFrame((state, delta) => {
    particles.forEach((particle, i) => {
      // Apply force field effect
      const distance = particle.position.distanceTo(new Vector3(cursor.x, cursor.y, 0))
      if (distance < FORCE_RADIUS) {
        const force = (1 - distance / FORCE_RADIUS) * 0.1
        particle.velocity.x += (forceField.x + (Math.random() - 0.5) * 0.1) * force
        particle.velocity.y += (forceField.y + (Math.random() - 0.5) * 0.1) * force
      }

      // Update position
      particle.position.add(particle.velocity)
      particle.velocity.multiplyScalar(0.95) // Friction

      // Keep particles within bounds
      if (Math.abs(particle.position.x) > 2) particle.position.x *= -0.9
      if (Math.abs(particle.position.y) > 2) particle.position.y *= -0.9

      // Update instance
      const instance = instancesRef.current?.children[i]
      if (instance) {
        instance.position.copy(particle.position)
        instance.scale.setScalar(particle.scale * (1 + Math.sin(state.clock.elapsedTime * 2) * 0.2))
      }
    })
  })

  return (
    <Instances limit={PARTICLE_COUNT}>
      <circleGeometry args={[0.05, 32]} />
      <meshBasicMaterial transparent opacity={0.6} color="#88ccff" />
      
      {particles.map((particle, i) => (
        <Instance
          key={i}
          position={particle.position}
          scale={particle.scale}
        />
      ))}
    </Instances>
  )
} 