import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy /api/* requests to local API server (port 3001)
          // This resolves CORS issues with government APIs
          '/api/permits-dallas': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
          '/api/permits-fortworth': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
          '/api/permits-arlington': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          },
          '/api/permits-irving': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
