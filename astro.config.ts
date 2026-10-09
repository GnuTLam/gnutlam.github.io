import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import react   from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import blog    from './blog.config';

// The site origin comes from blog.config.ts (site.url); SITE_URL / BASE_PATH in
// the environment (.env locally, repository variables on GitHub Actions)
// override it — see .env.example. Both are optional.
const env  = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const SITE = env.SITE_URL  || blog.site.url;
const BASE = env.BASE_PATH || '/';

// Every internal link is written root-relative ("/posts/"), so the site must
// be served from the ROOT of its domain: a user site (<name>.github.io) or a
// custom domain. A sub-path would ship a site full of broken links — refuse
// to build one instead.
if (BASE !== '/') {
  throw new Error(
    `BASE_PATH must be "/" (got "${BASE}"). Deploy to <username>.github.io or a ` +
    'custom domain — this site does not support GitHub project-page sub-paths.',
  );
}

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
