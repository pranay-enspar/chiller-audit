import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // ⚠️ Change this to match your GitHub repo name, e.g. '/my-audit-tool/'
  // If deploying to a custom domain or root, set to '/'
  base: '/chiller-audit/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Enspar Chiller Plant Audit',
        short_name: 'Chiller Audit',
        description: 'On-site utility audit data capture for chiller plants',
        theme_color: '#1B6B52',
        background_color: '#F7F6F2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/chiller-audit/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
          handler: 'NetworkOnly'
        }]
      }
    })
  ],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          xlsx: ['xlsx']
        }
      }
    }
  }
});
