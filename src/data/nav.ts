export interface NavItem {
  key:   string;
  label: string;
  href:  string;
  tone:  string;
}

/* the five workspaces of the top panel — 1..5 keyboard shortcuts */
export const NAV: NavItem[] = [
  { key: 'main',       label: 'MAIN',       href: '/',            tone: 'ember'  },
  { key: 'posts',      label: 'POSTS',      href: '/posts/',      tone: 'yellow' },
  { key: 'categories', label: 'CATEGORIES', href: '/categories/', tone: 'teal'   },
  { key: 'tags',       label: 'TAGS',       href: '/tags/',       tone: 'blue'   },
  { key: 'about',      label: 'ABOUT',      href: '/about/',      tone: 'green'  },
];

/* href '#' = placeholder until the real profile URL is filled in */
export const SOCIALS = [
  { key: 'github', label: 'GITHUB',   href: '#'        },
  { key: 'x',      label: 'X.COM',    href: '#'        },
  { key: 'rss',    label: 'RSS.XML',  href: '/rss.xml' },
  { key: 'mail',   label: 'MAIL.LOG', href: '#'        },
];
