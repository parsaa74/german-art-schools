import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

/**
 * Load a font for use with React Three Fiber/drei
 * @param url URL to the font JSON file
 * @returns Promise that resolves to the loaded font
 */
export function loadFont(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const loader = new FontLoader();
    loader.load(
      url,
      font => resolve(font),
      undefined,
      error => reject(error)
    );
  });
}

// Single cache for loaded fonts
const fontCache: Record<string, any> = {};

/**
 * Load a font with caching to prevent duplicate loading
 * @param url URL to the font JSON file
 * @returns Promise resolving to the loaded font
 */
export async function loadFontWithCache(url: string): Promise<any> {
  // Return from cache if available
  if (fontCache[url]) {
    return fontCache[url];
  }
  
  // Load font and store in cache
  try {
    const font = await loadFont(url);
    fontCache[url] = font;
    return font;
  } catch (error) {
    console.error(`Error loading font from ${url}:`, error);
    throw error;
  }
} 