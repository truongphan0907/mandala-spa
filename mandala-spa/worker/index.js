// API đặt lịch: nhận form → kiểm tra chống spam (Turnstile) → gửi thông báo về Telegram.
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

  const lines = [
    '🌿 <b>LỊCH HẸN MỚI – Mandala Spa</b>',
    `👤 ${escapeHtml(booking.name)}`,
    `📞 ${escapeHtml(booking.phone)}`,
    `💆 ${escapeHtml(booking.service || 'Chưa chọn')}`,
    `📅 ${escapeHtml(booking.date || '?')} – ${escapeHtml(booking.time || '?')}`,
    `👥 ${escapeHtml(booking.guests || '1')} khách`,
    booking.note ? `📝 ${escapeHtml(booking.note)}` : '',
  ].filter(Boolean);

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: lines.join('\n'),
        parse_mode: 'HTML',
      }),
    });
    if (!res.ok) {
      console.error('Telegram error', res.status, await res.text());
      return json({ ok: false, error: 'Chưa gửi được, vui lòng gọi hotline.' }, 502);
    }
  } else {
    // Chưa cấu hình Telegram: ghi vào log của Worker để không mất lịch hẹn
    console.log('BOOKING', JSON.stringify(booking));
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
