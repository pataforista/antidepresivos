import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
