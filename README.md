# lam.dev — IT Field Notes on LAM/OS

A statically-generated engineering blog styled as a riced Linux desktop
(i3 windows, top panel, nvim reader, interactive shell). Astro 6 static
output with React islands for the interactive parts.

## Develop

```sh
npm install
npm run dev        # http://localhost:4321
npm run check      # astro type-check
npm run build      # production build → dist/
npm run preview    # serve the built site
```

## Edit content

Everything editable lives in a few data files — change, rebuild, publish.
No component needs touching.

| What | Where |
| --- | --- |
| Site identity (name, domain, OS, prompt, tagline, meta) | `src/data/site.ts` |
| Page copy (home hero + about bio/now/role/stack) | `src/data/content.ts` |
| Social links | `src/data/nav.ts` (`SOCIALS`) |
| Categories & which tags map into them | `src/data/topics.ts` |
| Posts | `src/content/posts/*.md` |
| Avatar / pixel art | `src/data/pixel.ts` |

Write a post: add `src/content/posts/<slug>.md` with frontmatter (see any
existing post). Set `draft: true` to keep it dev-only; `pinned: true` to
star it to the top. Category, counts, tag pages, RSS and the sitemap all
derive automatically from the posts collection.

Copy strings in `content.ts` support `**bold**` markers.

## Deploy

Config comes from the environment — copy `.env.example` to `.env`:

```sh
SITE_URL=https://your-domain        # canonical origin, sitemap, RSS, OG
BASE_PATH=/                         # or /repo-name for GitHub project pages
```

`.github/workflows/deploy.yml` builds and publishes to GitHub Pages on
every push to `master`. One-time: **Settings → Pages → Source: GitHub
Actions**, and set `SITE_URL` / `BASE_PATH` as repository variables.

## Layout

```
src/
├── data/        # site.ts, content.ts, nav.ts, topics.ts, pixel.ts, posts.ts
├── content/     # posts/*.md + content.config.ts (collection schema)
├── components/  # static/ (Astro) + islands/ (React: reader, shell, posts)
├── layouts/     # BaseLayout.astro
├── pages/       # routes: index, posts, categories, tags, about, 404, rss
└── styles/      # theme.css (one stylesheet)
```
