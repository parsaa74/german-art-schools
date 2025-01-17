import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { Environment, PerspectiveCamera, useGLTF, Billboard } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'
import { DynamicLighting } from './DynamicLighting'
import { ViewTransition } from './ViewTransition'
import GeometricText from '../map/GeometricText'

interface BuildingProps {
  modelPath: string
  position?: [number, number, number]
  timeOfDay: number
  onHover: (text: string | null, x: number, y: number) => void
}

interface BuildingDetails {
  name: string
  description: string
  features: string[]
}

const buildingDetails: BuildingDetails = {
  name: "Modern Architectural Showcase",
  description: "Interactive 3D Building Experience",
  features: [
    "Dynamic Lighting",
    "Interactive Views",
    "Geometric Design",
    "Real-time Shadows"
  ]
}

function Building({ modelPath, position = [0, 0, 0], timeOfDay, onHover }: BuildingProps) {
  const { scene } = useGLTF(modelPath)
  const meshRef = useRef<THREE.Group>(null)
  const { camera, size } = useThree()
  const [isHovered, setIsHovered] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState(0)
  
  // Rotate through features
  useEffect(() => {
    if (isHovered) {
      const interval = setInterval(() => {
        setSelectedFeature((prev) => (prev + 1) % buildingDetails.features.length)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isHovered])
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    }
  })

  // Handle hover interactions
  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsHovered(true)
    // Convert 3D position to screen coordinates
    const vector = new THREE.Vector3()
    vector.setFromMatrixPosition(event.object.matrixWorld)
    vector.project(camera)
    
    const x = (vector.x * 0.5 + 0.5) * size.width
    const y = (-(vector.y * 0.5) + 0.5) * size.height
    
    onHover(buildingDetails.name, x, y)
  }

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsHovered(false)
    onHover(null, 0, 0)
  }

  return (
    <group>
      <primitive
        ref={meshRef}
        object={scene}
        position={position}
        scale={[0.5, 0.5, 0.5]}
        castShadow
        receiveShadow
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
      
      {/* Enhanced text labels with Tim's style */}
      {isHovered && (
        <Billboard
          follow={true}
          position={[position[0], position[1] + 2, position[2]]}
        >
          {/* Main title with larger size and electric gradient */}
          <GeometricText
            fontSize={0.3}
            color="#4D1BFF"
            anchorX="center"
            anchorY="bottom"
            isHovered={isHovered}
            position={[0, 0.2, 0]}
          >
            {buildingDetails.name}
          </GeometricText>

          {/* Description with medium size and hot pink accent */}
          <GeometricText
            position={[0, -0.2, 0]}
            fontSize={0.2}
            color="#FF3366"
            anchorX="center"
            anchorY="middle"
            isHovered={isHovered}
          >
            {buildingDetails.description}
          </GeometricText>

          {/* Features with cyberpunk cyan */}
          <GeometricText
            position={[0, -0.6, 0]}
            fontSize={0.15}
            color="#00F5FF"
            anchorX="center"
            anchorY="top"
            isHovered={isHovered}
          >
            {buildingDetails.features[selectedFeature]}
          </GeometricText>
        </Billboard>
      )}

      {/* Add a subtle glow effect behind the text */}
      {isHovered && (
        <Billboard
          follow={true}
          position={[position[0], position[1] + 2, position[2] - 0.1]}
        >
          <mesh>
            <planeGeometry args={[4, 2]} />
            <meshBasicMaterial
              color="#4D1BFF"
              transparent
              opacity={0.1}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </Billboard>
      )}
    </group>
  )
}

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
      const targetPosition = new THREE.Vector3(...viewPositions[currentView].target)
      targetRef.current.lerp(targetPosition, delta * 2)
      cameraRef.current.lookAt(targetRef.current)
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

export function BuildingShowcase() {
  const [currentView, setCurrentView] = useState('exterior')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)
  const [timeOfDay, setTimeOfDay] = useState(12)
  const [tooltip, setTooltip] = useState<{ text: string | null; x: number; y: number }>({
    text: null,
    x: 0,
    y: 0
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay((prev) => (prev + 0.1) % 24)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleViewChange = (newView: string) => {
    if (newView === currentView) return
    
    setIsTransitioning(true)
    setTransitionProgress(0)
    
    let progress = 0
    const animate = () => {
      progress += 0.02
      setTransitionProgress(progress)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsTransitioning(false)
        setCurrentView(newView)
      }
    }
    
    requestAnimationFrame(animate)
  }

  const handleHover = (text: string | null, x: number, y: number) => {
    setTooltip({ text, x, y })
  }

  return (
    <div className="w-full h-screen relative">
      <Canvas shadows>
        <AnimatedCamera
          currentView={currentView}
          isTransitioning={isTransitioning}
        />
        
        <DynamicLighting timeOfDay={timeOfDay} />
        
        <Building
          modelPath="/models/building.glb"
          timeOfDay={timeOfDay}
          onHover={handleHover}
        />
        
        <ViewTransition
          isTransitioning={isTransitioning}
          progress={transitionProgress}
        />
        
        <Environment preset="city" />
      </Canvas>
      
      {/* Tooltip */}
      {tooltip.text && (
        <div
          className="absolute pointer-events-none bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltip.x,
            top: tooltip.y - 10,
            zIndex: 1000
          }}
        >
          {tooltip.text}
        </div>
      )}
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        {Object.keys(viewPositions).map((view) => (
          <button
            key={view}
            onClick={() => handleViewChange(view)}
            className={`px-4 py-2 rounded-lg ${
              currentView === view
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            } transition-colors duration-200`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="absolute top-4 right-4 text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg">
        {Math.floor(timeOfDay)}:00
      </div>
    </div>
  )
} 