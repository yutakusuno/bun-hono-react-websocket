import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dir, './src'),
      '@server': path.resolve(import.meta.dir, '../server'),
      '@shared': path.resolve(import.meta.dir, '../shared'), // Use import.meta.url instead of import.meta.dir
    },
  },
});
