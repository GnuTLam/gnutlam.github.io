#!/usr/bin/env node
/* One command for a post's whole life: create, preview, publish, update.
 *
 *   npm run post -- <post folder>            e.g.  npm run post -- D:/blog/kafka-notes
 *
 * A post is a FOLDER — wherever you like — holding index.md and its images:
 *
 *   kafka-notes/            the folder name becomes the URL: /posts/kafka-notes/
 *   ├── index.md            the post; images are referenced relatively:
 *   └── images/flow.png       ![Flow](images/flow.png "Caption")
 *
 *   folder missing  → creates it (index.md + images/), asks for the header
 *   folder exists   → asks again (Enter keeps each value), checks the post and
 *                     its images, then: preview (draft copy for `npm run dev`)
 *                     or publish (build → commit only this post → push)
 *
 * The blog keeps an exact MIRROR of the folder in src/content/posts/<slug>/:
 * images you add, remove or rename follow on the next run. If the build
 * fails, the blog copy is restored as it was.
 *
 * Flags (skip the questions): --yes (accept every current value),
 * --preview, --publish, --no-push.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, statSync, readdirSync, mkdtempSync } from 'node:fs';
import { join, resolve, relative, basename, dirname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import readline from 'node:readline';
import {
  ROOT, POSTS, PUBLIC, TODO, IMAGE_EXT,
  parseArgs, splitTags, slugify, today, isDate, nextId, parsePost, formatPost, imageRefs, categories, categoryOf,
} from './lib.mjs';

const { pos, opts } = parseArgs(process.argv.slice(2));
const say = (s = '') => console.log(s);
const fail = msg => { console.error(`\n✗ ${msg}\n`); process.exit(1); };
/* a copy-pasteable re-run command (a path with spaces needs quotes) */
const again = `npm run post -- ${/\s/.test(pos[0] ?? '') ? `"${pos[0]}"` : pos[0]}`;
if (!pos[0]) fail('cách dùng: npm run post -- <thư mục bài>   (vd: npm run post -- D:/blog/kafka-notes)');

/* ---- questions: works typed in a terminal and piped from a file ---------- */
const rl = readline.createInterface({ input: process.stdin, terminal: false });
const queue = []; let waiting = null; let closed = false;
rl.on('line', l => (waiting ? (waiting(l), (waiting = null)) : queue.push(l)));
rl.on('close', () => { closed = true; if (waiting) waiting(null); });
const nextLine = () => queue.length ? Promise.resolve(queue.shift())
  : closed ? Promise.resolve(null) : new Promise(r => (waiting = r));
async function ask(label, def = '') {
  if (opts.yes) return def;
  process.stdout.write(`? ${label}${def ? ` [${def}]` : ''}: `);
  const line = await nextLine();
  if (line === null) fail('không còn dữ liệu nhập (dùng --yes để giữ giá trị hiện tại)');
  if (!process.stdin.isTTY) say(line);
  return line.trim() || def;
}
async function askUntil(label, def, ok, hint) {
  for (;;) {
    const v = await ask(label, def);
    if (ok(v)) return v;
    if (opts.yes) fail(`${label}: "${v}" — ${hint}`);
    say(`  ${hint}`);
  }
}
const done = code => { rl.close(); process.exit(code); };

/* ---- 1. the folder ------------------------------------------------------- */
const dir = resolve(process.cwd(), pos[0]);
const slug = slugify(basename(dir));
if (!slug) fail('tên thư mục cần có chữ cái hoặc chữ số — nó sẽ thành đường dẫn /posts/<tên>/');
const target = join(POSTS, slug);
const inBlog = resolve(dir) === resolve(target);            /* the folder IS the blog copy */
/* the post file: index.md, or the folder's only .md file (a note written elsewhere) */
const mds = existsSync(dir) ? readdirSync(dir).filter(f => f.toLowerCase().endsWith('.md')) : [];
const index = join(dir, mds.includes('index.md') || mds.length !== 1 ? 'index.md' : mds[0]);
if (mds.length > 1 && !mds.includes('index.md')) fail(`thư mục có ${mds.length} file .md — đổi tên file bài thành index.md`);
const creating = !existsSync(index);

