import { FontLoader, Font } from 'three-stdlib'
import { TextGeometry } from 'three-stdlib'
import { extend } from '@react-three/fiber'

// Extend React Three Fiber with TextGeometry
extend({ TextGeometry })

/**
 * Load a font for use with React Three Fiber/drei
 * @param url URL to the font JSON file
 * @returns Promise that resolves to the loaded font
 */
export function loadFont(url: string): Promise<Font> {
  return new Promise((resolve, reject) => {
    const loader = new FontLoader()
    
    loader.load(
      url,
      (font: Font) => resolve(font),
      undefined,
      (err: ErrorEvent) => {
        console.error('Font loading error:', err);
        reject(err);
      }
    )
  })
}

/**
 * Get the correct font path for use in the application
 * This ensures fonts are loaded from the correct location regardless of environment
 * @param fontName Name of the font file
 * @returns Absolute path to the font
 */
export function getFontPath(fontName: string): string {
  // Ensure path starts with /
  const normalizedName = fontName.startsWith('/') ? fontName : `/${fontName}`
  
  // In production, fonts should be in the /public directory
  return normalizedName
}

/**
 * Standard font paths used in the application
 * Use these constants to ensure consistent font usage across components
 */
export const FONTS = {
  // Text2D fonts (WOFF2 format for better compression and browser support)
  INTER_REGULAR: '/fonts/inter/Inter-Regular.woff2',
  INTER_ITALIC: '/fonts/inter/Inter-Italic.woff2',
  INTER_VARIABLE: '/fonts/inter/InterVariable.woff2',
  
  // Text3D fonts (JSON format)
  INTER_JSON: '/fonts/inter.json',
  INTER_VARIABLE_JSON: '/fonts/Inter-VariableFont_opsz,wght.json',
}

/**
 * Default text configuration for consistent styling
 * Can be imported and used by any component that needs text styling
 */
export const DEFAULT_TEXT_CONFIG = {
  font: FONTS.INTER_REGULAR,
  fontSize: 0.14,
  maxWidth: 2,
  lineHeight: 1.2,
  letterSpacing: 0.02,
  textAlign: 'center' as const,
  sdfGlyphSize: 64, // High quality text
  anchorX: 'center' as const,
  anchorY: 'middle' as const,
} 