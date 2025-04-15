import { useState, useEffect, useMemo } from 'react';
import { loadFontWithCache } from '@/utils/fontLoader';

/**
 * Hook to load and cache fonts for Three.js text
 * 
 * @param fontUrls URLs to font JSON files to load
 * @returns Object containing loading state and loaded fonts
 */
export function useFonts(fontUrls: string[] = []) {
  const [fonts, setFonts] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Stringify fontUrls for stable dependency
  const fontUrlsString = JSON.stringify(fontUrls);

  useEffect(() => {
    const urls = JSON.parse(fontUrlsString);
    if (urls.length === 0) {
      setLoaded(true);
      return;
    }

    let isMounted = true;

    const loadAllFonts = async () => {
      // Reset state when fontUrls change
      setLoaded(false);
      setError(null);
      setFonts({});

      try {
        const loadedFonts: Record<string, any> = {};
        await Promise.all(
          urls.map(async (url: string) => { // Type url
            try {
              const font = await loadFontWithCache(url);
              if (isMounted) {
                // Update fonts incrementally (optional, but can be complex)
                // For simplicity, we'll collect all and set once
                loadedFonts[url] = font;
              }
            } catch (err) {
              console.warn(`Failed to load font from ${url}:`, err);
              // Optionally collect errors per font
            }
          })
        );

        if (isMounted) {
          setFonts(loadedFonts);
          setLoaded(true);
        }
      } catch (err) {
        console.error('Error loading fonts:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoaded(true);
        }
      }
    };

    loadAllFonts();

    return () => {
      isMounted = false;
    };
  // Use the stringified version as dependency
  }, [fontUrlsString]);

  // Memoize the return object to ensure stable reference
  const result = useMemo(() => ({
    fonts,
    loaded,
    error,
  }), [fonts, loaded, error]);

  return result;
} 