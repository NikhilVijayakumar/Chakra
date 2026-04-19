import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src'),
      prana: resolve(__dirname, 'node_modules/prana/src'),
      dharma: resolve(__dirname, 'node_modules/dharma/src'),
      astra: resolve(__dirname, 'node_modules/astra')
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text-summary']
    }
  }
})
