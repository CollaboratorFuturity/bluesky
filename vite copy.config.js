import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  resolve: { alias: { '@': '/src' } },
  base: process.env.VITE_BASE || '/',
  server: { port: 5173 }
})
