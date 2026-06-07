import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const astraCompat = resolve(__dirname, 'src/renderer/src/shared/astraCompat.ts')
const astraPackage = resolve(__dirname, 'node_modules/astra')
const canvasShim = resolve(__dirname, 'src/main/shims/canvas.ts')
const xenovaShim = resolve(__dirname, 'src/main/shims/xenova-transformers.ts')
const pranaRoot = resolve(__dirname, 'node_modules/prana/src')

// prana reorganised its service layer — map old paths to actual locations
const pranaServiceAliases = [
  { find: 'prana/main/services/pranaPlatformRuntime', replacement: `${pranaRoot}/main/common/config/pranaPlatformRuntime` },
  { find: 'prana/main/services/pranaRuntimeConfig', replacement: `${pranaRoot}/main/common/config/pranaRuntimeConfig` },
  { find: 'prana/main/services/sqliteConfigStoreService', replacement: `${pranaRoot}/main/common/storage/sqliteConfigStoreService` },
  { find: 'prana/main/services/sqliteCacheService', replacement: `${pranaRoot}/main/common/storage/sqliteCacheService` },
  { find: 'prana/main/services/governanceRepoService', replacement: `${pranaRoot}/main/features/governance/governanceRepoService` },
  { find: 'prana/main/services/authService', replacement: `${pranaRoot}/main/features/auth/authService` },
  { find: 'prana/main/services/runtimeDocumentStoreService', replacement: `${pranaRoot}/main/features/operations/runtimeDocumentStoreService` },
  { find: 'prana', replacement: pranaRoot },
]

export default defineConfig(() => {
  return {
    main: {
      plugins: [externalizeDepsPlugin({ exclude: ['prana'] })],
      build: {
        rollupOptions: {
          external: [
            /^jsdom($|\/)/,
            /^css-tree($|\/)/,
            /^cssstyle($|\/)/,
            /^onnxruntime/,
            /^sharp($|\/)/,
            'bufferutil',
            'utf-8-validate',
            'better-sqlite3'
          ],
          input: {
            index: resolve(__dirname, 'src/main/index.ts')
          }
        }
      },
      resolve: {
        alias: [
          ...pranaServiceAliases,
          { find: /^@xenova\/transformers(\/.*)?$/, replacement: xenovaShim },
          { find: 'canvas', replacement: canvasShim }
        ]
      }
    },

    preload: {
      build: {
        // Prana main resolves preload relative to out/main/chunks in this setup.
        // Emit preload to out/main/preload so the path is always resolvable.
        outDir: resolve(__dirname, 'out/main/preload'),
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/preload/index.ts'),
            plugin: resolve(__dirname, 'src/preload/plugin.ts')
          }
        }
      },
      resolve: {
        alias: [
          ...pranaServiceAliases,
          { find: 'canvas', replacement: canvasShim }
        ]
      }
    },
    renderer: {
      resolve: {
        alias: [
          { find: /^astra$/, replacement: astraCompat },
          { find: /^@astra-package$/, replacement: astraPackage },
          { find: /^@astra-package\/(.*)$/, replacement: `${astraPackage}/$1` },
          { find: '@renderer', replacement: resolve('src/renderer/src') },
          {
            find: /^prana\/ui(\/.*)?$/,
            replacement: resolve('src/renderer/src/shared/prana-ui') + '$1'
          },
          { find: 'prana', replacement: resolve('node_modules/prana/src') },
          { find: 'react', replacement: resolve('node_modules/react') },
          { find: 'react-dom', replacement: resolve('node_modules/react-dom') },
          { find: '@mui/material', replacement: resolve('node_modules/@mui/material') },
          { find: '@emotion/react', replacement: resolve('node_modules/@emotion/react') },
          { find: '@emotion/styled', replacement: resolve('node_modules/@emotion/styled') }
        ]
      },
      plugins: [react()],
      optimizeDeps: {
        include: ['react-is', '@mui/utils', '@mui/material']
      }
    }
  }
})
