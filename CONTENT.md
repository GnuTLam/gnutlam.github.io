# Hướng dẫn sử dụng blog

## 1. Sửa nội dung trang — `blog.config.ts`

Mọi chữ trên trang chủ (main) và trang about nằm trong **một file**:
[`blog.config.ts`](blog.config.ts). Từng trường có chú thích tiếng Việt ngay
trong file. Lưu lại là dev server tự reload.

| Khối | Gồm |
| --- | --- |
| `site` | tên/domain, prompt (`gnut@gnutos`), tên OS, tagline, mô tả, địa chỉ site (`url`) |
| `home` | tiêu đề 2 dòng, câu lede, dòng Shell/Editor ở neofetch, **avatar** |
| `about` | nghề, bio (mỗi phần tử = 1 đoạn), mục `now`, `stack`, status, **avatar** |
| `socials` | link GitHub/X/Mail — `href: '#'` = chưa điền |

Bọc chữ trong `**hai dấu sao**` để in đậm (lede, bio).

### Avatar (trang main và about)

```ts
avatar: 'mascot',          // bộ xương pixel có sẵn
avatar: '/avatar.png',     // ảnh của bạn
```

Để dùng ảnh riêng: chép ảnh vào thư mục `public/` (ví dụ `public/avatar.png`)
rồi ghi đường dẫn bắt đầu bằng `/`. Hỗ trợ png, jpg, gif, webp, svg; ảnh
**vuông** là đẹp nhất (ảnh được cắt vừa khung, không bị méo). Hai trang đặt
riêng được, ví dụ main dùng mascot, about dùng ảnh thật. Ghi sai đường dẫn thì
build báo lỗi ngay, nên không lo lên site bị vỡ ảnh.

## 2. Viết và đăng bài — `npm run post`

**Mỗi bài là một thư mục**, đặt ở đâu cũng được (ví dụ `D:/blog/kafka-notes`).
Tên thư mục chính là đường dẫn của bài: `/posts/kafka-notes/`.

```
D:/blog/kafka-notes/
├── index.md          ← nội dung bài
└── images/           ← ảnh của bài
    ├── kien-truc.png
    └── partition.png
```

Chỉ cần nhớ **một lệnh**:

```bash
npm run post -- D:/blog/kafka-notes
```

Đường dẫn có dấu cách thì đặt trong ngoặc kép: `npm run post -- "D:/blog/Kafka Notes"`.

### Lần 1: tạo bài

Thư mục chưa có thì CLI tạo `index.md` và thư mục `images/`, rồi hỏi lần lượt:

```
? Tiêu đề: Ghi chép về Kafka
? Mô tả một dòng (hiện ở mọi danh sách): Kafka không phải hàng đợi…
  category ↔ tag:  RUST & ASYNC: rust tokio actors  ·  STORAGE: postgres queues …
? Tags, cách nhau bởi dấu phẩy: kafka, queues
  → category STORAGE
? Ngày đăng YYYY-MM-DD (Enter = giữ nguyên / hôm nay) [2026-10-09]:
? Ghim lên đầu danh sách? (y/n) [n]:
? Chữ trên banner (Enter = tag đầu tiên):
```

Sau đó bạn viết bài vào `index.md` và bỏ ảnh vào `images/`.

### Lần 2 trở đi: xem thử, đăng, cập nhật

Chạy lại **đúng lệnh đó**. CLI hỏi lại các trường, giá trị cũ để trong `[...]`,
nhấn Enter là giữ nguyên. Sau đó nó kiểm tra bài và ảnh rồi hỏi:

```
? Làm gì tiếp? 1 = xem thử, 2 = đăng lên site, 3 = thoát [2]:
```

- **1 = xem thử:** chép bài vào blog dạng nháp, chưa commit. Chạy `npm run dev`
  rồi mở http://localhost:4321/posts/kafka-notes/.
- **2 = đăng:** build thử toàn bộ site, commit **chỉ** bài đó (kèm ảnh), rồi
  push lên GitHub. Khoảng 1–2 phút sau bài lên site. Build lỗi thì blog được
  trả về nguyên trạng.

