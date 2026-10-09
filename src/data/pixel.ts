/* shared pixel art — the GNUT/OS mascot (HACKER) fronts the hero, the About
   page, the favicon and, cropped to its face, the launcher and about tab */

/* ==================================================================== */
/*  THE GNUT/OS MARK — Skelamton, the hooded skeleton hacker.            */
/*  ONE character, drawn ONCE (HACKER, below). Every surface uses those  */
/*  same pixels: the hero and the favicon show the whole figure, and the */
/*  small sizes (launcher, the about tab) use the face cropped straight  */
/*  out of it — never a second drawing.                                  */
/*  Why not a separate small mark: the 12x12 hooded mark that used to    */
/*  live here read as TUX — black hood + white face + an orange nose in  */
/*  the middle is exactly the penguin's colour map — and its sockets     */
/*  were painted with --ico-line, so they turned LIGHT in dark mode. The */
/*  full figure turned out to hold at 16px; it never needed replacing.   */
/* ==================================================================== */

/* the operator behind the OS — hooded skeleton hacker, red headphones
   arcing over the hood into chunky ear pads, glowing red pupils */
export const HACKER_PAL: Record<string, string> = {
  k: '#1b1b1b', h: '#33302d', w: '#f2f2ea', s: '#c9c2ae', o: '#d4675b',
};

export const HACKER = [
  '....oooooooo....',
  '...okkkkkkkko...',
  '..okhhhhhhhhko..',
  '.okhhhhhhhhhhko.',
  'oohhkkkkkkkkhhoo',
  'oohkkwwwwwwkkhoo',
  'oohkwwwwwwwwkhoo',
  'oohkwkkwwkkwkhoo',
  'oohkwkowwokwkhoo',
  'khhkswwkkwwskhhk',
  'khhkswwwwwwskhhk',
  'khhkwwkwwkwwkhhk',
  'khhkkwkwwkwkkhhk',
  'khhhkkkkkkkkhhhk',
  'khhhhhohhohhhhhk',
  'khhhhhohhohhhhhk',
  'khhhhhhhhhhhhhhk',
];

/* the brand name for the same character — hero + favicon wear the full figure */
export const GNUT_MARK = HACKER;
export const GNUT_PAL_FULL = HACKER_PAL;

/* the face, cropped out of HACKER's own pixels (rows 4-13, cols 3-12) with the
   hood corners dropped — for surfaces too small for the whole figure. Fixed
   hexes on purpose: the sockets must stay DARK in both palettes. */
export const SKULL_FACE = HACKER.slice(4, 14).map(r => r.slice(3, 13).replace(/h/g, '.'));
/* knockout keeps ONLY the bone, so the sockets, nose and teeth fall through to
   whatever surface it sits on (the empty states) and it cannot read as a blob */
export const SKULL_FACE_KNOCKOUT = SKULL_FACE.map(r => r.replace(/[^ws]/g, '.'));

/* file-manager icons — folder tab + body, and an .md document.
   'f' / 'h' / 't' map to CSS custom properties so every category
   folder tints itself via --tc without duplicating the art */
/* both states are 14x11 ON PURPOSE: pxSvg keeps the aspect ratio, so a
   9-row closed folder next to an 8-row open one rendered at two different
   heights — the icon visibly squashed as it opened. Equal grids keep the
   silhouette still, and 14x11 is a folder shape instead of a flat slab. */
export const FOLDER_CLOSED = [
  '.kkkkk........',
  'kfffffkkkkkkkk',
  'kffffffffffffk',
  'khhhhhhhhhhhhk',
  'kffffffffffffk',
  'kffffffffffffk',
  'kffffffffffffk',
  'kffffffffffffk',
  'kffffffffffffk',
  'kffffffffffffk',
  'kkkkkkkkkkkkkk',
];
export const FOLDER_OPEN = [
  '.kkkkk........',
  'kfffffkkkkkkkk',
  'kfwwwwwwwwwwfk',
  'kfwwwwwwwwwwfk',
  'kfwwwwwwwwwwfk',
  'kffffffffffffk',
  'kffffffffffffk',
  'kffffffffffffk',
  'kffffffffffffk',
  'kffffffffffffk',
  'kkkkkkkkkkkkkk',
];
export const FILE_MD = [
  'kkkkkkkkk...',
  'kwwwwwwwkk..',
  'kwwwwwwwkwk.',
  'kwwwwwwwkkk.',
  'kwttwwwwwwk.',
  'kwwwwwwwwwk.',
  'kwttttwwwwk.',
  'kwwwwwwwwwk.',
  'kwttwwwwwwk.',
  'kwwwwwwwwwk.',
  'kkkkkkkkkkk.',
];
export const FM_PAL: Record<string, string> = {
  k: '#16130d',
  w: '#f2ede0',
  f: 'var(--fm-tone)',
  h: 'var(--fm-hi)',
  t: 'var(--fm-txt)',
};

