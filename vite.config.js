// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// ─────────────────────────────────────────────────────────────
// HOW TO USE THE `base` OPTION:
//
// • For local/dev and normal hosting: leave VITE_BASE unset (defaults to '/')
// • For GitHub Pages at https://<user>.github.io/<REPO>/
//     set VITE_BASE='/<REPO>/' before building, e.g.:
//       mac/linux:  VITE_BASE=/color-reactor/ npm run build
//       windows pwsh:  $env:VITE_BASE="/color-reactor/"; npm run build
//   or just hardcode base: '/color-reactor/' below.
// ─────────────────────────────────────────────────────────────

const BASE = process.env.VITE_BASE || '/'

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],

  base: BASE,

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // (Your original form '@': '/src' also works, but this is path-safe)
    },
  },

  server: {
    port: 5173,
    // Web Serial works on http://localhost out of the box
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
