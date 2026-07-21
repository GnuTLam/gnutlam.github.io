import { getCollection, type CollectionEntry } from 'astro:content';
import type { PostData } from '../types';

/* Drafts stay browsable in dev but never ship in production builds. */
export function isPublished(e: CollectionEntry<'posts'>): boolean {
  return !(import.meta.env.PROD && e.data.draft);
}

export function toPostData(e: CollectionEntry<'posts'>): PostData {
  return {
    id:      e.data.id,
    title:   e.data.title,
    slug:    e.id,
    excerpt: e.data.excerpt,
    date:    e.data.date,
    iso:     e.data.iso,
    tags:    e.data.tags,
    read:    e.data.read,
    preview: e.data.preview,
    pinned:  e.data.pinned,
    draft:   e.data.draft,
  };
}

/* All published posts, newest first — the one query every page shares. */
export async function getPublishedPosts(): Promise<PostData[]> {
  return (await getCollection('posts'))
    .filter(isPublished)
    .map(toPostData)
    .sort((a, b) => (a.iso < b.iso ? 1 : -1));
}
