import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifestFilename: 'manifest-v7.webmanifest',
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,svg,woff2}',
          'assets/icons/zenith-icon-*.png',
        ],
        globIgnores: ['**/webodmService-*.js'],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
     manifest: {
  name: 'Zenith',
  short_name: 'Zenith',
  id: '/',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  theme_color: '#f4f8ef',
  background_color: '#f4f8ef',
  lang: 'pt-BR',
   icons: [
  {
    src: "/assets/icons/zenith-icon-192-v6.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any"
  },
  {
    src: "/assets/icons/zenith-icon-512-v6.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any"
  },
  {
    src: "/assets/icons/zenith-icon-maskable-192-v6.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "maskable"
  },
  {
    src: "/assets/icons/zenith-icon-maskable-512-v6.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable"
  }
]
},
      // 🔥 Desativa cache durante desenvolvimento
      devOptions: {
        enabled: false
      }
    })
  ],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true, // 🔥 Limpa a pasta antes de build
    sourcemap: false,
    // 🔥 Força rebuild completo
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  // 🔥 Desativa cache do Vite
  server: {
    force: true
  }
})
