import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  /* Relative asset URLs so the demo works from a GitHub Pages sub-path
     (https://user.github.io/msr-sports-demo/) as well as from a domain root. */
  base: process.env.VITE_DEMO === '1' ? './' : '/',
  /* top-level await in api.js keeps the demo backend out of the live bundle */
  build: { target: 'esnext', chunkSizeWarningLimit: 900 },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' }
  }
});
