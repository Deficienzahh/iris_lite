import { defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa'; 

export default defineConfig(() => {
  const backendUrl = 'http://127.0.0.1:5100';

  return {
    plugins: [react(), tailwindcss(),
      VitePWA({ // 👈 configurazione PWA
        registerType: 'autoUpdate',
        includeAssets: ['icon-192.png', 'icon-512.png'],
        manifest: {
          name: 'Iris',
          short_name: 'Iris',
          start_url: '/',
          display: 'standalone',
          background_color: '#000000',
          theme_color: '#0f0f0f',
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    server: {
      host: 'localhost',
      allowedHosts: ['localhost', 'iris.taile31d81.ts.net'],
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});