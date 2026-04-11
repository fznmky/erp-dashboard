import { defineConfig } from 'vite';

export default defineConfig({
  base: '/erp-dashboard/',
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
