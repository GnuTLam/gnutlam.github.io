import { useState, useEffect, useMemo, useRef } from 'react';
import { TOPICS, topicOf } from '../../data/topics';
import { TUX, TUX_PAL, pxSvg } from '../../data/pixel';
import { SITE, OS_FULL, PROMPT } from '../../data/site';
import { HOME, em } from '../../data/content';
import type { PostData } from '../../types';

const RECENT = 6;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86_400_000);
}

/* ---- window shell — ✕ is a link only when close has a real destination ---- */
interface WinProps {
  title: React.ReactNode;
  focus?: boolean;
  status?: React.ReactNode;
  className?: string;
  closeHref?: string;
  closeTitle?: string;
  children: React.ReactNode;
}
function Win({ title, focus, status, className, closeHref, closeTitle, children }: WinProps) {
  return (
    <section className={`win${focus ? ' focus' : ''} ${className ?? ''}`}>
      <header className="win-tbar">
        <span className="win-tbar-t">{title}</span>
        <span className="win-dots">
          <i aria-hidden></i><i aria-hidden></i>
          {closeHref
            ? <a href={closeHref} title={closeTitle} aria-label={closeTitle}></a>
            : <i aria-hidden></i>}
        </span>
      </header>
      {children}
      {status && <div className="win-status">{status}</div>}
    </section>
  );
}

function PostRow({ post }: { post: PostData }) {
  const tp = topicOf(post.tags);
  return (
    <a className="p-row" href={`/posts/${post.slug}/`} style={{ '--tc': tp.tone } as React.CSSProperties}>
      <time dateTime={post.iso}>{post.iso}</time>
      <span className="p-tt">
        <span className="p-title">
          {post.pinned && <span className="pin" title="Pinned">★</span>}
          {post.title}
        </span>
        <span className="p-sub">{post.excerpt}</span>
      </span>
      <span className="chip p-cat">{tp.title.toLowerCase()}</span>
      <span className="p-read">{post.read.toLowerCase()}</span>
    </a>
  );
}

interface Props { posts: PostData[]; }

