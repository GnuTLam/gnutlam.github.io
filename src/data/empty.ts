/* the empty-state mark — Skelamton's knockout skull (bone only, sockets fall
   through to the panel) in the quiet body ink, cropped from the mascot's own
   pixels (SKULL_FACE_KNOCKOUT). 10x10 cells at 6px = 60px. */
import { SKULL_FACE_KNOCKOUT, pxSvg } from './pixel';

export const EMPTY_SKULL = pxSvg(SKULL_FACE_KNOCKOUT, { w: 'var(--dim)', s: 'var(--dim)' }, 60);
