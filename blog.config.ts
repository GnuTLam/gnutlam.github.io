/* ============================================================
 *  BLOG.CONFIG — file cấu hình nội dung DUY NHẤT của site.
 *  Điền nội dung của bạn vào đây; mọi trang render từ file này.
 *  Sửa xong: dev server tự reload · publish = commit + push.
 *
 *  Chỉ có bài viết (mỗi bài một thư mục — tạo, xem thử, đăng
 *  bằng `npm run post -- <thư mục>`) và categories
 *  (src/data/topics.ts) nằm ngoài file này.
 *
 *  AVATAR (home.avatar, about.avatar):
 *    'mascot'            → bộ xương pixel có sẵn của theme
 *    '/avatar.png'       → ảnh của bạn: bỏ file vào thư mục public/
 *                          rồi ghi đường dẫn bắt đầu bằng '/'
 *                          (png · jpg · gif · webp · svg; ảnh vuông đẹp nhất)
 * ============================================================ */

interface BlogConfig {
  site: {
    domain: string;      /* thương hiệu + đuôi <title> của mọi trang      */
    user: string;        /* nửa trái của prompt  →  user@host             */
    host: string;        /* nửa phải của prompt                           */
    osName: string;      /* tên "hệ điều hành" của theme (VD: GNUT/OS)    */
    osVer: string;       /* số phiên bản hiện ở neofetch                  */
    osFlavor: string;    /* dòng phụ sau số phiên bản                     */
    kernel: string;      /* dòng Kernel ở neofetch                        */
    since: number;       /* năm bắt đầu viết — dòng Uptime + © footer     */
    tagline: string;     /* đuôi <title> trang chủ                        */
    description: string; /* <meta name="description"> mặc định            */
    url: string;         /* địa chỉ site: https://<username>.github.io    */
  };
  home: {
    title: string;       /* dòng 1 tiêu đề hero (chữ thường)              */
    titleAccent: string; /* dòng 2 — tô màu accent                        */
    lede: string;        /* câu mở đầu; domain tự thêm vào trước;
                            **hai dấu sao** = in đậm                      */
    shell: string;       /* dòng Shell ở neofetch                         */
    editor: string;      /* dòng Editor ở neofetch                        */
    avatar: string;      /* 'mascot' hoặc '/ảnh-trong-public.png' (xem trên) */
  };
  about: {
    description: string; /* mô tả trang about (Google) + dòng 2 của `whoami` */
    role: string;        /* dòng nghề nghiệp dưới tên + dòng 1 của `whoami` */
    stack: string[];     /* công cụ chính — trùng một tag thật thì thành
                            link tới /tags/<tag>/, không thì hiện chữ thường */
    bio: string[];       /* đoạn giới thiệu — mỗi phần tử = 1 đoạn văn    */
    now: { k: string; v: string }[]; /* mục "# now" — đang làm gì         */
    status: string;      /* dòng status bar của cửa sổ shell              */
    avatar: string;      /* 'mascot' hoặc '/ảnh-trong-public.png' (xem trên) */
  };
  socials: { key: string; label: string; href: string }[];
                         /* href '#' = chưa điền (link vẫn hiện, trỏ về #) */
}

const config: BlogConfig = {
  site: {
    domain:   'gnut.dev',
    user:     'gnut',
    host:     'gnutos',
    osName:   'GNUT/OS',
    osVer:    '7.4',
    osFlavor: 'linux edition',
    kernel:   'astro-6.4-static',
    since:    2021,
    tagline:  'IT Field Notes on GNUT/OS',
    description:
      'An information technology field journal — systems, networks, infrastructure, and code, served from a riced Linux desktop.',
    url:      'https://gnutlam.github.io/',
  },

  home: {
    title:       'IT FIELD NOTES,',
    titleAccent: 'COMPILED FROM SOURCE',
    lede: 'is an information-technology journal running on GNUT/OS: systems, networks, infrastructure, and code. Deep‑dives, 3AM post‑mortems, and the occasional manifesto — **no sponsored content, no AI summaries.**',
    shell:  'zsh 5.9',
    editor: 'nvim (btw)',
    avatar: 'mascot',
  },

  about: {
    description: 'IT engineer building payments infrastructure, agent orchestrators, and high-throughput data pipelines.',
    role: 'IT engineer — infrastructure · UTC+7',
    stack: ['rust', 'postgres', 'spark', 'linux'],
    bio: [
      'I build the IT infrastructure other engineers never have to think about — payments ledgers, agent orchestrators, and data pipelines that move terabytes without melting the fleet.',
      "This blog is my field journal: **the work, written down while it's still fresh** — what broke at 3AM, why, and what it taught me.",
    ],
    now: [
      { k: 'building', v: 'a crash-only agent orchestrator in Rust' },
      { k: 'reading',  v: 'Designing Data-Intensive Applications (again)' },
      { k: 'running',  v: 'a 1M-connection WebSocket fleet in prod' },
    ],
    status: 'open to interesting problems',
    avatar: 'mascot',
  },

  socials: [
    { key: 'github', label: 'GITHUB',   href: 'https://github.com/GnuTLam' },
    { key: 'x',      label: 'X.COM',    href: '#'        },
    { key: 'rss',    label: 'RSS.XML',  href: '/rss.xml' },
    { key: 'mail',   label: 'MAIL.LOG', href: '#'        },
  ],
};

export default config;
