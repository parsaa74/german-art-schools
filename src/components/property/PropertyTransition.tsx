import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import { Environment, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

interface ViewPosition {
  position: [number, number, number]
  rotation: [number, number, number]
  target: [number, number, number]
}

const viewPositions: Record<string, ViewPosition> = {
  exterior: {
    position: [10, 5, 10],
    rotation: [0, Math.PI / 4, 0],
    target: [0, 0, 0]
  },
  interior: {
    position: [2, 1.6, 2],
    rotation: [0, Math.PI / 2, 0],
    target: [0, 1.6, 0]
  },
  aerial: {
    position: [0, 15, 0],
    rotation: [-Math.PI / 2, 0, 0],
    target: [0, 0, 0]
  }
}

function AnimatedCamera({ currentView, isTransitioning }: { currentView: string; isTransitioning: boolean }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3())
  
  const { position, rotationX, rotationY, rotationZ } = useSpring({
    position: viewPositions[currentView].position,
    rotationX: viewPositions[currentView].rotation[0],
    rotationY: viewPositions[currentView].rotation[1],
    rotationZ: viewPositions[currentView].rotation[2],
    config: {
      mass: 1,
      tension: 280,
      friction: 120
    }
  })

  useFrame((state, delta) => {
    if (cameraRef.current) {
      // Smooth camera movement
      const targetPosition = new THREE.Vector3(...viewPositions[currentView].target)
      targetRef.current.lerp(targetPosition, delta * 2)
      cameraRef.current.lookAt(targetRef.current)
      
      // Add subtle floating motion when not transitioning
      if (!isTransitioning) {
        const time = state.clock.getElapsedTime()
        cameraRef.current.position.y += Math.sin(time) * 0.001
      }
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault />
      <animated.group
        position={position}
        rotation={[rotationX, rotationY, rotationZ]}
      >
        <PerspectiveCamera
          ref={cameraRef}
          fov={45}
          near={0.1}
          far={1000}
        />
      </animated.group>
    </>
  )
}

interface TransitionOverlayProps {
  isTransitioning: boolean
}

function TransitionOverlay({ isTransitioning }: TransitionOverlayProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const { opacity } = useSpring({
    opacity: isTransitioning ? 1 : 0,
    config: { duration: 1000 }
  })

  return (
    <animated.mesh
      ref={meshRef}
      position={[0, 0, -1]}
    >
      <planeGeometry args={[2, 2]} />
      <animated.meshBasicMaterial
        transparent
        opacity={opacity}
        color="#000000"
      />
    </animated.mesh>
  )
}

export function PropertyTransition() {
  const [currentView, setCurrentView] = useState('exterior')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleViewChange = (newView: string) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentView(newView)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 1000)
    }, 500)
  }

  return (
    <div className="w-full h-screen relative">
      <Canvas>
        <AnimatedCamera
          currentView={currentView}
          isTransitioning={isTransitioning}
        />
        <Environment preset="sunset" />
        
        {/* Property Model would go here */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        
        <TransitionOverlay isTransitioning={isTransitioning} />
      </Canvas>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        {Object.keys(viewPositions).map((view) => (
          <button
            key={view}
            onClick={() => handleViewChange(view)}
            className={`px-4 py-2 rounded-lg ${
              currentView === view
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
} 