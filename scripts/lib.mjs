/* Shared helpers for scripts/post.mjs. Plain Node, no dependencies.
 * A post is a FOLDER: <slug>/index.md + its images. The header is written in
 * one canonical shape (key order + JSON-quoted values) that
 * src/content.config.ts validates. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const POSTS = join(ROOT, 'src', 'content', 'posts');
export const PUBLIC = join(ROOT, 'public');

/* the scaffold's placeholder — a post that still contains it cannot be published */
export const TODO = 'TODO: viết bài ở đây.';

export const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

/* ---- tiny CLI parsing: positional args + --flags ---- */
export function parseArgs(argv) {
  const pos = [], opts = {};
  for (const a of argv) a.startsWith('--') ? (opts[a.slice(2)] = true) : pos.push(a);
  return { pos, opts };
}

export const splitTags = s => (s ?? '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

/* "Ghi chép Kafka!" → "ghi-chep-kafka" */
export function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   /* strip diacritics */
    .replace(/đ/g, 'd')                                  /* Vietnamese đ has no NFD split */
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* the author's LOCAL calendar day (toISOString would give UTC — yesterday,
   for an evening post in UTC+7) */
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* YYYY-MM-DD that is a real calendar day */
export function isDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/* next free id = highest id in any post + 1 */
export function nextId() {
  if (!existsSync(POSTS)) return 1;
  return readdirSync(POSTS, { withFileTypes: true }).filter(e => e.isDirectory()).reduce((max, e) => {
    const file = join(POSTS, e.name, 'index.md');
    const m = existsSync(file) && readFileSync(file, 'utf8').match(/^id:\s*(\d+)/m);
    return m ? Math.max(max, Number(m[1])) : max;
  }, 0) + 1;
}

/* ---- header: a small YAML subset (key: value, [a, b], - item lists) ---- */
function parseValue(raw) {
  const v = raw.trim();
  if (v === '') return '';
  try { return JSON.parse(v); } catch { /* not JSON — fall through */ }
  if (v.startsWith('[') && v.endsWith(']')) {
    return v.slice(1, -1).split(',').map(x => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
  }
  if (v === 'true' || v === 'false') return v === 'true';
  return v.replace(/^['"]|['"]$/g, '');
}

/* → { data, body }. A file without a --- header gets empty data. */
export function parsePost(text) {
  const src = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  if (!m) return { data: {}, body: src };
  const data = {};
  let listKey = null;
  for (const line of m[1].split('\n')) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) { data[listKey].push(parseValue(item[1])); continue; }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    listKey = null;
    if (kv[2].trim() === '') { data[kv[1]] = []; listKey = kv[1]; }
    else data[kv[1]] = parseValue(kv[2]);
  }
  return { data, body: src.slice(m[0].length) };
}

/* the canonical header, in schema order; optional fields only when set */
export function formatPost(data, body) {
  const q = v => JSON.stringify(v);
  const lines = [
    `id:      ${data.id}`,
    `title:   ${q(data.title)}`,
    `excerpt: ${q(data.excerpt)}`,
    `iso:     ${q(data.iso)}`,
    `tags:    [${data.tags.map(q).join(', ')}]`,
    ...(data.preview ? [`preview: ${q(data.preview)}`] : []),
    ...(data.pinned ? ['pinned:  true'] : []),
    ...(data.draft ? ['draft:   true'] : []),
  ];
  return `---\n${lines.join('\n')}\n---\n\n${body.replace(/^\n+/, '')}`;
}

/* every standalone image line of a body: { src, line } — the only image form
   the renderer draws (one image per line, optional "caption") */
export function imageRefs(body) {
  return [...body.matchAll(/^[ \t]*!\[[^\]]*\]\((\S+)(?:[ \t]+"[^"]*")?\)[ \t]*$/gm)]
    .map(m => ({ src: m[1], line: body.slice(0, m.index).split('\n').length }));
}

/* the categories of src/data/topics.ts, in order: [{ title, tags }] (read as
   text — the scripts stay dependency-free) */
export function categories() {
  const src = readFileSync(join(ROOT, 'src', 'data', 'topics.ts'), 'utf8');
  return [...src.matchAll(/title:\s*'([^']*)'[^}]*?tags:\s*\[([^\]]*)\]/g)].map(m => ({
    title: m[1],
    tags: m[2].split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean),
  }));
}

/* the same rule as topicOf(): the first category owning any of the tags,
   else the last category */
export function categoryOf(tags, cats = categories()) {
  return cats.find(c => tags.some(t => c.tags.includes(t))) ?? cats[cats.length - 1];
}
