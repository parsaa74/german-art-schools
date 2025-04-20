/**
 * Simple deterministic noise function for UI effects
 * Returns a value between -1 and 1 based on input parameters
 * 
 * @param seed A seed value to generate different noise patterns
 * @param offset An offset value to animate the noise over time
 */
export function noise(seed: number, offset: number = 0): number {
  // Create a deterministic but seemingly random value
  const x = Math.sin(seed * 12.9898 + offset * 4.1414) * 43758.5453;
  // Take the fractional part only, adjusted to range from -1 to 1
  return (x - Math.floor(x)) * 2 - 1;
} 