# Mandala Spa & Massage – mandalaspamassage.com

Website Astro + Tailwind CSS, chạy trên Cloudflare Workers (static assets + API đặt lịch).

## Sửa nội dung thường gặp (không cần biết code)

| Muốn sửa | File |
|---|---|
| Hotline, Zalo, địa chỉ, giờ mở cửa, slogan | `src/data/info.json` |
| Dịch vụ, thời lượng, giá | `src/data/services.json` (`"featured": true` = hiện ở trang chủ) |
| Viết bài blog | Thêm file `.md` vào `src/content/blog/` (copy bài mẫu, đổi tiêu đề/ngày) |
| Màu thương hiệu, font | `src/styles/global.css` (khối `@theme`) |
| Ảnh | Bỏ ảnh `.webp` vào `public/images/`, thay các khối `photo-placeholder` trong trang |

Sửa trực tiếp trên GitHub (biểu tượng bút chì → Commit) → Cloudflare tự cập nhật web sau ~1 phút.

## Chạy trên máy

```bash
npm install
npm run dev        # xem thử giao diện: http://localhost:4321
npm run preview    # chạy giống thật (cả API đặt lịch): http://localhost:8787
```

## Cấu trúc

```
src/data/          ← nội dung (JSON)
src/content/blog/  ← bài viết (Markdown)
src/pages/         ← các trang: index, dich-vu, gioi-thieu, lien-he, blog
src/components/    ← Header, Footer, form đặt lịch, nút Gọi/Zalo/Messenger…
worker/index.js    ← API /api/booking (gửi Telegram, chống spam Turnstile)
wrangler.jsonc     ← cấu hình Cloudflare
```

## Deploy lên Cloudflare (làm 1 lần)

1. Đẩy code này lên repo GitHub `mandala-spa`.
2. Cloudflare → **Workers & Pages** → **Create** → **Import a repository** → chọn repo.
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
3. Worker `mandala-spa` → **Settings → Domains & Routes** → thêm `mandalaspamassage.com` và `www.mandalaspamassage.com`.

## Nhận thông báo đặt lịch qua Telegram

1. Telegram → chat với **@BotFather** → `/newbot` → lấy **token**.
2. Nhắn 1 tin bất kỳ cho bot (hoặc thêm bot vào nhóm nhân viên), rồi mở
   `https://api.telegram.org/bot<TOKEN>/getUpdates` để lấy **chat id**.
3. Cloudflare → Worker → **Settings → Variables and Secrets** → thêm (loại Secret):
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

Chưa cấu hình thì lịch hẹn vẫn được ghi vào **Logs** của Worker.

## Chống spam form (Turnstile – khuyên dùng)

1. Cloudflare → **Turnstile** → Add widget → domain `mandalaspamassage.com`.
2. Dán **Site Key** vào `turnstileSiteKey` trong `src/data/info.json`.
3. Thêm **Secret Key** vào Worker với tên `TURNSTILE_SECRET_KEY`.

## Việc còn lại
- [ ] Thay thông tin thật trong `info.json`, `services.json`
- [ ] Thay ảnh tạm bằng ảnh thật; thêm `public/og-image.jpg` (1200×630) để chia sẻ Facebook/Zalo đẹp
- [ ] Sửa nội dung trang Giới thiệu, đội ngũ, đánh giá khách hàng (`src/pages/`)
- [ ] Lấy link nhúng Google Maps thật (Google Maps → Chia sẻ → Nhúng bản đồ) vào `mapEmbedUrl`
- [ ] Đăng ký Google Search Console, gửi `https://mandalaspamassage.com/sitemap-index.xml`
