import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace <your-repo-name> with your actual GitHub repository name
  base: '/german-art-schools/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist', // Ensure the output directory is 'dist'
    target: 'esnext',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/three/') ||
            id.includes('node_modules/@react-three/fiber/') ||
            id.includes('node_modules/@react-three/drei/') ||
            id.includes('node_modules/@react-three/postprocessing/') ||
            id.includes('node_modules/three-stdlib/') ||
            id.includes('node_modules/three-geojson-geometry/') ||
            id.includes('node_modules/three-mesh-bvh/')
          ) {
            return 'three'
          }
          if (
            id.includes('node_modules/d3/') ||
            id.includes('node_modules/d3-force/') ||
            id.includes('node_modules/d3-force-3d/') ||
            id.includes('node_modules/d3-geo/') ||
            id.includes('node_modules/d3-geo-projection/')
          ) {
            return 'd3'
          }
          if (id.includes('node_modules/@turf/turf/')) {
            return 'turf'
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'motion'
          }
        },
      },
    },
  },
}) 