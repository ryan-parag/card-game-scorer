import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import ogPlugin from 'vite-plugin-open-graph';
import type { Options } from 'vite-plugin-open-graph';

const ogURL = 'https://scorekeeper.ryanparag.coml';
const ogImage = '/src/public/images/og-image.png';
const ogTitle = 'ScoreKeeper by Ryan Parag';
const ogDescription = 'Add players and track scores across all your favorite card games';

const ogOptions: Options = {
  basic: {
    url: ogURL,
    title: ogTitle,
    type: 'image.png',
    image: ogImage,
    determiner: 'auto',
    description: ogDescription,
    siteName: ogTitle,
  },
  twitter: {
    image: ogImage
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), ogPlugin(ogOptions)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
