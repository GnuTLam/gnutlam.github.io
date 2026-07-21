# SSG Migration Plan: SPA → Astro + GitHub Pages

## Stack
- **Framework:** Astro 6 (`output: 'static'`) — installed version; API differences noted below
- **Islands:** `@astrojs/react` (hydrate only interactive parts)
- **Deploy:** GitHub Actions → GitHub Pages

## Current State
```
My blog/
├── index.html          ← SPA entry (Babel standalone + React UMD)
├── assets/
│   ├── js/*.jsx        ← 10 React components (window globals)
│   ├── css/*.css       ← 3 CSS files (untouched in migration)
│   └── fonts/BoldPixels.ttf
└── doc/
    └── migration-plan.md
```

## Posts (10 total)
| slug | title |
|---|---|
| engineering-made-invisible | Engineering Made Invisible |
| tokio-deadlock-3am | Debugging a Tokio Deadlock at 3AM |
| event-sourcing-no-cqrs | Event Sourcing Without the CQRS Tax |
| scaling-websockets-1m | Scaling WebSockets to 1M Concurrent Connections |
| vector-db-cold-starts | Eliminating Cold Starts on Vector Databases |
| taming-skewed-joins | Taming Skewed Joins on 10TB Spark Jobs |
| non-deterministic-state-machines | Building Non-Deterministic State Machines |
| ai-agents-rust | Building Scalable AI Agents With Rust |
| postgres-as-a-queue | Postgres as a Queue, Reluctantly |
| kitchen-sink-test | The Kitchen Sink: A Complete Rendering Test |

## Routes → Static Files
| Route | Output | SEO title |
|---|---|---|
| `/` | `dist/index.html` | `lam.dev — posts` |
| `/tags/` | `dist/tags/index.html` | `Topics — lam.dev` |
| `/archive/` | `dist/archive/index.html` | `Archive — lam.dev` |
| `/about/` | `dist/about/index.html` | `About — lam.dev` |
| `/posts/[slug]/` | `dist/posts/*/index.html` | `{title} — lam.dev` |

## Hydration Strategy
| Component | Directive | Why |
|---|---|---|
| TopBar, Sidebar, Dock | none (`.astro`) | Pure nav links |
| HomeShell (search+filter) | `client:idle` | After LCP |
| TweaksPanel | `client:idle` | Cosmetic |
| ReaderInteractive (TOC+copy) | `client:load` | Post UX |
| TagPage, ArchivePage | `client:idle` | After LCP |

---

## Phases

### Phase 1 — Scaffold [x]
- [x] `npm create astro` in new `blog-astro/` dir
- [x] `astro add react sitemap`
- [x] Copy `assets/css/*.css` → `src/styles/`
- [x] Copy `assets/fonts/` → `public/fonts/`
- [x] Write `astro.config.mjs`
- [x] All dirs created (`src/content`, `src/data`, `src/layouts`, `src/components`, `src/pages/*`)

### Phase 2 — Data [x]
- [x] Write `src/content.config.ts` (Zod schema, glob loader — Astro 6 API)
- [x] Create 10 `.md` files in `src/content/posts/`
- [x] Write `src/data/topics.ts`
- [x] Write `src/data/nav.ts`
- [x] `astro check` — 0 errors, 0 warnings

### Phase 3 — Static Shell [ ]
- [x] Write `src/components/static/SEOHead.astro`
- [x] Write `src/layouts/BaseLayout.astro`
- [x] Write `src/components/static/Sidebar.astro`
- [x] Write `src/components/static/TopBar.astro`
- [x] Write `src/components/static/Dock.astro`

### Phase 4 — Pages [ ]
- [x] `src/pages/index.astro`
- [x] `src/pages/tags/index.astro`
- [x] `src/pages/archive/index.astro`
- [x] `src/pages/about/index.astro`
- [x] `src/pages/posts/[slug].astro`

### Phase 5 — Islands [ ]
- [x] `HomeShell.tsx` (search + filter + post list)
- [x] `WritingWindow.tsx` (post list + autoroll)
- [x] `HeroWindow.tsx` (stat tiles)
- [x] `TagPage.tsx`
- [x] `ArchivePage.tsx`
- [x] `TweaksPanel.tsx`
- [x] `MarkdownRenderer.tsx` (preserve custom tokenizer)
- [x] `ReaderInteractive.tsx` (TOC + copy buttons)

### Phase 6 — CI/CD [ ]
- [ ] `.github/workflows/deploy.yml`
- [ ] `.github/lighthouse-budget.json`
- [ ] Push → verify GitHub Pages build

---

## Key Refactoring Rules
1. `window.POSTS` / `window.TOPICS` → ES module imports
2. `setNav('tag')` → `window.location.href = '/tags/'`
3. `setReading(id)` → `window.location.href = '/posts/${slug}/'`
4. CSS files: **zero modification** (copy verbatim)
5. Custom markdown tokenizer: **zero modification** (move to `MarkdownRenderer.tsx`)
