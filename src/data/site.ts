/* LAM/OS identity — the single source of truth for every name, version,
   prompt, and <title> on the site. Change a value here and every page,
   window title, status bar, and meta tag follows.

   Naming conventions enforced across ALL pages (reuse these verbatim):
   - window title = "<b>path</b> — app", where path is ALWAYS a real
     filesystem path: workspace windows mirror the URL ("/" → ~,
     "/posts/" → ~/posts, "/categories/rust/" → ~/categories/rust);
     app windows use the path the app actually reads (/proc — btop,
     ~/.config/sxhkdrc — bat, /dev/pts/0 — zsh, ~/posts/<slug>.md — nvim)
   - the bold path in a title bar is always accent-colored; focus is
     signalled by the window border, never by the title color
   - every workspace opens with one pixel <h1 class="ph-title"> whose
     trailing segment is accent (<span class="a">): POST INDEX,
     CATEGORIES, TAG INDEX, WHOAMI; detail pages tint with the category
     tone instead
   - no breadcrumbs inside windows — the title bar already carries the
     path (the nautilus address bar is app chrome, not a breadcrumb)
   - every subpage <title> is built with pageTitle() */

export const SITE = {
  domain:   'lam.dev',                /* brand + <title> suffix           */
  user:     'lam',
  host:     'lamos',
  osName:   'LAM/OS',
  osVer:    '7.4',
  osFlavor: 'linux edition',
  kernel:   'astro-6.4-static',       /* matches the real astro major     */
  since:    2021,                     /* first post / © start year        */
  tagline:  'IT Field Notes on LAM/OS',
  description:
    'An information technology field journal — systems, networks, infrastructure, and code, served from a riced Linux desktop.',
  url:      'https://lamdev.github.io/',   /* fallback when astro.site unset */
};

/* derived strings — compose once, import everywhere */
export const OS_FULL  = `${SITE.osName} ${SITE.osVer} (${SITE.osFlavor})`;
export const OS_SHORT = `${SITE.osName} v${SITE.osVer}`;
export const PROMPT   = `${SITE.user}@${SITE.host}`;

/* "<page> — <section> — lam.dev" — the one subpage title pattern */
export const pageTitle = (...crumbs: string[]) => [...crumbs, SITE.domain].join(' — ');
