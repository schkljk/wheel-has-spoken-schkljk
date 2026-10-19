import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site under /<repo>/; the deploy workflow sets BASE_PATH.
const base = process.env.BASE_PATH ?? '/';

// the Android app (Capacitor) serves the files itself and updates by reinstalling: no service worker there
const app = !!process.env.CAP_BUILD;

// shown in Settings: the commit on CI, the date otherwise
const build = (process.env.GITHUB_SHA ?? '').slice(0, 7) || new Date().toISOString().slice(0, 10);

export default defineConfig({
  base,
  // __NATIVE__: the Android app's glue only goes into the Android build
  define: { __BUILD__: JSON.stringify(build), __NATIVE__: JSON.stringify(app) },
  plugins: [
    preact(),
    VitePWA({
      disable: app,
      // a new version waits for the player's tap (state/update.ts): swapping files under a running game left
      // its lazy screens pointing at files that were gone
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'The Wheel Has Spoken',
        short_name: 'Wheel',
        description: 'Spin a fighter. Fight on a wheel. Blame the wheel.',
        theme_color: '#14182b',
        background_color: '#14182b',
        display: 'standalone',
        orientation: 'any',
        // the PNG is what Android's install prompt and home screen want
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // not for players: the developer balance lab, and Pixi's WebGPU renderer (the game asks for WebGL)
        globIgnores: ['**/lab.worker-*.js', '**/WebGPURenderer-*.js'],
        navigateFallbackDenylist: [/\/legacy\//],
        // fonts work offline after the first visit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
  build: { target: 'es2022', sourcemap: true },
});
