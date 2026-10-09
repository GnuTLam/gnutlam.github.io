import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

/* One post = one folder: src/content/posts/<slug>/index.md, its images beside
   it (data/images.ts). The folder name is the URL slug. `npm run post` writes
   and checks the header. Reading time is NOT here — it is computed from the
   body (data/words.ts), so it can never go stale. */
const posts = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.split('/')[0],   /* <slug>/index.md → <slug> */
  }),
  schema: z.object({
    id:      z.number(),                                  /* unique, ascending */
    title:   z.string().min(1),
    excerpt: z.string().min(1),                           /* one line, shown in every listing */
    iso:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),     /* publish date, YYYY-MM-DD */
    tags:    z.array(z.string()).min(1),                  /* the first matching tag picks the category (data/topics.ts) */
    preview: z.string().optional(),                       /* banner word; defaults to the first tag */
    pinned:  z.boolean().optional().default(false),
    draft:   z.boolean().optional().default(false),       /* dev-only until published */
  }),
});

export const collections = { posts };
