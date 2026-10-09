/* Word count and reading time, derived from a post's markdown body — never
   typed by hand, so they cannot go stale. Shared by the build (posts.ts) and
   the reader island, so the stat tile and every listing agree. */

/* prose words only (fenced code is not prose), counted as tokens that carry a
   letter or digit so markdown punctuation and list dashes don't inflate it */
export function countWords(markdown: string): number {
  return markdown
    .replace(/^```[\s\S]*?^```/gm, ' ')
    .split(/\s+/)
    .filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}

/* "7 MIN READ" at 200 words a minute, never under one minute */
export function readTime(markdown: string): string {
  return `${Math.max(1, Math.ceil(countWords(markdown) / 200))} MIN READ`;
}
