// @ts-check
import { defineConfig } from 'astro/config';
import react   from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Personal site → base '/'. Project site → base '/repo-name'.
const SITE = 'https://lamdev.github.io';  // replace with real domain
const BASE = '/';

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
