import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Placeholder Vite config; adjust for Electron preload/main bundling as needed.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
