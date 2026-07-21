# `/posts` Mobile — 8-Point Micro-Ergonomics Pass

## Context
The home `/` feed (`HomeShell.tsx` → `HeroWindow` + search + `WritingWindow`, styled by `responsive.css`) already has its structural mobile layer shipped: the CLI `<dialog>` command palette, the horizontal **mandatory-snap** media strip, `.post-thumb` topic-toned covers, and tag-chip removal. This pass is a **focused 8-fix polish** to cut vertical bloat, tighten interactive components, lock text boundaries, and lift reading contrast — without disturbing the hacker/minimalist theme.

**Scope/boundary:** every change lands in `responsive.css` `@media (max-width:620px)` — the tier already aligned with the components' `matchMedia('(max-width:620px)')` `compact`/`isPhone` gates (so cards/palette only transform where this CSS applies), and well inside the ≤768 sandbox. **Desktop ≥1025 stays byte-identical.** Only existing design tokens, `rem`/`em`/`clamp()`, no hardcoded magic widths.

**Decisions baked in (previously flagged):**
- **#2** CTAs shrink to auxiliary scale but hold a **44px** min touch target (a11y floor — not smaller).
- **#3** hides the entire `.hero-right` (ARTICLES + LAST WRITE + ASCII sig) and **deletes** the now-dead `.hero-bento`/`.hero-stat-*` ≤620 rules from the prior pass.
- **#6** "sharpen label identities" → **re-show** compact 8px `posts/tag/archive` labels (currently `display:none`) rather than icon-only.

**Items that override shipped rules:** #2 (btn sizing), #3 (bento 2-col → hidden), #5 (`.post-tags{flex-wrap:wrap}`→nowrap; `.post-title{line-clamp:initial}`→2).

---

## 1. Granular Mobile Component Remediation Matrix

| # | Component Area | Identified Mobile Bottleneck | Targeted UX Goal | Technical Core Directive |
|:-:|:--|:--|:--|:--|
| 1 | **Hero Typography** | `.hero-title .row` is `display:block` → 3 lines | 2 lines: `ENGINEERING` / `MADE INVISIBLE` | rows 2+3 `display:inline` + NBSP join |
| 2 | **CTA Container** | shipped `.btn{min-width:140px;height:48px}` blockade | auxiliary scale (≥44px floor) | `flex:1`, shrink pad/font, `min-width:0` |
| 3 | **Stats Panel** | `.hero-right` bento = noise + vertical bloat | purge on phone | `display:none` + delete dead bento rules |
| 4 | **Terminal Search** | palette prompt/input baseline drift; trigger ghost spill | centered, no truncation | `align-items:center`, `min-width:0`, ellipsis |
| 5 | **Carousel Cards** | tag-wrap warps height; "MIN READ" verbose; title clamp `initial` | locked height, 1-line tags, `8' read` | nowrap-scroll tags, clamp title:2/desc:3, regex |
| 6 | **Bottom Bar** | 52px tall, off-center start glyph, labels hidden | compact, centered, legible | `46px`, center glyph, stacked 8px labels |
| 7 | **Top Status Strip** | `.tb-net`/`.tb-addr` sub-thumb targets | 44px targets + prominence | min 44px tap area, font/weight bump |
| 8 | **Feed Body Text** | `.post-desc` low contrast, tight | +readability | `+1px`, `+12% lh`, `+10%` brightness |

---

## 2. High-Density Code Architecture Specifications
All CSS inside `responsive.css` `@media (max-width:620px)`; one TSX line in `WritingWindow.tsx`.

