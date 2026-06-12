import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Base relativa ('./') => el build funciona en GitHub Pages (sitios de proyecto),
// Render Static Site, Netlify, Vercel o abierto localmente, sin reconfigurar rutas.
export default defineConfig({
  base: './',
  // Tratar el audio .m4a como asset (devuelve una URL al importarlo)
  assetsInclude: ['**/*.m4a'],
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
