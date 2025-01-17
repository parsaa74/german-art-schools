import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { GlobeMaterial } from './shaders/GlobeMaterial'

export default function GlobeBase() {
  console.log('🌈 GlobeBase component rendering!')
  
  const materialRef = useRef<GlobeMaterial>(null)
  const sphereRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const outerGlowRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    console.log('🎨 Material ref:', materialRef.current)
    console.log('🌐 Sphere ref:', sphereRef.current)
  }, [])

  return (
    <group>
      {/* Main globe sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[5, 192, 192]} />
        <globeMaterial 
          ref={materialRef}
          attach="material"
          transparent
          side={THREE.DoubleSide}
          depthWrite={true}
        />
      </mesh>

      {/* Inner atmosphere layer */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[5.1, 96, 96]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.1}
          transmission={0.6}
          thickness={1}
          roughness={0.2}
          metalness={1}
          color="#4d0099"
          depthWrite={false}
        />
      </mesh>

      {/* Middle atmosphere layer */}
      <mesh>
        <sphereGeometry args={[5.15, 96, 96]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.05}
          transmission={0.7}
          thickness={0.5}
          roughness={0.1}
          metalness={1}
          color="#00ffcc"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[5.2, 64, 64]} />
        <meshBasicMaterial
          transparent
          opacity={0.03}
          color="#ff00aa"
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
} 