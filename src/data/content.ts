/* PAGE COPY — all values live in blog.config.ts, edit there, never here */
import config from '../../blog.config';

export const HOME  = config.home;
export const ABOUT = config.about;

/* the avatar value that draws the built-in pixel mascot instead of an image */
export const MASCOT = 'mascot';

/* split a copy string on **bold** markers → [{ b, t }] segments */
export function em(s: string): { b: boolean; t: string }[] {
  return s.split(/\*\*(.+?)\*\*/g).map((t, i) => ({ b: i % 2 === 1, t })).filter(seg => seg.t !== '');
}
