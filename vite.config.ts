import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths"
import { VitePWA } from 'vite-plugin-pwa'


// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          charts: ['chart.js', 'react-chartjs-2'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
        }
      }
    }
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg', 'icons/*.svg'],
      manifest: {
        name: 'OnliOps - Network Operations Platform',
        short_name: 'OnliOps',
        description: 'Plataforma de gerenciamento de operações de rede com monitoramento em tempo real, inventário de dispositivos e visualização de topologia.',
        theme_color: '#0A0B0D',
        background_color: '#0A0B0D',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          {
            src: '/icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/maskable-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshots/dashboard-wide.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Dashboard - Visão geral do sistema'
          },
          {
            src: '/screenshots/dashboard-mobile.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Dashboard - Versão mobile'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Acessar o dashboard principal',
            url: '/dashboard',
            icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192' }]
          },
          {
            name: 'Monitoramento',
            short_name: 'Monitor',
            description: 'Ver status de monitoramento',
            url: '/monitoring',
            icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192' }]
          },
          {
            name: 'Topologia',
            short_name: 'Topologia',
            description: 'Visualizar topologia de rede',
            url: '/topology',
            icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
})
