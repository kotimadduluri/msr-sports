import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/* one self-contained .html — openable from a phone, a pen drive or WhatsApp */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  define: { 'import.meta.env.VITE_DEMO': '"1"' },
  base: './',
  build: { target: 'esnext', outDir: 'dist-single', assetsInlineLimit: 100000000, cssCodeSplit: false,
           rollupOptions: { output: { inlineDynamicImports: true } } }
});
