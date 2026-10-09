/* GNUT/OS identity — every name, version, prompt and <title> on the site is
   composed from ONE place: the values live in blog.config.ts, the derived
   strings below. Change a value there and every page, window tab, status
   bar, and meta tag follows.

   Naming conventions enforced across ALL pages (reuse these verbatim):
   - window tab = "<b>path</b> app" (the i3 title tab on the tile's frame),
     where path is ALWAYS a real filesystem path: workspace windows mirror
     the URL ("/" → ~, "/posts/" → ~/posts, "/categories/rust/" →
     ~/categories/rust); app windows use the path the app actually reads
     (/proc — btop, ~/.config/sxhkdrc — bat, /dev/pts/0 — zsh,
     ~/posts/<slug>.md — nvim)
   - focus is signalled by the tile's frame and its tab: red fill on the
     focused window, the neutral border tone on the rest
   - every workspace opens with one pixel <h1 class="ph-title"> in a single
     ink colour ending in the accent terminal caret (<span class="caret">): POST INDEX,
     CATEGORIES, TAG INDEX, WHOAMI; detail pages keep the same ink and let the
     category tone tint only the tick and the glow
   - no breadcrumbs inside windows — the window tab already carries the
     path (the nautilus address bar is app chrome, not a breadcrumb)
   - every subpage <title> is built with pageTitle()
   - vocabulary registers: prose (ph-sub, ledes) and nav speak human —
     "posts", "categories", "tags"; window CHROME (window tabs, status
     counters, fm labels) speaks its app's language (nautilus: folders/files,
     grep: file(s) matched, neofetch: packages, zsh: writes) — never mix
     the two registers on the same surface
   - localStorage keys and window globals use the "gnut" prefix */

import config from '../../blog.config';

/* all values live in blog.config.ts — edit there, never here */
export const SITE = config.site;

/* derived strings — compose once, import everywhere */
export const OS_FULL  = `${SITE.osName} ${SITE.osVer} (${SITE.osFlavor})`;
export const OS_SHORT = `${SITE.osName} v${SITE.osVer}`;
export const PROMPT   = `${SITE.user}@${SITE.host}`;

/* "<page> — <section> — gnut.dev" — the one subpage title pattern */
export const pageTitle = (...crumbs: string[]) => [...crumbs, SITE.domain].join(' — ');
