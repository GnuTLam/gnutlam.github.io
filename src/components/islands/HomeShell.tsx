import { useState, useEffect, useMemo, useRef } from 'react';
import { topicOf, countByTopic } from '../../data/topics';
import { GNUT_MARK, GNUT_PAL_FULL, pxSvg } from '../../data/pixel';
import { EMPTY_SKULL } from '../../data/empty';
import { SITE, OS_FULL } from '../../data/site';
import { HOME, MASCOT, em } from '../../data/content';
import type { PostData } from '../../types';

const RECENT = 6;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function daysSince(iso: string, today: Date): number {
  return Math.floor((today.getTime() - new Date(iso + 'T00:00:00').getTime()) / 86_400_000);
}

/* ---- tile shell — the name line (title + counters) inside the frame, then the body ---- */
interface WinProps {
  title: React.ReactNode;
  app?: React.ReactNode;           /* the program, right corner of the title bar */
  focus?: boolean;
  status?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}
function Win({ title, app, focus, status, className, children }: WinProps) {
  return (
    <section className={`win${focus ? ' focus' : ''} ${className ?? ''}`}>
      <header className="win-tbar">
        <span className="win-tbar-t">{title}</span>
        {status && <div className="win-status">{status}</div>}
        {app && <span className="win-app">{app}</span>}
      </header>
      {children}
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
      <span className="p-cat">{tp.title.toLowerCase()}</span>
      <span className="p-read">{post.read.toLowerCase()}</span>
    </a>
  );
}

/* builtOn: the build date (YYYY-MM-DD) from the page, so the prerendered HTML
   and the first client render agree on "today" (see the effect below) */
interface Props { posts: PostData[]; builtOn: string; }

