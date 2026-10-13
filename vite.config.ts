import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: '/german-art-schools/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    chunkSizeWarningLimit: 1600, // ponytail: the bundle is mostly the dataset JSON
  },
})
