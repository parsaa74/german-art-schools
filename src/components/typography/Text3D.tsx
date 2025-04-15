import { Text3D as DreiText3D, Center } from '@react-three/drei'
import { useEffect, useState } from 'react'
import InterRegular from '@pmndrs/assets/fonts/inter_regular.json'
import { FONTS } from '@/utils/fonts'

interface Text3DProps {
  children: string
  fontSize?: number
  height?: number
  color?: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  centered?: boolean
  bevelEnabled?: boolean
  bevelSize?: number
  bevelThickness?: number
  letterSpacing?: number
  lineHeight?: number
  onLoaded?: () => void
  materialProps?: Record<string, any>
}

/**
 * Professional 3D Text component using React Three Fiber and Drei
 * 
 * Uses drei's Text3D component which requires fonts in JSON format
 * Place fonts in /public/fonts/ directory
 * 
 * @example
 * ```tsx
 * <Text3D color="white">
 *   Hello World
 * </Text3D>
 * ```
 */
export function Text3D({
  children,
  fontSize = 1,
  height = 0.2,
  color = 'white',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  centered = true,
  bevelEnabled = false,
  bevelSize = 0.04,
  bevelThickness = 0.1,
  letterSpacing = 0,
  lineHeight = 0.5,
  onLoaded,
  materialProps = {}
}: Text3DProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Notify when font is loaded
  useEffect(() => {
    setIsLoaded(true);
    if (onLoaded) {
      onLoaded()
    }
  }, [onLoaded])
  
  // Set up text options
  const textOptions = {
    fontSize,
    height,
    bevelEnabled,
    bevelSize,
    bevelThickness,
    letterSpacing,
    lineHeight
  }
  
  // Handle the rendering
  const renderText = () => (
    <DreiText3D
      font={InterRegular as any}
      {...textOptions}
    >
      {children}
      <meshStandardMaterial 
        color={color} 
        {...materialProps}
      />
    </DreiText3D>
  )
  
  return (
    <group position={position} rotation={rotation}>
      {centered ? (
        <Center>
          {renderText()}
        </Center>
      ) : (
        renderText()
      )}
    </group>
  )
} 