/**
 * Utility function to get the correct asset path based on environment
 * @param path Path without leading slash
 * @returns Full path with correct prefix
 */
export function getAssetPath(path: string): string {
  const basePath = process.env.NODE_ENV === 'development' ? '' : '/german-art-schools';
  
  // Ensure path starts with / but doesn't have duplicate slashes
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${basePath}${normalizedPath}`;
}

/**
 * Special utility for font paths - always use the root path
 * This is to avoid locale redirection issues with fonts
 * @param fontName Name of the font file
 * @returns Absolute path to the font from root
 */
export function getFontPath(fontName: string): string {
  // Always use absolute path from root for fonts
  return `/${fontName}`;
} 