export interface PostData {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  iso: string;
  tags: string[];
  read: string;      /* "7 MIN READ" — computed from the body, see data/words.ts */
  preview: string;
  pinned: boolean;
  draft: boolean;
}
