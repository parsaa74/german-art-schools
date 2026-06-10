/**
 * .bin files import as ArrayBuffer:
 * - in the Worker bundle via the `rules = [{ type = "Data", ... }]` entry in wrangler.toml
 * - in vitest via the `bin-loader` plugin in vitest.config.ts
 */
declare module '*.bin' {
  const data: ArrayBuffer;
  export default data;
}
