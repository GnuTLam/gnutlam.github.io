import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'gnut-tweaks';

const SCHEMES = [
  { key: 'dark',  hint: 'red phosphor' },
  { key: 'light', hint: 'porcelain' },
];

function normalize(p: string | undefined): 'dark' | 'light' {
  return p === 'dark' ? 'dark' : 'light';
}

const DEFAULTS = { palette: 'light' };
type Tweaks = typeof DEFAULTS;

function load(): Tweaks {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    const t = { ...DEFAULTS, ...saved };
    /* no saved choice → whatever the boot script resolved (light by default) */
    t.palette = normalize(saved.palette ?? document.documentElement.getAttribute('data-palette') ?? 'light');
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

  /* no title bar, no ✕ — it closes like a menu: Esc, the tray button, or
     any click that lands outside (but not the tray toggle, or it reopens) */
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (boxRef.current && t && !boxRef.current.contains(t) && !t.closest('#bar-conf')) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  if (!open) return null;

  return (
    <div className="tw" role="dialog" aria-label="Theme settings" ref={boxRef}>
      <div className="tw-bd">
        <div className="tw-row">
          # mode
          <div className="tw-pal" role="group" aria-label="Color mode">
            {SCHEMES.map(p => (
              <button
                key={p.key}
                aria-pressed={t.palette === p.key}
                onClick={() => {
                  if (p.key !== t.palette) (window as unknown as { crtFlip?: () => void }).crtFlip?.();
                  set({ palette: p.key });
                }}
                title={p.hint}
              >
                {p.key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
