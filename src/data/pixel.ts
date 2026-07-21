/* shared pixel art — Tux fronts the home hero (the OS); the about page
   gets the human behind it (DEV below) */

export const TUX_PAL: Record<string, string> = { k: '#1b1b1b', w: '#f2f2ea', o: '#f0a63a', e: '#ffffff' };

export const TUX = [
  '....kkkk....',
  '...kkkkkk...',
  '..kkekkekk..',
  '..kkekkekk..',
  '..kkoookkk..',
  '..kkwwwwkk..',
  '.kkwwwwwwkk.',
  '.kkwwwwwwkk.',
  'kkkwwwwwwkkk',
  'kkwwwwwwwwkk',
  'kkwwwwwwwwkk',
  '.kwwwwwwwwk.',
  '.kkwwwwwwkk.',
  '.ooo.kk.ooo.',
];

/* the human behind the OS — headphones on, hoodie in phosphor amber */
export const DEV_PAL: Record<string, string> = {
  k: '#1b1b1b', h: '#4e3a2a', s: '#e8c39e', o: '#f0a63a', w: '#f2f2ea',
};

export const DEV = [
  '...kkkkkk...',
  '..khhhhhhk..',
  '.khhhhhhhhk.',
  'kkhhhhhhhhkk',
  'oohsssssshoo',
  'oossksskssoo',
  'oossssssssoo',
  '..ssssssss..',
  '...ssssss...',
  '.ooossssooo.',
  'oooowoowoooo',
  'oooowoowoooo',
  'oooooooooooo',
  'oooooooooooo',
];

/* file-manager icons — folder tab + body, and an .md document.
   'f' / 'h' / 't' map to CSS custom properties so every category
   folder tints itself via --tc without duplicating the art */
export const FOLDER_CLOSED = [
  '.kkkkk........',
  'kfffffkkkkkkkk',
  'kffffffffffffk',
  'khhhhhhhhhhhhk',
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

/* crisp-edge SVG string for Astro templates (set:html) */
export function pxSvg(cells: string[], palette: Record<string, string>, size = 96): string {
  const w = cells[0].length;
  const h = cells.length;
  const rects = cells.flatMap((row, y) =>
    [...row].map((c, x) =>
      c === '.' ? '' : `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[c] ?? '#000'}"/>`
    )
  ).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="${size}" height="${(size / w) * h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}
