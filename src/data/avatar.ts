/* Avatar values come from blog.config.ts (home.avatar, about.avatar):
   'mascot' draws the built-in pixel skeleton, anything else is a root-relative
   path to an image inside public/. Checked at BUILD time so a typo fails the
   build with a clear message instead of shipping a broken image.
   Server-only (node:fs) — call it from .astro frontmatter, never from an island. */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { MASCOT } from './content';

export function checkAvatar(where: 'home' | 'about', value: string): void {
  if (value === MASCOT) return;
  if (!value.startsWith('/') || !existsSync(join(process.cwd(), 'public', value))) {
    throw new Error(
      `blog.config.ts → ${where}.avatar = "${value}": use '${MASCOT}' or the path of an ` +
      `image inside public/, starting with "/" (e.g. '/avatar.png' for public/avatar.png).`,
    );
  }
}