```css
/* #1 HERO TITLE — base styles.css:1069 `.row{display:block}` (3 lines). Fold rows 2+3 onto one line. */
.hero-title { font-size: clamp(1.6rem, 8.5vw, 2.1rem); line-height: 1.08; } /* 2-line-safe scale, no overflow */
.hero-title .row:nth-child(2), .hero-title .row:nth-child(3) { display: inline; }
.hero-title .row:nth-child(2)::after { content: '\00A0'; } /* NBSP: keeps MADE␣INVISIBLE intact */

/* #2 CTA MICRO-SIZING — overrides shipped .hero-cta-row .btn */
.hero-cta-row { gap: 8px; }
.hero-cta-row .btn {
  flex: 1 1 0; min-width: 0; width: auto;   /* share row, drop 140px blockade */
  min-height: 44px; height: 44px;           /* PROTECTIVE: a11y touch floor — never lower */
  padding-inline: 10px; font-size: 0.72rem; /* compounded-down auxiliary scale */
}

/* #3 STATS PRUNING — + DELETE dead .hero-bento/.hero-stat-articles/.hero-stat-last/.hero-stat-v-* ≤620 rules */
.hero-right { display: none; } /* purge ARTICLES / LAST WRITE / sig → reclaim the fold */

/* #4 SEARCH MICRO-ALIGNMENT — palette + trigger */
.search-palette .terminal { align-items: center; }              /* vertical-center prompt + input */
.search-palette .terminal-prompt { align-items: center; line-height: 1; }
.search-palette .terminal-input { line-height: 1.2; min-width: 0; } /* no baseline drift / clip */
.search-trigger { line-height: 1; }
.search-trigger .st-ghost { flex: 1 1 auto; }                    /* ellipsis already set; allow shrink */

/* #5 CARD LOCK + TAGS — overrides shipped .post-title{line-clamp:initial} & .post-tags{wrap} */
.post-card .post-title { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;
  overflow:hidden; font-size:0.92rem; }                          /* lock title height to 2 lines */
.post-card .post-desc { -webkit-line-clamp: 3; }                 /* deterministic height (was 4) */
.post-tags { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.post-tags::-webkit-scrollbar { display: none; }
.post-tag { flex: 0 0 auto; }                                    /* single-line scroll, no warp */
.post-card { min-height: 320px; }                                /* uniform mandatory-snap cards */

/* #6 BOTTOM SHELF — shrink + center + legible labels (labels are display:none ≤620 today) */
.shelf { min-height: 46px; }                                     /* was 52px */
.start-btn { justify-content: center; }                          /* fix off-center glyph (label hidden) */
.start-btn-glyph { margin: 0 auto; }
.shelf-app { flex-direction: column; gap: 2px; height: auto; min-height: 46px; padding-block: 4px; }
.shelf-app-label { display: block; font-size: 8px; letter-spacing: 0.08em; line-height: 1; opacity: 0.85; }
.shelf-app.is-active .shelf-app-label { color: var(--accent); opacity: 1; } /* sharpen active identity */

/* #7 TOP STATUS STRIP — bigger thumb targets + prominence */
.tb-net { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: flex-end; }
.tb-addr { font-size: 0.8rem; font-weight: 600; }                /* ./posts path prominence */
.tb-addr-v { color: var(--text-soft); }

/* #8 BODY TEXT CONTRAST — exact relative mutations */
.post-card .post-desc {
  font-size: 0.84rem;                                            /* ≈ +1px over 0.78rem */
  line-height: 1.68;                                             /* ≈ +12% over base 1.5 */
  color: color-mix(in srgb, var(--text-dim), white 12%);         /* ≈ +10% brightness, hue-preserving */
}
```
```tsx
/* #5 DENSE TIME — WritingWindow.tsx PostCard, compact branch only */
const readDense = post.read.replace(/\s*MIN(?:UTE)?S?\s*READ/i, "' read"); // "8 MIN READ" → "8' read"
// compact action renders: <span className="post-read">{readDense}</span>
```

---

## 3. Verification & Validation Protocol
1. `cd blog-astro && npx astro check` (0 new errors) + `npx astro build` clean.
2. **Desktop ≥1025 byte-identical** — screenshot-diff `/` @1440px ≈ 0; no card/shelf/hero overrides leak above 620.
3. **#1** @320/360/390: exactly 2 lines (`ENGINEERING` / `MADE INVISIBLE`), no orphan 3rd line, no horizontal overflow, cursor trails INVISIBLE.
4. **#2** CTAs share one row, ≥44px, auxiliary feel (not a blockade).
5. **#3** ARTICLES/LAST WRITE/sig absent; hero→search fold markedly higher (measure).
6. **#4** palette prompt+input vertically centered; long query echo in trigger ellipsizes (no spill); caret visible; clear of close button.
7. **#5** all cards uniform height (snap centers cleanly); tags one line w/ hidden scroll; shows `8' read`; titles clamp 2, foot never clipped.
8. **#6** shelf ~46px; start glyph centered; posts/tag/archive labels legible; active accented.
9. **#7** Wi-Fi + ./posts path ≥44px tappable and prominent.
10. **#8** desc larger/brighter/looser; **CLS = 0** (clamps + min-height reserve space — Lighthouse mobile).
11. **Cleanup** — dead `.hero-bento`/`.hero-stat-*` ≤620 rules removed; grep clean.
12. **Cross-breakpoint** resize across 620: palette↔inline terminal swap, reflow without console errors; `prefers-reduced-motion` still neutralizes animations.

## File anchors
- `src/styles/responsive.css` — all 8 CSS blocks in the ≤620 phase; delete dead bento rules (#3).
- `src/components/islands/WritingWindow.tsx` — `readDense` for compact `.post-read` (#5).
- `src/styles/styles.css`, tokens, fonts — untouched (desktop immunity / theme preservation).