const { data, body: oldBody } = creating ? { data: {}, body: '' } : parsePost(readFileSync(index, 'utf8'));
const blogIndex = join(target, 'index.md');
if (!inBlog && existsSync(blogIndex)) {
  const theirs = parsePost(readFileSync(blogIndex, 'utf8')).data;
  if (theirs.id !== data.id) fail(`blog đã có một bài khác tên "${slug}" (src/content/posts/${slug}/) — đổi tên thư mục`);
}
const tracked = spawnSync('git', ['ls-files', '--error-unmatch', relative(ROOT, blogIndex).split(sep).join('/')], { cwd: ROOT }).status === 0;

say(`\n  ${creating ? 'Bài mới' : tracked ? 'Cập nhật bài đã đăng' : 'Bài chưa đăng'}: /posts/${slug}/`);
say(`  thư mục: ${dir}${basename(dir) !== slug ? `  (đường dẫn dùng "${slug}")` : ''}\n`);

/* ---- 2. the header — ask, current values as defaults -------------------- */
const cats = categories();
const title = await askUntil('Tiêu đề', data.title ?? '', v => v.length > 0, 'cần có tiêu đề');
const excerpt = await askUntil('Mô tả một dòng (hiện ở mọi danh sách)', data.excerpt ?? '', v => v.length > 0, 'cần một câu mô tả');
say(`  category ↔ tag:  ${cats.map(c => `${c.title}: ${c.tags.join(' ')}`).join('  ·  ')}`);
const tags = splitTags(await askUntil('Tags, cách nhau bởi dấu phẩy', (data.tags ?? []).join(', '), v => splitTags(v).length > 0, 'cần ít nhất một tag'));
const homeless = tags.filter(t => !cats.some(c => c.tags.includes(t)));
say(`  → category ${categoryOf(tags, cats)?.title ?? '?'}${homeless.length ? `   (tag chưa thuộc category nào: ${homeless.join(', ')})` : ''}`);
const iso = await askUntil('Ngày đăng YYYY-MM-DD (Enter = giữ nguyên / hôm nay)', isDate(data.iso ?? '') ? data.iso : today(), isDate, 'ngày dạng YYYY-MM-DD, vd 2026-10-09');
const pinned = /^(y|yes|c|có|co)$/i.test(await ask('Ghim lên đầu danh sách? (y/n)', data.pinned ? 'y' : 'n'));
const preview = (await ask('Chữ trên banner (Enter = tag đầu tiên)', data.preview ?? '')).toUpperCase();
const header = { id: Number.isInteger(data.id) ? data.id : nextId(), title, excerpt, iso, tags, preview, pinned };

/* ---- 3. a new folder: write the scaffold and stop ----------------------- */
if (creating) {
  mkdirSync(join(dir, 'images'), { recursive: true });
  writeFileSync(index, formatPost(header, `${TODO}\n\n## Phần đầu tiên\n\nNội dung…\n`));
  say(`\n✓ Đã tạo ${index}`);
  say('  Viết bài vào index.md. Ảnh bỏ vào images/ rồi chèn trên một dòng riêng:');
  say('    ![Mô tả ảnh](images/ten-anh.png "Chú thích (tuỳ chọn)")');
  say(`  Xong thì chạy lại:  ${again}\n`);
  done(0);
}
/* the folder stays the source of truth: the answers go back into its index.md */
writeFileSync(index, formatPost(header, oldBody));
const body = oldBody;

/* ---- 4. check the body and its images ----------------------------------- */
const unfinished = !body.trim() || body.includes(TODO);
const local = [], fromPublic = [], problems = [];
for (const { src, line } of imageRefs(formatPost(header, body))) {   /* scan the file as written: real line numbers */
  if (/^([a-z]+:)?\/\//i.test(src) || !IMAGE_EXT.test(src)) continue;  /* remote, or a placeholder */
  if (src.startsWith('/')) {                                              /* a site-wide file in public/ */
    const file = join(PUBLIC, decodeURI(src));
    existsSync(file) ? fromPublic.push(file) : problems.push(`dòng ${line}: ${src} — không có trong public/`);
    continue;
  }
  const file = resolve(dir, decodeURI(src));
  if (!file.startsWith(dir + sep)) { problems.push(`dòng ${line}: ${src} — ảnh phải nằm trong thư mục bài`); continue; }
  if (!existsSync(file)) { problems.push(`dòng ${line}: ${src} — không tìm thấy file`); continue; }
  local.push(file);
  const mb = statSync(file).size / 1048576;
  if (mb > 2) say(`  ! ${src} nặng ${mb.toFixed(1)} MB — nên nén lại cho trang tải nhanh`);
}
if (problems.length) fail(`ảnh lỗi:\n  ${problems.join('\n  ')}`);
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);
const unused = walk(dir).filter(f => IMAGE_EXT.test(f) && !local.includes(f));
say(`\n  ${local.length} ảnh trong bài${unused.length ? ` · ${unused.length} ảnh không dùng${inBlog ? '' : ' (không đưa lên)'}: ${unused.map(f => relative(dir, f)).join(', ')}` : ''}`);
if (unfinished) say('  ! bài còn đoạn mẫu "TODO" — chỉ xem thử được, chưa đăng được');

