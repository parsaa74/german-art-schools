import { defineConfig } from 'vitest/config';

/**
 * Plain vitest (node environment) testing the Hono app via app.request().
 * No workers pool needed: the app is pure JS over bundled JSON data.
 *
 * The `bin-loader` plugin mirrors the wrangler `rules` entry in wrangler.toml
 * (type = "Data" for *.bin): any `import data from './x.bin'` resolves to an
 * ArrayBuffer, exactly like in the Worker bundle. It exists so the semantic
 * search agent can `import vectorsBin from '../data/vectors.bin'` in
 * src/routes/search.ts and have tests pass without editing this file.
 */
export default defineConfig({
  plugins: [
    {
      name: 'bin-loader',
      load(id) {
        if (!id.endsWith('.bin')) return null;
        // Emit a module whose default export is an ArrayBuffer, read from
        // disk at import time (the file is too big to inline as source).
        return (
          `import { readFileSync } from 'node:fs';\n` +
          `const b = readFileSync(${JSON.stringify(id)});\n` +
          `export default b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);\n`
        );
      },
    },
  ],
  test: {
    include: ['test/**/*.test.ts'],
  },
});
