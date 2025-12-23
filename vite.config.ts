
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures assets are loaded correctly on GitHub Pages
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
