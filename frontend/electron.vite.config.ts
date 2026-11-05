import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Builds the reference consumer app in src/main, src/preload, src/renderer (library code is in src/library).
export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: { plugins: [externalizeDepsPlugin()], build: { rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].js' } } } },
  renderer: { root: resolve('src/renderer'), plugins: [react()] }
})