/* ---- 5. preview or publish ---------------------------------------------- */
let action = opts.publish ? 'publish' : opts.preview ? 'preview' : null;
if (!action) {
  const a = await ask(`Làm gì tiếp? 1 = xem thử${unfinished ? '' : ', 2 = đăng lên site'}, 3 = thoát`, unfinished ? '1' : '2');
  action = a === '1' ? 'preview' : a === '2' && !unfinished ? 'publish' : 'quit';
}
if (action === 'quit') { say('\nĐã lưu thông tin vào index.md. Không đồng bộ gì.\n'); done(0); }
if (action === 'publish' && unfinished) fail('bài còn đoạn mẫu "TODO: viết bài ở đây." — viết xong rồi đăng');

/* mirror the folder into the blog: index.md + the images it uses, nothing else */
const backup = !inBlog && existsSync(target) ? mkdtempSync(join(tmpdir(), 'post-')) : null;
if (backup) cpSync(target, backup, { recursive: true });
const restore = () => {
  if (inBlog) { writeFileSync(index, formatPost(header, body)); return; }
  rmSync(target, { recursive: true, force: true });
  if (backup) cpSync(backup, target, { recursive: true });
};
if (!inBlog) {
  rmSync(target, { recursive: true, force: true });
  for (const f of local) { const to = join(target, relative(dir, f)); mkdirSync(dirname(to), { recursive: true }); cpSync(f, to); }
}
mkdirSync(target, { recursive: true });
writeFileSync(blogIndex, formatPost({ ...header, draft: action === 'preview' }, body));

if (action === 'preview') {
  say(`\n✓ Đã chép vào blog dạng nháp (chưa commit). Xem thử:`);
  say('    npm run dev');
  say(`    http://localhost:4321/posts/${slug}/`);
  say(`  Ưng ý thì chạy lại:  ${again}  → chọn 2\n`);
  done(0);
}

say('\n→ build thử toàn bộ site…');
const build = spawnSync('npm run build', { cwd: ROOT, encoding: 'utf8', shell: true });
if (build.status !== 0) {
  restore();
  console.error((build.stdout ?? '') + (build.stderr ?? ''));
  fail('build lỗi — blog đã được trả về như trước. Sửa lỗi phía trên rồi chạy lại.');
}
say('→ build OK');

/* commit only this post's folder (and any public/ images it uses), then push */
const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' });
if (git('rev-parse', '--is-inside-work-tree').status !== 0) { say(`\n✓ Đã đăng vào src/content/posts/${slug}/ (chưa có git).\n`); done(0); }
const paths = [target, ...fromPublic].map(p => relative(ROOT, p).split(sep).join('/'));
git('add', '-A', '--', ...paths);
const message = `${tracked ? 'post(update)' : 'post'}: ${title}`;
const commit = git('commit', '-m', message, '--', ...paths);
if (commit.status !== 0) {
  if (/nothing to commit|no changes added/i.test(commit.stdout + commit.stderr)) say('→ không có thay đổi mới để commit');
  else fail(`git commit lỗi:\n${commit.stdout}${commit.stderr}`);
} else say(`→ commit: "${message}"`);

if (opts['no-push']) { say('\n✓ Xong (chưa push). Đẩy lên khi sẵn sàng: git push\n'); done(0); }
if (!git('remote').stdout.trim()) { say('\n✓ Đã commit. Repo chưa nối GitHub nên chưa push — xem README mục Deploy.\n'); done(0); }
const upstream = git('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}').status === 0;
say('→ push lên GitHub…');
const push = upstream ? git('push') : git('push', '-u', 'origin', git('rev-parse', '--abbrev-ref', 'HEAD').stdout.trim());
if (push.status !== 0) fail(`push lỗi (commit vẫn còn — chạy lại \`git push\` sau):\n${push.stderr}`);
say(`\n✓ Đã đăng "${title}" — GitHub Actions deploy trong ~1–2 phút: /posts/${slug}/\n`);
done(0);
