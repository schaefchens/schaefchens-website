import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The built index.html is NOT served from the web root — it lands in /app/,
// which Apache denies, and index.php reads it from disk once the gate passes.
// Everything it references must therefore be an absolute path, which is what
// base:'/' gives us. A relative base would resolve against the request URL and
// break on any deep link like /app/bible-quiz.
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2022',
    sourcemap: false,
  },
})
