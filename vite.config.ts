import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(() => {
  const useNginxProxy = process.env.VITE_USE_NGINX === '1'

  return {
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "./src"),
        },
      },
      server: {
        host: '0.0.0.0',
        port: 3000,
        strictPort: true,

        hmr: useNginxProxy ? {
          host: '127.0.0.1',
          clientPort: 80,
          protocol: 'ws',
        } : undefined,

        proxy: useNginxProxy ? undefined : {
          '/auth': {
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
          },
          '/api': {
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
          }
        }
      },
  }
})