**Cập nhật bài đã đăng:** sửa thư mục rồi chạy lại lệnh. Blog luôn là **bản sao
y hệt** thư mục của bạn: ảnh thêm mới thì được đưa lên, ảnh xoá hoặc đổi tên
thì bản cũ được gỡ khỏi blog. Ngày đăng giữ nguyên, trừ khi bạn nhập ngày khác.

### Ảnh trong bài

Mỗi ảnh nằm trên **một dòng riêng**, đường dẫn **tương đối** tính từ thư mục bài:

```markdown
![Kiến trúc tổng thể](images/kien-truc.png "Hình 1 — luồng dữ liệu")
```

- Phần trong ngoặc kép là chú thích dưới ảnh (tuỳ chọn).
- Viết như vậy thì VS Code, Obsidian… cũng xem trước được ảnh.
- Hỗ trợ png, jpg, gif, webp, avif, svg. Ảnh nặng hơn 2 MB sẽ được nhắc nén lại.
- Tên file có dấu cách thì trong bài viết `%20` thay dấu cách
  (`images/kien%20truc.png`). Cách tốt nhất là đặt tên không dấu cách.
- Ảnh ghi sai tên: CLI dừng và chỉ đúng **dòng nào, ảnh nào** bị thiếu.
- Ảnh có trong thư mục nhưng bài không dùng thì **không** được đưa lên.
- Ảnh đầu tiên của bài tự thành ảnh xem trước khi chia sẻ link lên
  Facebook/X/Zalo.

### Không muốn trả lời câu hỏi

| Tuỳ chọn | Tác dụng |
| --- | --- |
| `--yes` | giữ mọi giá trị hiện có, không hỏi |
| `--preview` | xem thử luôn, không hỏi |
| `--publish` | đăng luôn, không hỏi |
| `--no-push` | chỉ commit, tự `git push` sau |

Ví dụ sửa lỗi chính tả rồi đăng lại ngay:

```bash
npm run post -- D:/blog/kafka-notes --yes --publish
```

Thư mục chỉ có một file `.md` với tên khác (ví dụ ghi chú cũ `redis.md`) cũng
dùng được: CLI nhận file đó làm bài.

### Header của một bài

CLI tự ghi phần này từ câu trả lời của bạn; sửa tay cũng được.

```yaml
---
id:      2
title:   "Tiêu đề bài"
excerpt: "Mô tả một dòng, hiện ở mọi danh sách."
iso:     "2026-10-06"
tags:    ["postgres", "queues"]
preview: "QUEUES"      # chữ trên banner — bỏ trống thì lấy tag đầu tiên
pinned:  true          # ghim lên đầu (tuỳ chọn)
---
```

Thời gian đọc và số từ được **tự tính** từ nội dung, không cần ghi.

Xem `src/content/posts/kitchen-sink-test/index.md` (một bản nháp) để biết mọi loại
block mà blog hỗ trợ: heading, code, bảng, callout `:::tip` / `:::warn`,
sơ đồ, ảnh, task list…

## 3. Categories & tags — `src/data/topics.ts`

Mỗi category có `key` (thành URL `/categories/<key>/`), `title`, `desc` và
danh sách `tags` thuộc về nó. Một bài thuộc đúng **một** category: category
đầu tiên trong danh sách có chứa một tag của bài. Bài không khớp tag nào sẽ
vào category cuối cùng. `npm run post` cảnh báo khi gặp tag chưa thuộc
category nào.

## 4. Màu sắc / theme — `src/styles/theme.css`

Biến màu nằm ở đầu file (`:root`, `[data-palette="light"]`). Light là theme chính.

## 5. Deploy lên GitHub Pages

Làm một lần:

1. Tạo repo tên **`GnuTLam.github.io`** trên GitHub. Phải đúng tên này, vì site
   phải nằm ở gốc tên miền.
2. Nối repo và đẩy code lên:
   ```bash
   git remote add origin https://github.com/GnuTLam/GnuTLam.github.io.git
   git push -u origin master
   ```
3. Trên GitHub: **Settings → Pages → Source: GitHub Actions**.

Từ đó mỗi lần push (hoặc đăng bằng `npm run post`) là site tự cập nhật tại
https://gnutlam.github.io.

Dùng tên miền riêng: tạo file `public/CNAME` chứa tên miền, rồi đặt biến
`SITE_URL` (Settings → Secrets and variables → Actions → Variables) thành địa
chỉ đó.
