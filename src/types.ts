export interface PostData {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  date: string;
  iso: string;
  tags: string[];
  read: string;
  preview: string;
  pinned: boolean;
  draft: boolean;
}
