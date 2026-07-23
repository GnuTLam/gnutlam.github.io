/* PAGE COPY — every editable sentence on the main and about pages lives
   here. Edit this file, rebuild, done: no component ever needs touching.

   - Identity strings (name, domain, OS, prompt) stay in site.ts.
   - Posts are markdown files in src/content/posts/.
   - Wrap a phrase in **double asterisks** to render it bold. */

export const HOME = {
  /* pixel hero title — first line plain, second line accent */
  title:       'IT FIELD NOTES,',
  titleAccent: 'COMPILED FROM SOURCE',

  /* lede — rendered as: <b>{domain}</b> {lede}  ({domain} is prepended
     automatically; **bold** markers work inside the string) */
  lede: 'is an information-technology journal running on LAM/OS: systems, networks, infrastructure, and code. Deep-dives, 3AM post-mortems, and the occasional manifesto — **no sponsored content, no AI summaries.**',

  /* neofetch rows not derived from site.ts or the posts collection */
  shell:  'zsh 5.9',
  editor: 'nvim (btw)',
};

export const ABOUT = {
  /* <meta name="description"> of the about page */
  description: 'IT engineer building payments infrastructure, agent orchestrators, and high-throughput data pipelines.',

  /* one-line role subtitle under the name */
  role: 'IT engineer — infrastructure · UTC+7',

  /* tools I work with — each entry links to its tag page, so every entry
     must be a real tag */
  stack: ['rust', 'postgres', 'spark', 'linux'],

  /* intro paragraphs — one array item per paragraph, **bold** markers allowed */
  bio: [
    'I build the IT infrastructure other engineers never have to think about — payments ledgers, agent orchestrators, and data pipelines that move terabytes without melting the fleet.',
    "This blog is my field journal: **the work, written down while it's still fresh** — what broke at 3AM, why, and what it taught me.",
  ],

  /* # now — what's actually running right now (shell banner + `now`) */
  now: [
    { k: 'building', v: 'a crash-only agent orchestrator in Rust' },
    { k: 'reading',  v: 'Designing Data-Intensive Applications (again)' },
    { k: 'running',  v: 'a 1M-connection WebSocket fleet in prod' },
  ],

  /* status-bar line of the shell window */
  status: 'open to interesting problems',
};

/* split a copy string on **bold** markers → [{ b, t }] segments */
export function em(s: string): { b: boolean; t: string }[] {
  return s.split(/\*\*(.+?)\*\*/g).map((t, i) => ({ b: i % 2 === 1, t })).filter(seg => seg.t !== '');
}
