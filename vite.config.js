import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version || '1.0.0')
  },
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 4096
  },
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: null,
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['**/sw.js'],
        additionalManifestEntries: [
          { url: '/offline.html', revision: null }
        ],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024
      },
      devOptions: {
        enabled: false,
        type: 'module'
      }
    })
  ],
  server: {
    port: 5173,
    open: true
  }
})