export default function HomeShell({ posts, builtOn }: Props) {
  /* the wall clock only after hydration — rendering Date.now() directly made the
     server HTML and the client disagree once a day had passed since the build */
  const [today, setToday] = useState(() => new Date(builtOn + 'T00:00:00'));
  useEffect(() => { setToday(new Date()); }, []);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const latest = posts[0];
  const silentDays = latest ? daysSince(latest.iso, today) : 0;
  const tagCount = useMemo(() => new Set(posts.flatMap(p => p.tags)).size, [posts]);

  /* trending tags — busiest first, ties newest-post-first via input order */
  const topTags = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of posts) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [posts]);

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
  const cats = useMemo(() => countByTopic(posts), [posts]);
  const maxCat = Math.max(1, ...cats.map(c => c.n));

  /* posts per month — the last 12 calendar months ending this one; each post is
     one block in its category's tone, so the stack height is the real count */
  const months = useMemo(() => {
    const cols = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
      return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTHS[d.getMonth()], tones: [] as string[] };
    });
    for (const p of posts) cols.find(c => c.key === p.iso.slice(0, 7))?.tones.push(topicOf(p.tags).tone);
    return cols;
  }, [posts, today]);
  const maxMonth = Math.max(1, ...months.map(m => m.tones.length));
  const inYear = months.reduce((n, m) => n + m.tones.length, 0);

  /* split the accent line so the last word can be glued to the caret */
  const accCut = HOME.titleAccent.lastIndexOf(' ');
  const accLead = accCut < 0 ? '' : HOME.titleAccent.slice(0, accCut + 1);
  const accTail = accCut < 0 ? HOME.titleAccent : HOME.titleAccent.slice(accCut + 1);

  return (
    <div className="hm">
      <div className="hm-main">
        {/* neofetch hero */}
        <Win
          focus
          title={<b>~</b>}
          app="fetch"
          className="w-fetch"
        >
          <div className="win-body">
            <h1 className="nf-title">
              {HOME.title}<br />
              {/* the caret rides the last word — an inline-block is a wrap
                  opportunity, and a lone blinking _ on line 3 read as debris */}
              <span className="a">{accLead}<span className="nowrap">{accTail}<span className="caret" aria-hidden /></span></span>
            </h1>
            <p className="nf-lede">
              <b>{SITE.domain}</b>{' '}
              {em(HOME.lede).map((s, i) => s.b ? <b key={i}>{s.t}</b> : <span key={i}>{s.t}</span>)}
            </p>
            <div className="nf-cta">
              {latest && <a className="btn pri sm" href={`/posts/${latest.slug}/`}>$ open --latest</a>}
              <a className="btn sm" href="/about/">$ whoami</a>
            </div>
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
              {/* the ANSI strip every fetch ends on — ground, the red house
                  voice, then the six "Patina" category tones warm→cool, ink:
                  the desktop's whole palette as one quiet legend */}
              <div className="nf-pal" aria-hidden>
                {['--bg2', '--acc', '--cat-rust', '--cat-storage', '--cat-data', '--cat-scale', '--cat-ai', '--cat-craft', '--text'].map(v => (
                  <i key={v} style={{ background: `var(${v})` }} />
                ))}
              </div>
            </div>
            {/* neofetch prints the DISTRO'S mark, not generic Tux — this is the
                GNUT/OS logo in its full-colour dress. It stands on the tile's
                bottom border beside the fetch table (beside the headline on a
                phone) — the grid areas live in .w-fetch > .win-body */}
            {HOME.avatar === MASCOT ? (
              <span className="nf-art">
                <span dangerouslySetInnerHTML={{ __html: pxSvg(GNUT_MARK, GNUT_PAL_FULL, 192) }} />
                {/* the blink: two cell-sized sockets laid over the pupils
                    (row 8, cols 6 + 9) — see .nf-eye */}
                <i className="nf-eye l" aria-hidden />
                <i className="nf-eye r" aria-hidden />
              </span>
            ) : (
              /* blog.config.ts home.avatar — the owner's own image, same box */
              <span className="nf-art">
                <img className="av-img" src={HOME.avatar} alt={SITE.user} width={192} height={204} />
              </span>
            )}
          </div>
        </Win>
      </div>

      {/* recent posts / finder — full-width bottom tile */}
      <Win
        title={<b>~/posts</b>}
          app="fzf"
        className="w-recent"
        status={
          <>
            <span>
              <b>{needle ? filtered.length : visible.length}</b>/{posts.length}{needle && <> match{filtered.length === 1 ? '' : 'es'}</>}
            </span>
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
            aria-label="Filter posts"
          />
          <kbd>/</kbd>
        </div>
        {visible.length > 0 ? (
          <div className="p-list">
            {visible.map(p => <PostRow key={p.id} post={p} />)}
            {!needle && posts.length > RECENT && (
              <a className="p-more" href="/posts/">open all {posts.length} posts <span className="mono">↵</span></a>
            )}
          </div>
        ) : (
          <div className="p-empty">
            <span>
              <span className="p-empty-ico" aria-hidden dangerouslySetInnerHTML={{ __html: EMPTY_SKULL }} />
              fzf: no match for '<b>{query}</b>'
            </span>
          </div>
        )}
      </Win>

      <div className="hm-side">
        {/* monitor — btop: category distribution (counts live in fetch) */}
        <Win
          title={<b>/proc</b>}
          app="btop"
          className="w-mon"
          status={<span>{silentDays}d idle</span>}
        >
          <div className="win-body">
            <div className="mon-lbl" style={{ marginTop: 0 }}><span>categories</span></div>
            <div className="cbars">
              {cats.length === 0
                ? <div style={{ color: 'var(--mute)', fontSize: 'var(--fs-meta)', padding: 'var(--sp-1)' }}>no categories tracked yet</div>
                : cats.map(c => (
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

            <div className="mon-lbl spark-lbl"><span>posts per month</span><span>{inYear} in 12mo</span></div>
            <div className="spark" role="img" aria-label={`Posts per month, ${months[0].key} to ${months[11].key}: ${inYear} in total`}>
              {months.map(m => (
                <span key={m.key} className="sp-col" title={`${m.key}: ${m.tones.length} post${m.tones.length === 1 ? '' : 's'}`}>
                  {m.tones.map((t, i) => (
                    <i key={i} style={{ background: t, height: `calc((100% - ${maxMonth - 1}px) / ${maxMonth})` }} />
                  ))}
                </span>
              ))}
            </div>
            <div className="spark-ax" aria-hidden><span>{months[0].label}</span><span>{months[11].label}</span></div>
          </div>
        </Win>

        {/* trending tags — chirpy's panel, spoken in shell */}
        <Win
          title={<b>~/tags</b>}
          app="sort | uniq -c | sort -rn"
          className="w-tags"
        >
          <div className="win-body">
            <div className="tcloud">
              {topTags.map(([t, n]) => (
                <a key={t} className="tagchip" href={`/tags/${t}/`} style={{ '--tc': topicOf([t]).tone } as React.CSSProperties} title={`All posts tagged #${t}`}>
                  <b>#{t}</b><span className="n">{n}</span>
                </a>
              ))}
            </div>
          </div>
        </Win>

        {/* keys cheat sheet — 4 truthful rows */}
        <Win
          title={<b>~/.config/sxhkdrc</b>}
          app="bat"
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
    </div>
  );
}
