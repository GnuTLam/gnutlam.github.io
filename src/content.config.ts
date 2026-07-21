import { defineCollection } from 'astro:content';
import { z } from 'zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    id:      z.number(),
    title:   z.string(),
    excerpt: z.string(),
    date:    z.string(),
    iso:     z.string(),
    tags:    z.array(z.string()),
    read:    z.string(),
    preview: z.string(),
    pinned:  z.boolean().optional().default(false),
    draft:   z.boolean().optional().default(false),
  }),
});

export const collections = { posts };
