import { useState, useEffect, useMemo, useRef } from 'react';
import { TOPICS, topicOf } from '../../data/topics';
import type { PostData } from '../../types';

/* a post plus the first lines of its body, for the preview pane */
export type PostPeek = PostData & { peek: string[]; more: number };

interface Props { posts: PostPeek[]; }

const PAGE = 8;                       /* posts per page, less-style pager */

export default function PostsShell({ posts }: Props) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [sel, setSel] = useState(0);
  const [page, setPage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const cats = useMemo(
    () => TOPICS.map(t => ({ ...t, n: posts.filter(p => p.tags.some(tag => t.tags.includes(tag))).length }))
      .filter(t => t.n > 0),
    [posts]
  );

  const needle = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const hit = posts.filter(p => {
      if (cat && topicOf(p.tags).key !== cat) return false;
      return !needle ||
        p.title.toLowerCase().includes(needle) ||
        p.excerpt.toLowerCase().includes(needle) ||
        p.tags.some(t => t.toLowerCase().includes(needle));
    });
    /* pinned floats to the top, then newest first (input is pre-sorted) */
    return [...hit].sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false));
  }, [posts, needle, cat]);

  /* selection follows the filter */
  useEffect(() => { setSel(0); }, [needle, cat]);
  const selPost = filtered[Math.min(sel, filtered.length - 1)] ?? null;

  /* the page follows the selection (j at the bottom flows onto the next
     page, like scrolling in less) — and scrolling happens AFTER render,
     because a page flip re-renders the row j/k is about to target */
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  useEffect(() => {
    if (filtered.length === 0) { setPage(0); return; }
    setPage(Math.floor(Math.min(sel, filtered.length - 1) / PAGE));
  }, [sel, filtered.length]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [sel, page]);

  /* keyboard: / focus · j/k or ↑/↓ move selection · Enter opens */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.isComposing || e.keyCode === 229) return;   /* IME (telex, CJK) */
      const typing = document.activeElement === inputRef.current;
      const inField = document.activeElement &&
        /^(input|textarea|select)$/i.test((document.activeElement as HTMLElement).tagName);
      if (!typing && e.key === '/' && !(e.ctrlKey || e.metaKey || e.altKey)) {
        if (inField) return;
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (e.key === 'Escape' && typing) {
        /* fzf idiom: first Esc cancels the query, second leaves the field */
        if (inputRef.current?.value) setQuery('');
        else inputRef.current?.blur();
        return;
      }
      if (inField && !typing) return;
      const down = e.key === 'ArrowDown' || (!typing && e.key === 'j');
      const up   = e.key === 'ArrowUp'   || (!typing && e.key === 'k');
      if (down || up) {
        e.preventDefault();
        setSel(s => Math.max(0, Math.min(filtered.length - 1, s + (down ? 1 : -1))));
      }
      if (e.key === 'Enter') {
        /* leave Enter alone when a control outside the list owns focus
           (chips, preview links, titlebar) — it must activate, not navigate.
           The pager's buttons live inside the list but must also activate. */
        const ae = document.activeElement as HTMLElement | null;
        if (ae && ae !== document.body && ae !== inputRef.current &&
            (!ae.closest('.pd-list') || ae.closest('.pgr'))) return;
        const target = filtered[Math.min(sel, filtered.length - 1)];
        if (!target) return;
        e.preventDefault();
        const url = `/posts/${target.slug}/`;
        if (e.ctrlKey || e.metaKey) window.open(url, '_blank', 'noopener');
        else location.href = url;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, sel]);

  const tp = selPost ? topicOf(selPost.tags) : null;

  return (
    <section className="win focus" aria-label="All posts">
      <header className="win-tbar">
        <span className="win-tbar-t"><b>~/posts</b> — fzf<span className="pv-only"> --preview</span> | less</span>
        <span className="win-dots">
          <i aria-hidden></i><i aria-hidden></i>
          <a href="/" title="close → main" aria-label="Close and return home"></a>
        </span>
      </header>

      <div className="ph">
        <h1 className="ph-title">POST <span className="a">INDEX</span></h1>
        <p className="ph-sub">
          {posts.length} posts, newest first — deep-dives, post-mortems, and the
          occasional manifesto. Filter below or pick a category.
        </p>
      </div>

      <div className="fzf-bar" role="search">
        <b aria-hidden>&gt;</b>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="filter posts by title, tag, or category…"
          spellCheck={false}
          autoComplete="off"
          aria-label="Filter posts"
        />
        <kbd aria-hidden>/</kbd>
      </div>

      <div className="pd-chips" role="group" aria-label="Filter by category">
        <span>category:</span>
        {cats.map(c => (
          <button
            key={c.key}
            className="pd-chip"
            style={{ '--tc': c.tone } as React.CSSProperties}
            aria-pressed={cat === c.key}
            onClick={() => setCat(cat === c.key ? null : c.key)}
          >
            {c.title.toLowerCase()}<span className="n">{c.n}</span>
          </button>
        ))}
        {cat && (
          <button className="pd-chip" onClick={() => { setCat(null); inputRef.current?.focus(); }}>
            ✕ clear
          </button>
        )}
      </div>

      <div className="pd">
        <div className="pd-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="p-empty">
              &gt; <b>{query}</b><br />
              nothing matched — try another term or clear the filter.
            </div>
          )}
          {filtered.slice(page * PAGE, (page + 1) * PAGE).map((p, pi) => {
            const i = page * PAGE + pi;   /* global index into `filtered` */
            const t = topicOf(p.tags);
            return (
              <a
                key={p.id}
                className={`pc-card${i === sel ? ' sel' : ''}`}
                data-i={i}
                href={`/posts/${p.slug}/`}
                style={{ '--tc': t.tone } as React.CSSProperties}
                aria-current={i === sel ? 'true' : undefined}
                onMouseMove={() => { if (sel !== i) setSel(i); }}
                onFocus={() => setSel(i)}
              >
                <h3 className="pc-title">{p.title}</h3>
                <p className="pc-x">{p.excerpt}</p>
                <div className="pc-meta">
                  <span><span className="g">▤ </span>{p.date}</span>
                  <span className="chip" style={{ '--tc': t.tone } as React.CSSProperties}>{t.title.toLowerCase()}</span>
                  <span><span className="g">◷ </span>{p.read.toLowerCase()}</span>
                  {p.pinned && <span className="pin" title="Pinned">★ pinned</span>}
                </div>
              </a>
            );
          })}
          {pages > 1 && (
            <nav className="pgr" aria-label="Pages">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => { setPage(page - 1); setSel((page - 1) * PAGE); }}
              >← prev</button>
              <span className="pgr-lb" role="status">
                -- page {page + 1}/{pages} (posts {page * PAGE + 1}–{Math.min((page + 1) * PAGE, filtered.length)} of {filtered.length}) --
              </span>
              <button
                type="button"
                disabled={page >= pages - 1}
                onClick={() => { setPage(page + 1); setSel((page + 1) * PAGE); }}
              >next →</button>
            </nav>
          )}
        </div>

        <aside className="pv" aria-label="Post preview">
          <div className="pv-head">
            <span>PREVIEW</span>
            <span className="f">{selPost ? `bat posts/${selPost.slug}.md` : 'bat --style=numbers'}</span>
          </div>
          {selPost && tp ? (
            <div key={selPost.slug} className="pv-in" style={{ '--tc': tp.tone } as React.CSSProperties}>
              <h2 className="pv-title">{selPost.title}</h2>
              <div className="pv-meta">
                <span className="chip" style={{ '--tc': tp.tone } as React.CSSProperties}>{tp.title.toLowerCase()}</span>
                <span>{selPost.date}</span>
                <span>·</span>
                <span>{selPost.read.toLowerCase()}</span>
              </div>
              <p className="pv-x">{selPost.excerpt}</p>
              {selPost.peek.length > 0 && (
                <div className="pv-peek">
                  {selPost.peek.map((ln, i) => (
                    <div key={i} className="pv-ln">
                      <span className="n" aria-hidden>{i + 1}</span>
                      <span className="t">{ln}</span>
                    </div>
                  ))}
                  <div className="pv-eof" aria-hidden>
                    ~ {selPost.more > 0 ? `+${selPost.more} more paragraph${selPost.more === 1 ? '' : 's'} — ` : ''}⏎ open in nvim
                  </div>
                </div>
              )}
              <div className="pv-tags">
                {selPost.tags.map(t => (
                  <a key={t} className="tagchip" href={`/tags/${t}/`} style={{ '--tc': topicOf([t]).tone } as React.CSSProperties}>
                    <b>#{t}</b>
                  </a>
                ))}
              </div>
              <a className="btn pri pv-open" href={`/posts/${selPost.slug}/`}>
                $ nvim {selPost.slug}.md
              </a>
            </div>
          ) : (
            <div className="pv-empty">select a post to preview it here</div>
          )}
        </aside>
      </div>

      <div className="win-status">
        <span className="grow" role="status">
          <b>{filtered.length}</b>/{posts.length} post(s)
          {pages > 1 && <> · page <b>{page + 1}</b>/{pages}</>}
          {cat && <> · category: <b>{cat}</b></>}
        </span>
        <span className="pv-only">{selPost ? `${Math.min(sel, filtered.length - 1) + 1}/${filtered.length}` : '--'}</span>
        <span className="kbd-hint">↑↓/jk select · ↵ open</span>
      </div>
    </section>
  );
}
