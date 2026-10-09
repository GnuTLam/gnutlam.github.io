import { Fragment, useState, useEffect, useMemo, useRef } from 'react';
import Markdown, { mdHeadings } from './MarkdownRenderer';
import { topicOf } from '../../data/topics';
import { countWords } from '../../data/words';
import type { PostData } from '../../types';

interface Props {
  post:     PostData;
  source:   string;
  prevPost: PostData | null;
  nextPost: PostData | null;
  related:  PostData[];
}

export default function ReaderInteractive({ post, source, prevPost, nextPost, related }: Props) {
  const articleRef = useRef<HTMLElement>(null);
  const hashRef    = useRef<string | null>(null);
  /* the committed values are mirrored in refs so the scroll pass can bail
     out without a setState when nothing actually changed */
  const pctRef     = useRef(0);
  const activeRef  = useRef<string | null>(null);
  const [pct, setPct] = useState(0);
  const [activeH,  setActiveH]  = useState<string | null>(null);
  const [shared,   setShared]   = useState(false);
  const [olOpen,   setOlOpen]   = useState(false);

  const headings = useMemo(() => mdHeadings(source), [source]);
  /* the whole markdown tree (code blocks, tables, mermaid) is memoised on the
     source alone — without this, every progress tick re-reconciled the entire
     article, which is the single most expensive thing scrolling could do */
  const body = useMemo(() => <Markdown source={source} />, [source]);

  /* the outline is an ACCORDION, not a full dump: h2 rows are the spine and
     an h3 only appears while the reader is actually inside its section */
  const sections = useMemo(() => {
    const out: { head: typeof headings[number]; kids: typeof headings }[] = [];
    for (const h of headings) {
      if (h.level <= 2 || out.length === 0) out.push({ head: h, kids: [] });
      else out[out.length - 1].kids.push(h);
    }
    return out;
  }, [headings]);

  /* which section owns the heading the reader is on (h2 itself or any child) */
  const openSection = useMemo(() => {
    if (activeH) {
      for (const sec of sections) {
        if (sec.head.id === activeH || sec.kids.some(k => k.id === activeH)) return sec.head.id;
      }
    }
    return sections[0]?.head.id ?? null;
  }, [sections, activeH]);
  const tp       = topicOf(post.tags);

  /* stat tile data — read from the post itself (see data/words.ts) */
  const words = useMemo(() => countWords(source), [source]);

  /* the hash carries the reading position, so share the full href;
     touch devices get the native share sheet, everyone else the yank */
  const sharePermalink = () => {
    const url = location.href;
    if (typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches) {
      navigator.share({ title: post.title, url }).catch(() => {});
      return;
    }
    const done = () => { setShared(true); setTimeout(() => setShared(false), 1500); };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done, done);
    } else {
      done();
    }
  };

  /* reset scroll on mount */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    pctRef.current = 0;
    setPct(0);
    activeRef.current = headings[0]?.id ?? null;
    setActiveH(activeRef.current);
  }, [post.id]);

  /* reading progress + scrollspy — the hot path, so it is built to cost
     almost nothing per frame:
       · scroll events are coalesced into ONE rAF pass (a burst of events
         between two frames does the work once)
       · heading positions are measured ONCE into a sorted number list, so a
         frame compares numbers instead of doing 1 getElementById + 1
         getBoundingClientRect per heading (59 of each on a long post)
       · the cache re-measures itself only when the article's height really
         changes, which is what happens when mermaid/images settle late
       · progress is committed as a whole percent, and both it and the active
         heading bail out when unchanged, so setState (and the re-render it
         drags along) fires ~100 times per document instead of every event */
  useEffect(() => {
    const offset = () => Math.round(window.innerHeight / 3);   /* a heading lights up in the upper third of the screen */
    let raf = 0;
    let hashTimer = 0;
    let cachedH = -1;
    let artTop = 0;
    let tops: { id: string; top: number }[] = [];

    const absTop = (node: HTMLElement) => {
      let y = 0;
      let el: HTMLElement | null = node;
      while (el) { y += el.offsetTop; el = el.offsetParent as HTMLElement | null; }
      return y;
    };

    function measure(el: HTMLElement) {
      cachedH = el.offsetHeight;
      artTop  = absTop(el);
      tops = [];
      for (const h of headings) {
        const node = document.getElementById(h.id);
        if (node) tops.push({ id: h.id, top: absTop(node) });
      }
    }

    function read() {
      raf = 0;
      const el = articleRef.current;
      if (!el) return;
      const h = el.offsetHeight;
      if (h !== cachedH) measure(el);
      const y     = window.scrollY;
      const total = Math.max(1, h - window.innerHeight + 120);
      const next  = Math.min(100, Math.max(0, Math.round(((y - artTop + 60) / total) * 100)));
      if (next !== pctRef.current) { pctRef.current = next; setPct(next); }
      /* cur stays null until a heading actually crosses the offset, so a
         fresh page keeps its clean URL until the reader really moves */
      let cur: string | null = null;
      for (const t of tops) {
        if (t.top - y <= offset()) cur = t.id;
        else break;                      /* tops is in document order */
      }
      const id = cur ?? tops[0]?.id ?? null;
      if (id !== activeRef.current) { activeRef.current = id; setActiveH(id); }
      if (cur !== hashRef.current) {
        hashRef.current = cur;
        /* the highlight moves instantly, but the URL waits for the scroll to
           settle: flicking through 56 headings would otherwise fire 56
           history writes, and browsers throttle that API hard */
        clearTimeout(hashTimer);
        hashTimer = window.setTimeout(() => {
          history.replaceState(null, '', cur ? `#${cur}` : location.pathname + location.search);
        }, 150);
      }
    }

    function onScroll() { if (!raf) raf = requestAnimationFrame(read); }
    function onResize() { cachedH = -1; onScroll(); }

    /* a hidden tab pauses rAF, so scrolling while hidden leaves the meter
       one pass behind — resync the moment the tab comes back */
    function onShow() { if (!document.hidden) onScroll(); }

    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onShow);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(hashTimer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [headings, post.id]);

  /* keyboard: Esc = close drawer, else back to posts; [ / ] = prev/next */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.activeElement && /input|textarea/i.test((document.activeElement as HTMLElement).tagName)) return;
      if (e.key === 'Escape') {
        if (olOpen) { setOlOpen(false); return; }
        window.location.href = '/posts/';
      }
      if (e.key === '[' && prevPost) { window.location.href = `/posts/${prevPost.slug}/`; }
      if (e.key === ']' && nextPost) { window.location.href = `/posts/${nextPost.slug}/`; }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevPost, nextPost, olOpen]);

  /* vim doesn't scroll, it JUMPS — instant reposition + hlsearch flash */
  const jumpTo = (id: string) => {
    const node = document.getElementById(id);
    if (!node) return;
    let y = 0; let el: HTMLElement | null = node;
    while (el) { y += el.offsetTop; el = el.offsetParent as HTMLElement | null; }
    hashRef.current = id;
    history.replaceState(null, '', `#${id}`);
    window.scrollTo(0, y - 60);
    node.classList.remove('jumped');
    void node.offsetWidth;
    node.classList.add('jumped');
    node.addEventListener('animationend', () => node.classList.remove('jumped'), { once: true });
  };

  const vimPct = pct <= 0 ? 'Top' : pct >= 100 ? 'Bot' : `${pct}%`;

  return (
    <div className="rd-frame">
      <div className="win focus" style={{ '--cv': tp.tone } as React.CSSProperties}>
        <header className="win-tbar">
          <span className="win-tbar-t"><b>~/posts/{post.slug}.md</b></span>
          <span className="win-app">nvim</span>
        </header>

        <article className="rd-paper" ref={articleRef}>
          <div className="rd-col">
            <div className="rd-meta">
              <a className="chip" href={`/categories/${tp.key}/`} style={{ '--tc': tp.tone } as React.CSSProperties}>
                {tp.title.toLowerCase()}
              </a>
              <span>{post.iso}</span>
              <span>·</span>
              <span>{post.read.toLowerCase()}</span>
            </div>
            <h1 className="rd-title">{post.title}</h1>
            <p className="rd-lede">{post.excerpt}</p>

            <div className="rd-banner" role="img" aria-label={`${tp.title} banner`}>
              <span className="rd-banner-w" aria-hidden>{post.preview}</span>
            </div>

            <div className="rd-tags">
              {post.tags.map(t => (
                <a key={t} className="tagchip" href={`/tags/${t}/`} style={{ '--tc': topicOf([t]).tone } as React.CSSProperties} title={`All posts tagged #${t}`}>
                  <b>#{t}</b>
                </a>
              ))}
            </div>

            <div className="rd-body" lang="en">
              {body}
            </div>

            {related.length > 0 && (
              <aside className="rd-rel" aria-label="Related posts">
                <div className="rd-rel-h">see also <span>— more in {tp.title.toLowerCase()}/</span></div>
                {related.map(p => (
                  <a key={p.id} className="rd-rel-r" href={`/posts/${p.slug}/`}>
                    <time dateTime={p.iso}>{p.iso}</time>
                    <span className="t">{p.title}</span>
                    <span className="r">{p.read.toLowerCase()}</span>
                  </a>
                ))}
              </aside>
            )}

            <nav className="rd-pager" aria-label="More posts">
              {prevPost ? (
                <a
                  href={`/posts/${prevPost.slug}/`}
                  className="rd-pgr"
                  aria-label={`Newer post: ${prevPost.title}`}
                >
                  <span className="c">:prev</span>
                  <span className="t">{prevPost.title}</span>
                </a>
              ) : <span aria-hidden></span>}
              {nextPost ? (
                <a
                  href={`/posts/${nextPost.slug}/`}
                  className="rd-pgr next"
                  aria-label={`Older post: ${nextPost.title}`}
                >
                  <span className="c">:next</span>
                  <span className="t">{nextPost.title}</span>
                </a>
              ) : <span aria-hidden></span>}
            </nav>
          </div>
        </article>

        <div className="stl" role="contentinfo" aria-label="Reading progress">
          <span className="stl-mode">READING</span>
          <button type="button" className={`stl-file${shared ? ' is-yanked' : ''}`} onClick={sharePermalink} title="yy — copy permalink">
            {shared ? <>yanked <span className="mono">✓</span></> : `${post.slug}.md`}
          </button>
          {headings.length > 0 && (
            <button type="button" className="ol-btn" onClick={() => setOlOpen(true)} aria-haspopup="dialog">
              <span className="mono">≡</span> outline
            </button>
          )}
          <span className="stl-keys" aria-hidden>
            {[prevPost && '[ prev', nextPost && '] next', 'esc :q'].filter(Boolean).join(' · ')}
          </span>
          <button
            type="button"
            className="stl-pct"
            onClick={() => window.scrollTo({ top: 0 })}
            title="gg — back to top"
            aria-label={`${pct}% read — back to top`}
          >{vimPct}</button>
        </div>
      </div>

      <aside className="rd-side">
        <section className="win rd-stat" aria-label="Post details">
          <header className="win-tbar">
            <span className="win-tbar-t"><b>stat</b></span>
          </header>
          <dl className="rd-stat-rows">
            <div className="r">
              <dt>category</dt>
              <dd><a className="chip" href={`/categories/${tp.key}/`} style={{ '--tc': tp.tone } as React.CSSProperties}>{tp.title.toLowerCase()}</a></dd>
            </div>
            <div className="r">
              <dt>written</dt>
              <dd><time dateTime={post.iso}>{post.iso}</time></dd>
            </div>
            <div className="r">
              <dt>read</dt>
              <dd>{post.read.toLowerCase().replace(/ read$/, '')}</dd>
            </div>
            <div className="r">
              <dt>words</dt>
              <dd>{words.toLocaleString('en-US')}</dd>
            </div>
            <div className="r">
              <dt>tags</dt>
              <dd className="tgs">
                {post.tags.map(t => <a key={t} href={`/tags/${t}/`} title={`All posts tagged #${t}`}>#{t}</a>)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="win ol" aria-label="Outline">
          <header className="win-tbar">
            <span className="win-tbar-t"><b>outline</b></span>
          </header>
          <nav className="ol-list">
            {sections.length === 0 && <span className="ol-item">no sections</span>}
            {sections.map(sec => {
              const open = sec.head.id === openSection;
              return (
                <Fragment key={sec.head.id}>
                  <button
                    className={`ol-item l${sec.head.level}${activeH === sec.head.id ? ' on' : ''}${sec.kids.length ? ' has-kids' : ''}`}
                    aria-expanded={sec.kids.length ? open : undefined}
                    onClick={() => jumpTo(sec.head.id)}
                  >
                    {sec.head.text}
                  </button>
                  {/* jumping to a Part scrolls there, which is what opens it —
                      so the row needs no separate toggle affordance */}
                  {open && sec.kids.map(k => (
                    <button
                      key={k.id}
                      className={`ol-item l${k.level}${activeH === k.id ? ' on' : ''}`}
                      onClick={() => jumpTo(k.id)}
                    >
                      {k.text}
                    </button>
                  ))}
                </Fragment>
              );
            })}
          </nav>
        </section>
      </aside>

      {olOpen && (
        <div
          className="rofi open"
          role="dialog"
          aria-label="Outline"
          onClick={e => { if (e.target === e.currentTarget) setOlOpen(false); }}
        >
          <div className="rofi-box">
            <div className="rofi-input">
              <b aria-hidden>❯</b>
              <span className="ol-drawer-t">outline — {post.slug}.md</span>
              <button className="md-code-btn" onClick={() => setOlOpen(false)} aria-label="Close outline">
                <span aria-hidden>✕</span>
              </button>
            </div>
            <div className="rofi-list">
              {headings.map(h => (
                <button
                  key={h.id}
                  className={`rofi-item${activeH === h.id ? ' sel' : ''}`}
                  onClick={() => { setOlOpen(false); jumpTo(h.id); }}
                >
                  <span className="k" aria-hidden>{h.level === 2 ? 'H2' : '· H3'}</span>
                  <span className="t">{h.text}</span>
                </button>
              ))}
            </div>
            <div className="rofi-hint"><b>esc</b> close</div>
          </div>
        </div>
      )}

      {shared && (
        <div className="toast" role="status">
          <b>notify-send</b> permalink copied to clipboard <span className="g">✓</span>
        </div>
      )}
    </div>
  );
}
