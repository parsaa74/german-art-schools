import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'

interface DynamicLightingProps {
  timeOfDay: number // 0-24 hours
}

export function DynamicLighting({ timeOfDay }: DynamicLightingProps) {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null)
  const hemisphereRef = useRef<THREE.HemisphereLight>(null)

  // Calculate light colors based on time of day
  const { sunColor, ambientColor, intensity, sunPosition } = useSpring({
    sunColor: getSunColor(timeOfDay),
    ambientColor: getAmbientColor(timeOfDay),
    intensity: getLightIntensity(timeOfDay),
    sunPosition: getSunPosition(timeOfDay),
    config: {
      mass: 1,
      tension: 120,
      friction: 14
    }
  })

  useFrame(() => {
    if (directionalLightRef.current) {
      // Update shadows based on sun position
      directionalLightRef.current.shadow.camera.updateProjectionMatrix()
    }
  })

  return (
    <>
      <animated.directionalLight
        ref={directionalLightRef}
        position={sunPosition}
        intensity={intensity}
        color={sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <animated.hemisphereLight
        ref={hemisphereRef}
        intensity={0.5}
        color={ambientColor}
        groundColor="#000000"
      />
      <animated.ambientLight intensity={0.2} color={ambientColor} />
    </>
  )
}

// Helper functions for calculating light properties based on time of day
function getSunColor(timeOfDay: number): string {
  if (timeOfDay < 6 || timeOfDay > 18) {
    return '#2C3E50' // Night - deep blue
  } else if (timeOfDay < 8 || timeOfDay > 16) {
    return '#E67E22' // Sunrise/Sunset - orange
  } else {
    return '#F1C40F' // Day - yellow
  }
}

function getAmbientColor(timeOfDay: number): string {
  if (timeOfDay < 6 || timeOfDay > 18) {
    return '#34495E' // Night - darker blue
  } else if (timeOfDay < 8 || timeOfDay > 16) {
    return '#D35400' // Sunrise/Sunset - darker orange
  } else {
    return '#F39C12' // Day - darker yellow
  }
}

function getLightIntensity(timeOfDay: number): number {
  if (timeOfDay < 6 || timeOfDay > 18) {
    return 0.2 // Night
  } else if (timeOfDay < 8 || timeOfDay > 16) {
    return 0.5 // Sunrise/Sunset
  } else {
    return 1.0 // Day
  }
}

function getSunPosition(timeOfDay: number): [number, number, number] {
  const angle = ((timeOfDay - 12) / 24) * Math.PI * 2
  const radius = 20
  const height = Math.sin(angle) * radius
  const xz = Math.cos(angle) * radius
  return [xz, height, xz]
} 