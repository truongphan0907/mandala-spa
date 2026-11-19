# Mandala – Healthcare & Spa · mandalaspamassage.com

Website Astro + Tailwind CSS, chạy trên Cloudflare Workers (web tĩnh + API đặt lịch).

## Sửa nội dung (không cần biết code)

Mọi nội dung nằm trong `src/data/` và `src/content/blog/`. Sửa trên GitHub (biểu tượng bút chì → Commit), Cloudflare tự cập nhật web sau khoảng 2 phút.

| Muốn sửa | File |
|---|---|
| Hotline, Zalo, địa chỉ, giờ mở cửa, điểm Google | `src/data/info.json` |
| Dịch vụ, giá, thời lượng, mô tả, FAQ từng nhóm | `src/data/services.json` |
| Nội dung trang chủ (hero, hành trình, không gian, đánh giá khách) | `src/data/home.json` |
| Trang Giới thiệu | `src/data/about.json` |
| Trang Hỏi đáp | `src/data/faq.json` |
| Bài blog | `src/content/blog/*.md` (copy một bài có sẵn, đổi nội dung) |
| Màu thương hiệu, font | `src/styles/global.css` (khối `@theme`) |

**Mẹo:**
- Giá để `0` → web tự hiện "Liên hệ".
- `"duration": "60 phút"` → thời lượng hiện cạnh tên dịch vụ (để trống thì ẩn).
- `"featured": true` → dịch vụ hiện ở mục "Liệu trình được yêu thích" trên trang chủ.
- Thêm đánh giá khách vào `home.json` → `"reviews": [{ "name": "Chị Lan", "text": "..." }]`.
- Có điểm Google thì điền `"googleRating": "4.9"` và `"googleReviewCount": "120"` trong `info.json`.

## Ảnh

- Ảnh nằm trong `src/assets/images/`. Tải ảnh JPG gốc (cạnh dài ≤ 2400px), đặt tên không dấu, không khoảng trắng.
- Khi build, web tự chuyển ảnh sang AVIF/WebP và nhiều kích cỡ cho điện thoại/máy tính.
- Gọi ảnh trong file JSON bằng tên file, ví dụ `"image": "khu-goi-dau.jpg"`.
- Logo: `public/logo-mandala.svg` (bản tròn nâu – vàng), `public/logo-mandala-nau.svg` (bản nét nâu).

## Chạy trên máy

```bash
npm install
npm run dev        # xem giao diện: http://localhost:4321
npm run preview    # chạy giống thật (cả API đặt lịch): http://localhost:8787
```

## Cấu trúc

```
src/data/           nội dung (JSON)
src/content/blog/   bài viết (Markdown)
src/assets/images/  ảnh gốc
src/pages/          các trang
src/components/     header, footer, thanh liên hệ đáy màn hình, form đặt lịch…
worker/index.js     API /api/booking (gửi Telegram, chống spam Turnstile)
wrangler.jsonc      cấu hình Cloudflare
```

## Cloudflare

- Build command: `npm run build` · Deploy command: `npx wrangler deploy`
- Nếu code nằm trong thư mục con `mandala-spa/` của repo: Root directory = `mandala-spa`

### Nhận thông báo đặt lịch qua Telegram
1. Telegram → **@BotFather** → `/newbot` → lấy **token**.
2. Nhắn 1 tin cho bot (hoặc thêm bot vào nhóm), mở `https://api.telegram.org/bot<TOKEN>/getUpdates` để lấy **chat id**.
3. Cloudflare → Worker → **Settings → Variables and Secrets** → thêm Secret `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

Chưa cấu hình thì lịch hẹn vẫn được ghi trong **Logs** của Worker.

### Chống spam form (Turnstile)
1. Cloudflare → **Turnstile** → Add widget → domain `mandalaspamassage.com`.
2. Dán **Site Key** vào `turnstileSiteKey` trong `src/data/info.json`, commit, chờ build xong.
3. Sau đó thêm Secret `TURNSTILE_SECRET_KEY` vào Worker.
