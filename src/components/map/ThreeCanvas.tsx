import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { ThreeJSErrorBoundary } from '../error/ThreeJSErrorBoundary'

interface ThreeCanvasProps {
  children: React.ReactNode
  className?: string
}

export function ThreeCanvas({ children, className }: ThreeCanvasProps) {
  return (
    <div className={className}>
      <ThreeJSErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          dpr={[1, 2]}
          style={{ 
            width: '100%', 
            height: '100%',
            background: 'transparent',
            touchAction: 'none'
          }}
        >
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </Canvas>
      </ThreeJSErrorBoundary>
    </div>
  )
} 