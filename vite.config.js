import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin()
  ],
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
    }
  },
  build: {
    target: 'es2015',
    minify: 'esbuild',
    reportCompressedSize: true,
    rollupOptions: {
      input: './src/main.jsx',
      output: {
        entryFileNames: `welcome-widget.js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
        format: 'iife'
      }
    }
  },
  define: { 'process.env.NODE_ENV': '"production"' }
})
