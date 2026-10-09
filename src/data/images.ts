/* Images that live beside a post (src/content/posts/<slug>/**) are bundled by
   Vite: hashed, cache-friendly URLs in the build, plain URLs in dev. A post
   references them RELATIVELY — `![Diagram](images/flow.png "Caption")` — so the
   same file previews in any markdown editor; before the reader renders, those
   paths are swapped for the bundled URLs. Server-only (import.meta.glob). */

const FILES = import.meta.glob<string>(
  '/src/content/posts/*/**/*.{png,jpg,jpeg,gif,webp,avif,svg,PNG,JPG,JPEG,GIF,WEBP,AVIF,SVG}',
  { eager: true, query: '?url', import: 'default' },
);

/* a standalone image line — the only image form the renderer draws */
const IMAGE_LINE = /^([ \t]*!\[[^\]]*\]\()(\S+)((?:[ \t]+"[^"]*")?\)[ \t]*)$/gm;   /* [ \t], not \s: never span lines */
const IMAGE_FILE = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

/* the post body with every relative image path replaced by its bundled URL,
   plus the first image's URL (the post's share image) */
export function resolveImages(markdown: string, slug: string): { body: string; cover: string | null } {
  let cover: string | null = null;
  const body = markdown.replace(IMAGE_LINE, (line, pre: string, src: string, post: string) => {
    if (/^([a-z]+:)?\/\//i.test(src) || src.startsWith('/')) {      /* remote, or public/ */
      if (IMAGE_FILE.test(src)) cover ??= src;
      return line;
    }
    if (!IMAGE_FILE.test(src)) return line;                           /* a drop-slot placeholder */
    const rel = decodeURI(src).replace(/^\.\//, '');
    const url = FILES[`/src/content/posts/${slug}/${rel}`];
    if (!url) throw new Error(`posts/${slug}/index.md: image "${src}" not found next to the post`);
    cover ??= url;
    /* the #fragment carries the author's file name to the image frame's title
       bar (the bundled name is hashed); browsers never fetch a fragment */
    return `${pre}${url}#${encodeURIComponent(rel.split('/').pop() ?? rel)}${post}`;
  });
  return { body, cover };
}
