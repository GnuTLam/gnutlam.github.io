// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import react   from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Deployment values come from the environment (.env locally, repo
// variables on CI) — see .env.example. Personal site → BASE_PATH '/',
// project site → '/repo-name'.
const env  = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const SITE = env.SITE_URL  || 'https://lamdev.github.io';
const BASE = env.BASE_PATH || '/';

export default defineConfig({
  output: 'static',
  site:   SITE,
  base:   BASE,
  devToolbar: { enabled: false },
  // hover-prefetch every internal link — workspace switches land instantly,
  // so the zoom animation is all the user waits for
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  redirects: {
    '/archive/': '/posts/',   // archive merged into the Posts workspace (v7.1)
  },
  integrations: [react(), sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
