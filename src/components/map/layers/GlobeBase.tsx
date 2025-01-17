import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { GlobeMaterial } from '../shaders/GlobeMaterial';
import * as THREE from 'three';

console.log('🌍 Loading GlobeBase component')

export default function GlobeBase() {
  console.log('🎨 Rendering GlobeBase')
  
  const materialRef = useRef<GlobeMaterial>(null)
  const sphereRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (materialRef.current) {
      try {
        materialRef.current.uniforms.time.value = state.clock.elapsedTime
      } catch (error) {
        console.error('Error updating material:', error)
      }
    }
  })

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[5, 64, 64]} />
      <globeMaterial ref={materialRef} />
    </mesh>
  )
} 