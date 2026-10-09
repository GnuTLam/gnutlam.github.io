# gnut.dev — IT Field Notes on GNUT/OS

A statically generated engineering blog styled as a riced Linux desktop
(i3 windows, top panel, nvim reader, interactive shell). Astro 6 static
output with React islands for the interactive parts. Deployed to GitHub
Pages by GitHub Actions on every push.

> Hướng dẫn tiếng Việt (sửa nội dung, viết & đăng bài): **[CONTENT.md](CONTENT.md)**

## Develop

```sh
npm install
npm run dev        # http://localhost:4321 — drafts are visible here
npm run check      # type-check
npm run build      # production build → dist/ (drafts excluded)
npm run preview    # serve the built site
```

Requires Node ≥ 22.12.

## Write and publish a post

A post is a **folder** — anywhere on disk — holding `index.md` and its images.
The folder name becomes the URL (`/posts/kafka-notes/`).

```
kafka-notes/
├── index.md          # ![Flow](images/flow.png "Caption") — relative paths
└── images/flow.png
```

One command does everything:

```sh
npm run post -- D:/blog/kafka-notes
```

- **folder missing** → creates it (`index.md` + `images/`) and asks for the
  header: title, one-line excerpt, tags, date (Enter = today), pinned, banner word.
- **folder exists** → asks again (Enter keeps each value), checks the post and
  every image it references, then **preview** (draft copy for `npm run dev`)
  or **publish** (full build → commit only this post → push).

The blog keeps an exact mirror in `src/content/posts/<slug>/`: images added,
removed or renamed follow on the next run; unused images are never shipped; a
failed build restores the previous copy. Images are bundled by Vite (hashed
URLs) and the first one becomes the post's share image. Flags: `--yes`
(no questions), `--preview`, `--publish`, `--no-push`.

## Edit content

| What | Where |
| --- | --- |
| Site identity, home + about copy, avatars, social links | `blog.config.ts` |
| Categories & which tags map into them | `src/data/topics.ts` |
| Posts | `src/content/posts/<slug>/index.md` (+ images) — via `npm run post` |
| Avatar / site-wide images | `public/` |
| Colours / theme | `src/styles/theme.css` (tokens at the top) |

Reading time, word counts, categories, tag pages, RSS and the sitemap are
all derived from the posts — never edited by hand.

## Deploy (GitHub Pages)

The site must live at the **root** of its domain (every link is
root-relative): a user site `https://<username>.github.io` or a custom
domain. The build refuses any other `BASE_PATH`.

1. Create a repository named **`<username>.github.io`** (here:
   `GnuTLam.github.io`) and push this project to its `main` branch:
   ```sh
   git remote add origin https://github.com/GnuTLam/GnuTLam.github.io.git
   git push -u origin main
   ```
2. On GitHub: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**.
3. `.github/workflows/deploy.yml` builds and deploys on every push to
   `main` (or run it by hand from the Actions tab).

The site address comes from `blog.config.ts` (`site.url`). To override it
(e.g. a custom domain) set a repository variable `SITE_URL`, or `SITE_URL`
in a local `.env` — see `.env.example`. For a custom domain also add a
`public/CNAME` file containing the domain.

## Layout

```
blog.config.ts       # the one content/config file
scripts/             # post.mjs (the post CLI) + lib.mjs helpers
src/
├── content/posts/   # <slug>/index.md + images (schema: src/content.config.ts)
├── data/            # site.ts, content.ts, nav.ts → read blog.config.ts;
│                    # topics.ts, posts.ts, words.ts, images.ts, pixel.ts, avatar.ts
├── components/      # static/ (Astro) + islands/ (React: home, posts, reader, shell)
├── layouts/         # BaseLayout.astro
├── pages/           # routes: index, posts, categories, tags, about, 404, rss
└── styles/          # theme.css (one stylesheet)
public/              # fonts, favicon, og image, avatars
```
