import config from '../../blog.config';

interface NavItem {
  key:   string;
  label: string;
  href:  string;
}

/* the five workspaces of the top panel — 1..5 keyboard shortcuts */
export const NAV: NavItem[] = [
  { key: 'main',       label: 'MAIN',       href: '/'            },
  { key: 'posts',      label: 'POSTS',      href: '/posts/'      },
  { key: 'categories', label: 'CATEGORIES', href: '/categories/' },
  { key: 'tags',       label: 'TAGS',       href: '/tags/'       },
  { key: 'about',      label: 'ABOUT',      href: '/about/'      },
];

/* social links live in blog.config.ts — edit there, never here */
export const SOCIALS = config.socials;
