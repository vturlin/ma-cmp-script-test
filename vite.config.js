import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015', /* La magie pour les anciens iPhones */
    rollupOptions: {
      input: './src/main.jsx', /* <-- AJOUT CRUCIAL : On indique le vrai point de départ */
      output: {
        entryFileNames: `welcome-widget.js,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
        format: 'iife' 
      }
    }
  }
})
