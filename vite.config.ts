import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // Main process entry
        entry: 'electron/main.ts',
        onstart({ startup }) {
          // Only startup, don't restart on every rebuild in dev
          startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: false, // Disable minification in dev for faster rebuilds
            rollupOptions: {
              external: ['electron', 'electron-store']
            }
          }
        }
      },
      {
        // Preload script
        entry: 'electron/preload.ts',
        onstart({ reload }) {
          // Reload on change
          reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs'
              }
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@electron': fileURLToPath(new URL('./electron', import.meta.url))
    }
  },
  server: {
    port: 5173
  }
})
