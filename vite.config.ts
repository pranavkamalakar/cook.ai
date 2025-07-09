import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      // Enable node modules resolution
      platform: 'node',
      target: 'node16',
    }
  },
  resolve: {
    alias: {
      // Add node built-ins for browser
      stream: 'stream-browserify',
      util: 'util',
      url: 'url',
      http: 'stream-http',
      https: 'https-browserify',
      zlib: 'browserify-zlib'
    }
  }
});
