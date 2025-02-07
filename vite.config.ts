import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8000';
  const wsBaseUrl = apiBaseUrl.replace('http', 'ws');

  return {
    server: {
      cors: true,
      proxy: {
        '/aws': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/cloudwatch': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/mysql': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/explain': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/collectors': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/rds-instances': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/cw-slowquery': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: wsBaseUrl,
          ws: true,
        },
      },
    },
    publicDir: 'public',
    plugins: [react()],
    optimizeDeps: {
      include: ['lucide-react'],
    },
  };
});