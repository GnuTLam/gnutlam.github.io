import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../data/posts';
import { SITE } from '../data/site';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const base = site?.href ?? SITE.url;
  const posts = await getPublishedPosts();

  const items = posts.map(p => {
    const url = `${base}posts/${p.slug}/`;
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.iso + 'T00:00:00Z').toUTCString()}</pubDate>
      <description>${esc(p.excerpt)}</description>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${SITE.domain} — ${SITE.tagline}`)}</title>
    <link>${base}</link>
    <atom:link href="${base}rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(SITE.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