export default function HomeShell({ posts }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const latest = posts[0];
  const silentDays = latest ? daysSince(latest.iso) : 0;
  const tagCount = useMemo(() => new Set(posts.flatMap(p => p.tags)).size, [posts]);

  /* "/" focuses the finder; Escape blurs (Ctrl+K belongs to rofi) */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = document.activeElement === inputRef.current;
      if (!typing && e.key === '/' && !(e.ctrlKey || e.metaKey || e.altKey)) {
        const el = document.activeElement;
        if (el && /^(input|textarea|select)$/i.test(el.tagName)) return;
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && typing) inputRef.current?.blur();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const needle = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const hit = posts.filter(p =>
      !needle ||
      p.title.toLowerCase().includes(needle) ||
      p.excerpt.toLowerCase().includes(needle) ||
      p.tags.some(t => t.toLowerCase().includes(needle))
    );
    return [...hit].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false));
  }, [posts, needle]);
  const visible = needle ? filtered : filtered.slice(0, RECENT);

  /* one post = one category (topicOf), so the bars sum to the post count */
  const cats = useMemo(
    () => TOPICS.map(t => ({ ...t, n: posts.filter(p => topicOf(p.tags).key === t.key).length }))
      .filter(t => t.n > 0),
    [posts]
  );
  const maxCat = Math.max(1, ...cats.map(c => c.n));

  return (
    <div className="hm">
      <div className="hm-main">
        {/* neofetch hero */}
        <Win
          focus
          title={<><b>~</b> — fetch</>}
          className="w-fetch"
          status={<><span className="grow">{PROMPT}:~$ fetch --blog</span><span>0.02s</span></>}
        >
          <div className="win-body">
            <h1 className="nf-title">
              {HOME.title}<br />
              <span className="a">{HOME.titleAccent}</span><span className="caret" aria-hidden></span>
            </h1>
            <p className="nf-lede">
              <b>{SITE.domain}</b>{' '}
              {em(HOME.lede).map((s, i) => s.b ? <b key={i}>{s.t}</b> : <span key={i}>{s.t}</span>)}
            </p>
            <div className="nf">
              <span className="nf-art" dangerouslySetInnerHTML={{ __html: pxSvg(TUX, TUX_PAL, 120) }} />
              <div className="nf-info">
                <p className="nf-head"><b>{SITE.user}</b><span className="h">@</span><b>{SITE.host}</b></p>
                <p className="nf-rule">-----------</p>
                <div className="nf-rows">
                  <div className="r"><span className="k">OS</span><span className="v">{OS_FULL} x86_64</span></div>
                  <div className="r"><span className="k">Kernel</span><span className="v">{SITE.kernel}</span></div>
                  <div className="r"><span className="k">Uptime</span><span className="v">writing since {SITE.since}</span></div>
                  <div className="r"><span className="k">Shell</span><span className="v">{HOME.shell}</span></div>
                  <div className="r"><span className="k">Packages</span><span className="v"><a href="/posts/">{posts.length} posts</a> · <a href="/categories/">{cats.length} categories</a> · <a href="/tags/">{tagCount} tags</a></span></div>
                  <div className="r"><span className="k">Editor</span><span className="v">{HOME.editor}</span></div>
                </div>
              </div>
            </div>
            <div className="nf-cta">
              {latest && <a className="btn pri sm" href={`/posts/${latest.slug}/`}>$ open --latest</a>}
              <a className="btn sm" href="/about/">$ whoami</a>
            </div>
          </div>
        </Win>
      </div>

      <div className="hm-side">
        {/* monitor — btop: category distribution (counts live in fetch) */}
        <Win
          title={<><b>/proc</b> — btop</>}
          className="w-mon"
          status={<><span className="grow">state: <b>online</b> · load 0.03</span><span>{silentDays}d idle</span></>}
        >
          <div className="win-body">
            <div className="mon-lbl" style={{ marginTop: 0 }}><span>categories — load per core</span><a href="/categories/" style={{ color: 'var(--dim)' }}>view all →</a></div>
            <div className="cbars">
              {cats.map(c => (
                <a key={c.key} className="cbar" href={`/categories/${c.key}/`} style={{ '--tc': c.tone } as React.CSSProperties}>
                  <span className="nm">{c.title.toLowerCase()}</span>
                  <span className="tr" aria-hidden>
                    {Array.from({ length: 10 }, (_, i) => (
                      <i key={i} className={i < Math.round((c.n / maxCat) * 10) ? 'on' : ''}></i>
                    ))}
                  </span>
                  <span className="n">{c.n}</span>
                </a>
              ))}
            </div>

          </div>
        </Win>

        {/* keys cheat sheet — 4 truthful rows */}
        <Win
          title={<><b>~/.config/sxhkdrc</b> — bat</>}
          className="w-keys"
        >
          <div className="win-body">
            <div className="nf-rows">
              <div className="r"><span className="k">1..5</span><span className="v">switch workspace</span></div>
              <div className="r"><span className="k">ctrl+k</span><span className="v">launcher (rofi)</span></div>
              <div className="r"><span className="k">/</span><span className="v">filter current list</span></div>
              <div className="r"><span className="k">[ ]</span><span className="v">prev / next — reader</span></div>
            </div>
          </div>
        </Win>
      </div>

      {/* recent posts / finder — full-width bottom tile */}
      <Win
        title={<><b>~/posts</b> — fzf</>}
        className="w-recent"
        status={
          <>
            <span className="grow">
              {needle
                ? <><b>{filtered.length}</b>/{posts.length} match{filtered.length === 1 ? '' : 'es'}</>
                : <>showing <b>{visible.length}</b> most recent of <b>{posts.length}</b></>}
            </span>
            <span>last write: {latest?.iso ?? '--'}</span>
          </>
        }
      >
        <div className="fzf-bar" role="search">
          <b aria-hidden>&gt;</b>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="filter posts by title, tag, or category…"
            spellCheck={false}
            autoComplete="off"
            aria-label="Search posts"
          />
          <kbd>/</kbd>
        </div>
        {visible.length > 0 ? (
          <div className="p-list">
            {visible.map(p => <PostRow key={p.id} post={p} />)}
            {!needle && posts.length > RECENT && (
              <a className="p-more" href="/posts/">open all {posts.length} posts by year ↵</a>
            )}
          </div>
        ) : (
          <div className="p-empty">
            <span>
              &gt; <b>{query}</b><br />
              [fzf] nothing matched — try another term or clear the search.
            </span>
          </div>
        )}
      </Win>
    </div>
  );
}
