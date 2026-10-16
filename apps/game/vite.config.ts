import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site under /<repo>/; the deploy workflow sets BASE_PATH.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'The Wheel Has Spoken',
        short_name: 'Wheel',
        description: 'Spin a fighter. Fight on a wheel. Blame the wheel.',
        theme_color: '#14182b',
        background_color: '#14182b',
        display: 'standalone',
        orientation: 'any',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], navigateFallbackDenylist: [/\/legacy\//] },
    }),
  ],
  build: { target: 'es2022', sourcemap: true },
});
