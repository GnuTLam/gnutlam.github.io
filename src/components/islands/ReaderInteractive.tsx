import { useState, useEffect, useMemo, useRef } from 'react';
import Markdown, { mdHeadings } from './MarkdownRenderer';
import { topicOf } from '../../data/topics';
import type { PostData } from '../../types';

const PRG_BLOCKS = 10;

interface Props {
  post:     PostData;
  source:   string;
  prevPost: PostData | null;
  nextPost: PostData | null;
}

export default function ReaderInteractive({ post, source, prevPost, nextPost }: Props) {
  const articleRef = useRef<HTMLElement>(null);
  const hashRef    = useRef<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeH,  setActiveH]  = useState<string | null>(null);
  const [shared,   setShared]   = useState(false);
  const [olOpen,   setOlOpen]   = useState(false);

  const headings = useMemo(() => mdHeadings(source), [source]);
  const tp       = topicOf(post.tags);

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
    setProgress(0);
    setActiveH(headings[0]?.id ?? null);
  }, [post.id]);

  /* reading progress + scrollspy */
  useEffect(() => {
    const OFFSET = 96;
    function onScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect  = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight + 120;
      setProgress(Math.min(1, Math.max(0, (-rect.top + 60) / Math.max(1, total))));
      /* cur stays null until a heading actually crosses the offset, so a
         fresh page keeps its clean URL until the reader really moves */
      let cur: string | null = null;
      for (const h of headings) {
        const node = document.getElementById(h.id);
        if (node && node.getBoundingClientRect().top <= OFFSET) cur = h.id;
      }
      setActiveH(cur ?? headings[0]?.id ?? null);
      if (cur !== hashRef.current) {
        hashRef.current = cur;
        history.replaceState(null, '', cur ? `#${cur}` : location.pathname + location.search);
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
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

  const pct = Math.round(progress * 100);
  const vimPct = pct <= 0 ? 'Top' : pct >= 100 ? 'Bot' : `${pct}%`;

  return (
    <div className="rd-frame">
      <div className="win focus" style={{ '--cv': tp.tone } as React.CSSProperties}>
        <header className="win-tbar">
          <span className="win-tbar-t"><b>~/posts/{post.slug}.md</b> — nvim</span>
          <span className="win-dots">
            <i aria-hidden></i><i aria-hidden></i>
            <a href="/posts/" title="close → posts (Esc)" aria-label="Close and return to posts"></a>
          </span>
        </header>

        <div className="rd-cols">
          <article className="rd-paper" ref={articleRef}>
            <div className="rd-col">
              <div className="rd-meta">
                <a className="chip" href={`/categories/${tp.key}/`} style={{ '--tc': tp.tone } as React.CSSProperties}>
                  {tp.title.toLowerCase()}
                </a>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.read.toLowerCase()}</span>
              </div>
              <h1 className="rd-title">{post.title}</h1>
              <p className="rd-lede">{post.excerpt}</p>

              <div className="rd-banner" role="img" aria-label={`${tp.title} banner`}>
                <span className="rd-banner-d" aria-hidden>░ ▒ ░ ▒ ░ ▒ ░ ▒</span>
                <span className="rd-banner-w" aria-hidden>{post.preview}</span>
                <span className="rd-banner-d" aria-hidden>▒ ░ ▒ ░ ▒ ░ ▒ ░</span>
              </div>

              <div className="rd-tags">
                {post.tags.map(t => (
                  <a key={t} className="tagchip" href={`/tags/${t}/`} style={{ '--tc': topicOf([t]).tone } as React.CSSProperties} title={`All posts tagged #${t}`}>
                    <b>#{t}</b>
                  </a>
                ))}
              </div>

              <div className="rd-body" lang="en">
                <Markdown source={source} />
              </div>

              <nav className="rd-pager" aria-label="More posts">
                {prevPost ? (
                  <a
                    href={`/posts/${prevPost.slug}/`}
                    className="btn"
                    title={prevPost.title}
                    aria-label={`Newer post: ${prevPost.title}`}
                  >← :prev</a>
                ) : <span aria-hidden></span>}
                {nextPost ? (
                  <a
                    href={`/posts/${nextPost.slug}/`}
                    className="btn pri"
                    title={nextPost.title}
                    aria-label={`Older post: ${nextPost.title}`}
                  >:next →</a>
                ) : <span aria-hidden></span>}
              </nav>
            </div>
          </article>

          <aside className="ol">
            <div className="ol-head">OUTLINE</div>
            <nav className="ol-list">
              {headings.length === 0 && <span className="ol-item">no sections</span>}
              {headings.map(h => (
                <button
                  key={h.id}
                  className={`ol-item l${h.level}${activeH === h.id ? ' on' : ''}`}
                  onClick={() => jumpTo(h.id)}
                >
                  {h.text}
                </button>
              ))}
            </nav>
          </aside>
        </div>

        <div className="stl" role="contentinfo" aria-label="Reading progress">
          <span className="stl-mode">READING</span>
          <button type="button" className="stl-file" onClick={sharePermalink} title="yy — copy permalink">
            {shared ? 'yanked ✓' : `${post.slug}.md`}
          </button>
          {headings.length > 0 && (
            <button type="button" className="ol-btn" onClick={() => setOlOpen(true)} aria-haspopup="dialog">
              ≡ outline
            </button>
          )}
          <span className="stl-keys" aria-hidden>
            {[prevPost && '[ prev', nextPost && '] next', 'esc :q'].filter(Boolean).join(' · ')}
          </span>
          <span className="prg" aria-hidden>
            {Array.from({ length: PRG_BLOCKS }, (_, i) => (
              <i key={i} className={i < Math.round(progress * PRG_BLOCKS) ? 'on' : ''}></i>
            ))}
          </span>
          <span className="stl-pct" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>{vimPct}</span>
        </div>
      </div>

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
