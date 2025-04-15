import { Text } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { FONTS } from '@/utils/fonts'

interface Text2DProps {
  children: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  color?: string
  fontSize?: number
  font?: string
  maxWidth?: number
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'right' | 'center' | 'justify'
  anchorX?: 'left' | 'center' | 'right'
  anchorY?: 'top' | 'top-baseline' | 'middle' | 'bottom-baseline' | 'bottom'
  onLoaded?: () => void
  materialProps?: Record<string, any>
}

/**
 * Professional 2D Text component using React Three Fiber and Drei
 * 
 * Uses drei's Text component which always faces the camera
 * Place fonts in /public/fonts/ directory (TTF format for best compatibility)
 * 
 * @example
 * ```tsx
 * <Text2D font="/fonts/inter-regular.ttf" color="white">
 *   Hello World
 * </Text2D>
 * ```
 */
export function Text2D({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = 'white',
  fontSize = 1,
  font = FONTS.INTER_REGULAR,
  maxWidth = 10,
  lineHeight = 1,
  letterSpacing = 0,
  textAlign = 'left',
  anchorX = 'center',
  anchorY = 'middle',
  onLoaded,
  materialProps = {}
}: Text2DProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Notify when font is loaded
  useEffect(() => {
    if (isLoaded && onLoaded) {
      onLoaded()
    }
  }, [isLoaded, onLoaded])
  
  return (
    <Text
      position={position}
      rotation={rotation}
      color={color}
      fontSize={fontSize}
      font={font}
      maxWidth={maxWidth}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      textAlign={textAlign}
      anchorX={anchorX}
      anchorY={anchorY}
      onSync={() => setIsLoaded(true)}
      material-toneMapped={false}
      {...materialProps}
    >
      {children}
    </Text>
  )
} 