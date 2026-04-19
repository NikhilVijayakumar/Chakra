import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const astraCompat = resolve(__dirname, 'src/renderer/src/shared/astraCompat.ts')
const astraPackage = resolve(__dirname, 'node_modules/astra')
const canvasShim = resolve(__dirname, 'src/main/shims/canvas.ts')

export default defineConfig(() => {
  return {
    main: {
      plugins: [externalizeDepsPlugin({ exclude: ['prana', 'dharma'] })],
      build: {
        rollupOptions: {
          external: [/^jsdom($|\/)/, /^css-tree($|\/)/, /^cssstyle($|\/)/],
          input: {
            index: resolve(__dirname, 'src/main/index.ts')
          }
        }
      },
      resolve: {
        alias: {
          prana: resolve('node_modules/prana/src'),
          dharma: resolve('node_modules/dharma/src'),
          canvas: canvasShim
        }
      }
    },

    preload: {
      build: {
        // Prana main resolves preload relative to out/main/chunks in this setup.
        // Emit preload to out/main/preload so the path is always resolvable.
        outDir: resolve(__dirname, 'out/main/preload')
      },
      resolve: {
        alias: {
          prana: resolve('node_modules/prana/src'),
          dharma: resolve('node_modules/dharma/src'),
          canvas: canvasShim
        }
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
            find: /^prana\/ui\/constants\/pranaConfig$/,
            replacement: resolve('src/renderer/src/shared/pranaConfigCompat.ts')
          },
          { find: 'prana', replacement: resolve('node_modules/prana/src') },
          { find: 'dharma', replacement: resolve('node_modules/dharma/src') },
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
