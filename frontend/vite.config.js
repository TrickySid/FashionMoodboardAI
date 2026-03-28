import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Match the original CRA port if preferred
  },
  build: {
    outDir: 'build', // CRA uses 'build' by default, Vite uses 'dist'
  }
})
