import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// O app do cliente. Roda em http://localhost:5173 no dev.
// Configurado como PWA instalável ("Adicionar à tela inicial" no celular).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Smart Root',
        short_name: 'Smart Root',   // é este que aparece embaixo do ícone na tela inicial
        description: 'Controle a irrigação dos seus jardins',
        lang: 'pt-BR',
        theme_color: '#050b14',
        background_color: '#050b14',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,   // escuta em 0.0.0.0 → acessível pelo IP do PC na rede (celular)
    // Proxy: chamadas a /api vão para o backend FastAPI, evitando dor de cabeça com CORS.
    // Como o proxy roda no PC, o celular só precisa alcançar a porta 5173; o backend
    // continua respondendo apenas em localhost.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
