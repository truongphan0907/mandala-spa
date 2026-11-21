// API đặt lịch: nhận form → kiểm tra chống spam (Turnstile) → báo về Telegram + lưu vào Google Sheets.
// Mọi đường dẫn khác được Cloudflare trả về file tĩnh trong thư mục dist.

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const clean = (v, max = 300) => String(v ?? '').trim().slice(0, max);

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function verifyTurnstile(token, secret, ip) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const out = await res.json();
  return out.success === true;
}

async function handleBooking(request, env) {
  if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: 'Dữ liệu không hợp lệ' }, 400);
  }

  // Bẫy bot: trường ẩn "website" phải để trống
  if (clean(data.website)) return json({ ok: true });

  const booking = {
    name: clean(data.name, 80),
    phone: clean(data.phone, 20),
    service: clean(data.service, 120),
    date: clean(data.date, 20),
    time: clean(data.time, 10),
    guests: clean(data.guests, 3),
    note: clean(data.note, 500),
    page: clean(data.page, 200),
    lang: clean(data.lang, 5) || 'vi',
  };

  if (!booking.name || !/^[0-9+\s.-]{8,20}$/.test(booking.phone)) {
    return json({ ok: false, error: 'Vui lòng nhập họ tên và số điện thoại hợp lệ.' }, 400);
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstile(
      clean(data['cf-turnstile-response'], 2048),
      env.TURNSTILE_SECRET_KEY,
      request.headers.get('CF-Connecting-IP'),
    );
    if (!ok) return json({ ok: false, error: 'Xác minh chống spam thất bại, vui lòng thử lại.' }, 400);
  }

  // Khách đặt từ trang tiếng nước ngoài → báo rõ cho lễ tân
  const LANG_LABEL = { en: '🇬🇧 tiếng Anh', ja: '🇯🇵 tiếng Nhật', ko: '🇰🇷 tiếng Hàn', zh: '🇨🇳 tiếng Trung' };
  const foreign = LANG_LABEL[booking.lang];

  const lines = [
    '🌿 <b>LỊCH HẸN MỚI – Mandala Healthcare &amp; Spa</b>',
    foreign ? `🌐 <b>Khách nước ngoài – đặt từ trang ${foreign}</b>` : '',
    `👤 ${escapeHtml(booking.name)}`,
    `📞 ${escapeHtml(booking.phone)}`,
    `💆 ${escapeHtml(booking.service || 'Chưa chọn')}`,
    `📅 ${escapeHtml(booking.date || '?')} – ${escapeHtml(booking.time || '?')}`,
    `👥 ${escapeHtml(booking.guests || '1')} khách`,
    booking.note ? `📝 ${escapeHtml(booking.note)}` : '',
  ].filter(Boolean);

  // Thời điểm gửi theo giờ Việt Nam
  const createdAt = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  if (booking.page) lines.push(`🔗 ${escapeHtml(booking.page)}`);
  lines.push(`🕒 ${createdAt}`);

  const tasks = [];

  // 1) Telegram: báo ngay cho quản lý
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    tasks.push(
      fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: lines.join('\n'),
          parse_mode: 'HTML',
        }),
      }).then(async (res) => {
        if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
        return 'telegram';
      }),
    );
  }

  // 2) Google Sheets: lưu lại để thống kê (qua Google Apps Script Web App)
  if (env.SHEETS_WEBHOOK_URL) {
    tasks.push(
      fetch(env.SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret: env.SHEETS_SECRET || '', createdAt, ...booking }),
      }).then(async (res) => {
        const text = await res.text();
        if (!res.ok || !text.includes('"ok":true')) throw new Error(`Sheets ${res.status}: ${text.slice(0, 200)}`);
        return 'sheets';
      }),
    );
  }

  // Luôn ghi log để không mất lịch hẹn nếu cả hai kênh lỗi
  console.log('BOOKING', JSON.stringify({ createdAt, ...booking }));

  if (tasks.length) {
    const results = await Promise.allSettled(tasks);
    results.filter((r) => r.status === 'rejected').forEach((r) => console.error(String(r.reason)));
    // Chỉ báo lỗi cho khách khi KHÔNG kênh nào nhận được
    if (!results.some((r) => r.status === 'fulfilled')) {
      return json({ ok: false, error: 'Chưa gửi được, vui lòng gọi hotline 0395 546 979.' }, 502);
    }
  }

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/booking') return handleBooking(request, env);
    if (url.pathname.startsWith('/api/')) return json({ ok: false, error: 'Not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
