import { useState, useEffect, useMemo, useRef } from 'react';
import { topicOf, countByTopic } from '../../data/topics';
import { EMPTY_SKULL } from '../../data/empty';
import type { PostData } from '../../types';

/* a post plus the first lines of its body, for the preview pane */
type PostPeek = PostData & { peek: string[]; more: number };

interface Props { posts: PostPeek[]; }

const PAGE = 5;                       /* posts per page, less-style pager — one full screen */

export default function PostsShell({ posts }: Props) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [sel, setSel] = useState(0);
  const [page, setPage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* counted the same way the filter cuts (topicOf) — counts match results */
  const cats = useMemo(() => countByTopic(posts), [posts]);

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

  /* the list never shrinks under FIVE rows: a short page or filter leaves
     room at the bottom. Rows wrap to any height on narrow screens, so the
     reserve is measured — a full page's real height, else five average
     rows until a full page has been seen — and redone when the width (or
     the webfont) changes. ≥1141px the CSS reserve is the SSR fallback. */
  const fit = useRef({ w: 0, h: 0, exact: false, pgr: 37 });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const remeasure = () => { fit.current.w = -1; setTick(t => t + 1); };
    /* width only — the min-height this sets must not re-trigger it */
    const ro = new ResizeObserver(() => { if (list.clientWidth !== fit.current.w) remeasure(); });
    ro.observe(list);
    document.fonts?.ready.then(remeasure);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const f = fit.current;
    if (f.w !== list.clientWidth) Object.assign(f, { w: list.clientWidth, h: 0, exact: false });
    const rows = Array.from(list.querySelectorAll<HTMLElement>('.p-row'));
    if (rows.length === PAGE || (rows.length > 0 && !f.exact)) {
      list.style.minHeight = '';
      const natural = list.getBoundingClientRect().height;   /* rows + pager + padding, as rendered */
      if (rows.length === PAGE) Object.assign(f, { h: natural, exact: true });
      else {
        /* no full page seen yet: add the missing rows at this page's average */
        const top = rows[0].getBoundingClientRect().top;
        const bottom = rows[rows.length - 1].getBoundingClientRect().bottom;
        const gap = 8;
        const avg = (bottom - top - gap * (rows.length - 1)) / rows.length;
        const pgr = list.querySelector('.pgr') ? 0 : f.pgr;
        f.h = Math.max(f.h, natural + (avg + gap) * (PAGE - rows.length) + pgr);
      }
    }
    if (f.h > 0) list.style.minHeight = `${f.h}px`;
  }, [page, filtered, tick]);

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
           (chips, preview links) — it must activate, not navigate.
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
        <span className="win-tbar-t"><b>~/posts</b></span>
        <div className="win-status">
          <span role="status">
            <b>{filtered.length}</b>/{posts.length} post(s)
            {cat && <> · category: <b>{cat}</b></>}
          </span>
          <span className="kbd-hint">↑↓/jk select · <span className="mono">↵</span> open</span>
        </div>
        <span className="win-app">fzf<span className="pv-only"> --preview</span> | less</span>
      </header>

      <div className="ph">
        <h1 className="ph-title">POST <span className="nowrap">INDEX<span className="caret" aria-hidden /></span></h1>
        <p className="ph-sub">
          Newest first — deep‑dives, post‑mortems, and the occasional manifesto.
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
            <span className="mono">✕</span> clear
          </button>
        )}
      </div>

      <div className="pd">
        <div className="pd-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="p-empty">
              <span className="p-empty-ico" aria-hidden dangerouslySetInnerHTML={{ __html: EMPTY_SKULL }} />
              fzf: no match for '<b>{query}</b>'
            </div>
          )}
          {filtered.slice(page * PAGE, (page + 1) * PAGE).map((p, pi) => {
            const i = page * PAGE + pi;   /* global index into `filtered` */
            const t = topicOf(p.tags);
            return (
              <a
                key={p.id}
                className={`p-row${i === sel ? ' sel' : ''}`}
                data-i={i}
                href={`/posts/${p.slug}/`}
                style={{ '--tc': t.tone } as React.CSSProperties}
                aria-current={i === sel ? 'true' : undefined}
                onMouseMove={() => { if (sel !== i) setSel(i); }}
                onFocus={() => setSel(i)}
              >
                <time dateTime={p.iso}>{p.iso}</time>
                <span className="p-tt">
                  <span className="p-title">
                    {p.pinned && <span className="pin" title="Pinned">★ </span>}
                    {p.title}
                  </span>
                  <span className="p-sub">{p.excerpt}</span>
                </span>
                <span className="p-cat">{t.title.toLowerCase()}</span>
                <span className="p-read">{p.read.toLowerCase()}</span>
              </a>
            );
          })}
          {pages > 1 && (
            <nav className="pgr" aria-label="Pages">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => { setPage(page - 1); setSel((page - 1) * PAGE); }}
              >:prev</button>
              <span className="pgr-lb" role="status">
                -- page {page + 1}/{pages} (posts {page * PAGE + 1}–{Math.min((page + 1) * PAGE, filtered.length)} of {filtered.length}) --
              </span>
              <button
                type="button"
                disabled={page >= pages - 1}
                onClick={() => { setPage(page + 1); setSel((page + 1) * PAGE); }}
              >:next</button>
            </nav>
          )}
        </div>

        <aside className="pv" aria-label="Post preview">
          {selPost && tp ? (
            <div key={selPost.slug} className="pv-in" style={{ '--tc': tp.tone } as React.CSSProperties}>
              <h2 className="pv-title">{selPost.title}</h2>
              {selPost.peek.length > 0 && (
                <div className="pv-peek">
                  <div className="pv-bar"><b>bat</b><span className="f">posts/{selPost.slug}.md</span></div>
                  <div className="pv-body">
                    {selPost.peek.map((ln, i) => (
                      <div key={i} className="pv-ln">
                        <span className="n" aria-hidden>{i + 1}</span>
                        <span className="t">{ln}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pv-eof" aria-hidden>
                    ~{selPost.more > 0 ? ` +${selPost.more} more paragraph${selPost.more === 1 ? '' : 's'}` : ''}
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
              <a className="btn pri sm pv-open" href={`/posts/${selPost.slug}/`}>
                $ open
              </a>
            </div>
          ) : (
            <div className="pv-empty">~</div>
          )}
        </aside>
      </div>

    </section>
  );
}
