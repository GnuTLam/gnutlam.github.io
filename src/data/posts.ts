import { getCollection, type CollectionEntry } from 'astro:content';
import type { PostData } from '../types';
import { TOPICS, topicOf } from './topics';
import { readTime } from './words';

/* newest first — the one sort order every listing shares */
export function byNewest(a: PostData, b: PostData): number {
  return a.iso < b.iso ? 1 : -1;
}

/* total reading time, as shown in status bars ("du -h") */
export function readMinutes(posts: PostData[]): number {
  return posts.reduce((n, p) => n + (parseInt(p.read, 10) || 0), 0);
}

/* every tag with its usage count */
export function tagCounts(posts: PostData[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) map.set(t, (map.get(t) ?? 0) + 1);
  return map;
}

/* topicOf, not tag-overlap: every post lives in exactly ONE category.
   Matches newest first; busiest categories first — the categories window
   and each category page must agree on this order. */
export function categoriesWithPosts(posts: PostData[]) {
  return TOPICS
    .map(t => ({ ...t, matches: posts.filter(p => topicOf(p.tags).key === t.key).sort(byNewest) }))
    .filter(t => t.matches.length > 0)
    .sort((a, b) => b.matches.length - a.matches.length);
}

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
    iso:     e.data.iso,
    tags:    e.data.tags,
    read:    readTime(e.body ?? ''),
    preview: e.data.preview ?? e.data.tags[0].toUpperCase(),
    pinned:  e.data.pinned,
    draft:   e.data.draft,
  };
}

/* All published posts, newest first — the one query every page shares. */
export async function getPublishedPosts(): Promise<PostData[]> {
  return (await getCollection('posts'))
    .filter(isPublished)
    .map(toPostData)
    .sort(byNewest);
}
