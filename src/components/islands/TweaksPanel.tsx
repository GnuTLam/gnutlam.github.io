import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'lamdev-tweaks';

const SCHEMES = [
  { key: 'dark',  sw: '#ffb454', hint: 'amber phosphor' },
  { key: 'light', sw: '#a8500e', hint: 'beige hardware' },
];

function normalize(p: string | undefined): 'dark' | 'light' {
  return p === 'light' ? 'light' : 'dark';
}

const DEFAULTS = { palette: 'light', scanlines: true };
type Tweaks = typeof DEFAULTS;

function load(): Tweaks {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const t = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
    /* no saved choice → whatever the boot script resolved (OS preference) */
    t.palette = normalize(t.palette ?? document.documentElement.getAttribute('data-palette') ?? 'light');
    return t;
  } catch {
    return DEFAULTS;
  }
}

export default function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState<Tweaks>(load);

  const set = useCallback((patch: Partial<Tweaks>) => {
    setT(prev => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', t.palette);
    document.body.setAttribute('data-scanlines', t.scanlines ? 'on' : 'off');
    window.dispatchEvent(new CustomEvent('tweaks:sync'));
  }, [t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); setOpen(o => !o); }
      if (e.key === 'Escape') setOpen(false);
    };
    const onToggle = () => setOpen(o => !o);
    /* the bar's quick-toggle changes the palette behind our back — resync */
    const onSync = () => setT(prev => {
      const cur = normalize(document.documentElement.getAttribute('data-palette') ?? 'light');
      return cur === prev.palette ? prev : { ...prev, palette: cur };
    });
    window.addEventListener('keydown', onKey);
    window.addEventListener('tweaks:toggle', onToggle);
    window.addEventListener('tweaks:sync', onSync);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('tweaks:toggle', onToggle);
      window.removeEventListener('tweaks:sync', onSync);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="tw" role="dialog" aria-label="Theme settings">
      <header className="win-tbar">
        <span className="win-tbar-t"><b>~/.config/theme.conf</b> — nvim</span>
        <span className="win-dots">
          <i aria-hidden></i><i aria-hidden></i>
          <a role="button" tabIndex={0} onClick={() => setOpen(false)} title="close" aria-label="Close"></a>
        </span>
      </header>
      <div className="tw-bd">
        <div>
          <div className="tw-lb"># mode</div>
          <div className="tw-pal" role="group" aria-label="Color mode">
            {SCHEMES.map(p => (
              <button
                key={p.key}
                aria-pressed={t.palette === p.key}
                style={{ '--sw': p.sw } as React.CSSProperties}
                onClick={() => {
                  if (p.key !== t.palette) (window as unknown as { crtFlip?: () => void }).crtFlip?.();
                  set({ palette: p.key });
                }}
                title={p.hint}
              >
                <i aria-hidden></i>{p.key}
              </button>
            ))}
          </div>
        </div>
        <div className="tw-row">
          # crt scanlines
          <button
            className="tw-tgl"
            role="switch"
            aria-checked={t.scanlines}
            aria-label="CRT scanlines"
            onClick={() => set({ scanlines: !t.scanlines })}
          ><i aria-hidden></i></button>
        </div>
      </div>
    </div>
  );
}
