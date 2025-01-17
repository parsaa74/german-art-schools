import { useThree, useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { useGesture } from '@use-gesture/react'
import { Vector2, Vector3 } from 'three'

interface GestureState {
  cursor: Vector2
  forceField: Vector2
  cameraTarget: Vector3
}

export function useGestureControls() {
  const { camera, size } = useThree()
  const state = {
    cursor: new Vector2(),
    forceField: new Vector2(),
    cameraTarget: new Vector3()
  } as GestureState

  const [springs, api] = useSpring(() => ({
    cameraPosition: [0, 0, 5],
    config: { mass: 1, tension: 280, friction: 120 }
  }))

  const bind = useGesture({
    onMove: ({ xy: [x, y] }) => {
      // Update cursor position
      state.cursor.set(
        (x / size.width) * 2 - 1,
        -(y / size.height) * 2 + 1
      )

      // Create force field effect
      const force = 0.15
      state.forceField.set(
        Math.sin(x * 0.01) * force,
        Math.cos(y * 0.01) * force
      )

      // Smooth camera movement
      const targetX = state.cursor.x * 2
      const targetY = state.cursor.y * 2
      api.start({
        cameraPosition: [targetX, targetY, camera.position.z]
      })
    },
    onWheel: ({ delta: [, y] }) => {
      const newZ = Math.max(3, Math.min(8, camera.position.z + y * 0.01))
      api.start({
        cameraPosition: [camera.position.x, camera.position.y, newZ]
      })
    }
  })

  useFrame(() => {
    // Apply force field effect to scene elements
    // This will be used by other components
    state.forceField.multiplyScalar(0.95) // Decay effect
  })

  return {
    bind,
    springs,
    forceField: state.forceField,
    cursor: state.cursor
  }
} 