/* ==================================================================== */
/*  PIXEL RENDERER — two rules keep this art sharp:                      */
/*  1. INTEGER CELL: one art pixel must span a whole number of CSS px.   */
/*     A fractional cell (18px over a 12-wide grid = 1.5) puts every     */
/*     edge between two device pixels, so columns render 1px or 2px at   */
/*     random and the whole glyph reads soft and uneven.                 */
/*  2. MERGED RECTS: neighbouring cells of one colour become ONE rect.   */
/*     One rect per pixel meant a seam between every pair of neighbours, */
/*     and those seams are what show up as hairlines once scaled.        */
/*  (`image-rendering: pixelated` does nothing for SVG geometry — the    */
/*   equivalent is shape-rendering="crispEdges", set on every svg here.) */
/* ==================================================================== */

interface PxRun { x: number; y: number; w: number; h: number; c: string }

function bbox(cells: string[]) {
  let minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
  cells.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '.') return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }));
  return { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/* horizontal runs first, then merged into the identical run directly above */
function pxRects(cells: string[]): PxRun[] {
  const out: PxRun[] = [];
  let prev: PxRun[] = [];
  cells.forEach((row, y) => {
    const runs: PxRun[] = [];
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === '.') { x += 1; continue; }
      let n = 1;
      while (x + n < row.length && row[x + n] === c) n += 1;
      const above = prev.find(r => r.x === x && r.w === n && r.c === c && r.y + r.h === y);
      if (above) { above.h += 1; runs.push(above); }
      else { const run: PxRun = { x, y, w: n, h: 1, c }; out.push(run); runs.push(run); }
      x += n;
    }
    prev = runs;
  });
  return out;
}

function svgOf(runs: PxRun[], palette: Record<string, string>,
               vb: number[], size: number[], dx = 0, dy = 0): string {
  const body = runs.map(r =>
    `<rect x="${r.x + dx}" y="${r.y + dy}" width="${r.w}" height="${r.h}" fill="${palette[r.c] ?? '#000'}"/>`
  ).join('');
  return `<svg viewBox="0 0 ${vb[0]} ${vb[1]}" width="${size[0]}" height="${size[1]}" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>`;
}

/* crisp-edge SVG string for Astro templates (set:html). `size` is a TARGET
   width — it gets snapped down/up to the nearest whole cell (see rule 1). */
export function pxSvg(cells: string[], palette: Record<string, string>, size = 96): string {
  const w = cells[0].length;
  const h = cells.length;
  const cell = Math.max(1, Math.round(size / w));
  return svgOf(pxRects(cells), palette, [w, h], [w * cell, h * cell]);
}

/* the shared grid for a SET of arts: the largest bounding-box side across all
   of them, so a panel can give every icon an identical box */
export function pxGrid(...arts: string[][]): number {
  return arts.reduce((side, cells) => {
    const b = bbox(cells);
    return Math.max(side, b.w, b.h);
  }, 0);
}

/* panel icons: cropped to the art's real bounding box, then CENTRED in a
   square grid. Every icon fills the same box at the same scale without being
   stretched — the old preserveAspectRatio="none" turned square pixels into
   rectangles, a differently-shaped rectangle for each icon. */
export function pxSquare(cells: string[], palette: Record<string, string>,
                        size = 24, grid = 0): string {
  const b = bbox(cells);
  const cropped = cells.slice(b.minY, b.maxY + 1).map(r => r.slice(b.minX, b.maxX + 1));
  const side = Math.max(grid, b.w, b.h);
  const cell = Math.max(1, Math.round(size / side));
  return svgOf(pxRects(cropped), palette, [side, side], [side * cell, side * cell],
               Math.floor((side - b.w) / 2), Math.floor((side - b.h) / 2));
}
