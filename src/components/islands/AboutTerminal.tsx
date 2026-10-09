import { createElement, useEffect, useRef, useState, type ReactNode } from 'react';
import { SITE, PROMPT } from '../../data/site';
import { ABOUT } from '../../data/content';

/* AboutTerminal — the side window is a real shell. Every command answers
   from build-time data passed in as props; nothing is faked at runtime. */

interface Props {
  now: { k: string; v: string }[];
  links: { label: string; href: string }[];
  posts: { slug: string; title: string; iso: string; read: string }[];
  stats: { posts: number; mins: number; streak: number; idle: number; pace: string; spark: string };
}

const NBSP = ' ';

export default function AboutTerminal({ now, links, posts, stats }: Props) {
  /* deterministic banner — identical on server and client, so hydration
     is clean and no-JS visitors still see the now-jobs */
  const banner: ReactNode[] = [
    <div className="tl dim" key="b1">last write: {posts[0]?.iso ?? '--'} · {stats.posts} logged</div>,
    <div className="tl" key="b2">{NBSP}</div>,
    <div className="tl dim" key="b3"># now — watch -n 60</div>,
    ...now.map(r => (
      <div className="tl" key={`bn-${r.k}`}><span className="tk">{r.k.padEnd(10)}</span>{r.v}</div>
    )),
    <div className="tl" key="b4">{NBSP}</div>,
    <div className="tl" key="b5">type <b>help</b> — this shell is real.</div>,
  ];

  const [out, setOut] = useState<ReactNode[]>(banner);
  const [val, setVal] = useState('');
  const [cmds, setCmds] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const inRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outRef.current?.scrollTo(0, outRef.current.scrollHeight);
  }, [out]);

  const echo = (raw: string) => (
    <div className="tl"><span className="tp"><b>{PROMPT}</b>:<span className="tpp">~/about</span>$ </span>{raw}</div>
  );
  /* spread children through createElement — static children need no keys */
  const line = (...kids: ReactNode[]) => createElement('div', { className: 'tl' }, ...kids);
  const err = (s: string) => <div className="tl"><span className="warn">{s}</span></div>;

  function exec(input: string): ReactNode | 'clear' {
    const [cmd, ...args] = input.split(/\s+/);
    switch (cmd) {
      case 'help':
        return [
          ['help', 'this list'],
          ['whoami', `who is ${SITE.user}`],
          ['now', "what's running"],
          ['ls', 'recent writes'],
          ['open X', "open a write (slug or 'latest')"],
          ['links', 'elsewhere on the net'],
          ['stats', 'journal numbers'],
          ['theme X', 'dark | light'],
          ['clear', 'wipe the tty'],
          ['exit', 'back to ~'],
        ].map(([k, v]) => line(<span className="tk">{k.padEnd(10)}</span>, <span className="dim">{v}</span>));

      case 'whoami':
        return [
          line(`${SITE.user}: ${ABOUT.role}`),
          line(<span className="dim">{ABOUT.description}</span>),
        ];

      case 'now':
        return now.map(r => line(<span className="tk">{r.k.padEnd(10)}</span>, r.v));

      case 'ls':
        return posts.map(p => line(
          <span className="dim">{p.iso}  </span>,
          <a href={`/posts/${p.slug}/`}>{p.slug}.md</a>,
          <span className="dim">  {p.read.toLowerCase()}</span>,
        ));

      case 'open': {
        const q = args[0];
        if (!q) return err('usage: open <slug|latest>');
        const p = q === 'latest' ? posts[0] : posts.find(x => x.slug.includes(q));
        if (!p) return err(`open: no write matching '${q}' — try \`ls\``);
        setTimeout(() => { location.href = `/posts/${p.slug}/`; }, 300);
        return line(<span className="dim">opening {p.slug}.md …</span>);
      }

      case 'links':
        return links.map(l => l.href === '#'
          ? line(<span className="dim">{l.label.padEnd(10)}→ (soon)</span>)
          : line(<span className="tk">{l.label.padEnd(10)}</span>, '→ ', <a href={l.href}>{l.href}</a>));

      case 'stats':
        return [
          line(<span className="tk">{'signal'.padEnd(10)}</span>, <span className="sig">{stats.spark}</span>,
            <span className="dim">  {stats.streak}mo up · {stats.idle}mo idle</span>),
          line(<span className="tk">{'log'.padEnd(10)}</span>,
            `${stats.posts} writes · ${stats.mins} min · ~${stats.pace}/month`),
        ];

      case 'theme': {
        const p = args[0];
        if (p !== 'dark' && p !== 'light') return err('usage: theme dark|light');
        (window as unknown as { crtFlip?: () => void }).crtFlip?.();
        document.documentElement.setAttribute('data-palette', p);
        try {
          const t = JSON.parse(localStorage.getItem('gnut-tweaks') || '{}');
          t.palette = p;
          localStorage.setItem('gnut-tweaks', JSON.stringify(t));
        } catch { /* private mode */ }
        window.dispatchEvent(new CustomEvent('tweaks:sync'));
        return line(`phosphor set to ${p}.`);
      }

      case 'clear':
        return 'clear';

      case 'exit':
        setTimeout(() => { location.href = '/'; }, 300);
        return line(<span className="dim">logout — returning to ~ …</span>);

      /* the mandatory easter eggs */
      case 'sudo':
        return err(`${SITE.user} is not in the sudoers file. This incident will be reported.`);
      case 'rm':
        return err('rm: everything here is read-only — deleted takes live in /dev-null.');
      case 'ping':
        return line(<span className="dim">PONG from {SITE.domain} — 0.4ms (static site, everything is cache)</span>);
      case 'uptime':
        return line(<span className="dim">writing since {SITE.since} · load 0.03</span>);
      case 'pwd':
        return line(`/home/${SITE.user}/about`);
      case 'neofetch':
        return line(<span className="dim">neofetch: already running — look at the window on the left.</span>);

      default:
        return err(`zsh: command not found: ${cmd} (try \`help\`)`);
    }
  }

  function run(raw: string) {
    const input = raw.trim();
    if (!input) { setOut(o => [...o, echo(raw)]); return; }
    setCmds(c => [...c, input]);
    setHIdx(-1);
    const res = exec(input);
    if (res === 'clear') { setOut([]); return; }
    /* flatten multi-line results so every line gets its own keyed wrapper */
    setOut(o => [...o, echo(raw), ...(Array.isArray(res) ? res : [res])]);
  }

  function onKey(e: React.KeyboardEvent) {
    /* submit on keydown — synthetic Enter events (and some IMEs) never
       trigger the form's implicit submission */
    if (e.key === 'Enter') {
      e.preventDefault();
      run(val);
      setVal('');
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!cmds.length) return;
      const i = hIdx < 0 ? cmds.length - 1 : Math.max(0, hIdx - 1);
      setHIdx(i);
      setVal(cmds[i]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx < 0) return;
      const i = hIdx + 1;
      if (i >= cmds.length) { setHIdx(-1); setVal(''); }
      else { setHIdx(i); setVal(cmds[i]); }
    }
  }

  return (
    <div
      className="win-body term"
      onClick={() => { if (window.getSelection()?.isCollapsed) inRef.current?.focus(); }}
    >
      {/* real-shell flow: the prompt rides the tail of the output and the
          empty glass sits BELOW it — the whole scrollback scrolls as one */}
      <div className="term-scroll" ref={outRef}>
        <div className="term-out" role="log" aria-live="polite">
          {out.map((n, i) => <span style={{ display: 'contents' }} key={i}>{n}</span>)}
        </div>
        <form
          className="term-in"
          onSubmit={e => { e.preventDefault(); run(val); setVal(''); }}
        >
          <span className="tp"><b>{PROMPT}</b>:<span className="tpp">~/about</span>$&nbsp;</span>
          <input
            ref={inRef}
            style={{ width: `${val.length}ch` }}
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={onKey}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            enterKeyHint="send"
            aria-label="Shell input"
          />
          <i className="tcur" aria-hidden></i>
        </form>
      </div>
    </div>
  );
}
