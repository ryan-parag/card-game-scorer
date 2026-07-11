/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import ogPlugin from 'vite-plugin-open-graph';
import type { Options } from 'vite-plugin-open-graph';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const ogURL = 'https://scorekeeper.ryanparag.com';
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
    siteName: ogTitle
  },
  twitter: {
    image: ogImage
  }
};
export default defineConfig({
  plugins: [react(), ogPlugin(ogOptions)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});