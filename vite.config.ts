import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the app from a subpath (repo name). We use a relative
// base ('./') so built assets resolve correctly regardless of the repo name,
// and HashRouter handles SPA routing without any server-side fallback.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
