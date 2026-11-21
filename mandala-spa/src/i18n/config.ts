// Cấu hình đa ngôn ngữ.
// Muốn bật thêm một ngôn ngữ: thêm mã vào ENABLED (sau khi đã có đủ file dịch trong src/data/<mã>/ và src/i18n/ui.ts).
export const LANGS = ['vi', 'en', 'ja', 'ko', 'zh'] as const;
export type Lang = (typeof LANGS)[number];

export const ENABLED: Lang[] = ['vi', 'en', 'ja', 'ko', 'zh'];
export const FOREIGN = ENABLED.filter((l) => l !== 'vi') as Exclude<Lang, 'vi'>[];

export const LANG_META: Record<Lang, { label: string; short: string; html: string; og: string; flag: string; viName: string }> = {
  vi: { label: 'Tiếng Việt', short: 'VI', html: 'vi', og: 'vi_VN', flag: '🇻🇳', viName: 'tiếng Việt' },
  en: { label: 'English', short: 'EN', html: 'en', og: 'en_US', flag: '🇬🇧', viName: 'tiếng Anh' },
  ja: { label: '日本語', short: 'JA', html: 'ja', og: 'ja_JP', flag: '🇯🇵', viName: 'tiếng Nhật' },
  ko: { label: '한국어', short: 'KO', html: 'ko', og: 'ko_KR', flag: '🇰🇷', viName: 'tiếng Hàn' },
  zh: { label: '中文', short: 'ZH', html: 'zh-Hans', og: 'zh_CN', flag: '🇨🇳', viName: 'tiếng Trung' },
};

/** Ngôn ngữ của trang hiện tại, dựa vào đường dẫn (/en/..., /ja/...). Mặc định tiếng Việt. */
export function getLang(url: URL): Lang {
  const seg = url.pathname.split('/')[1] as Lang;
  return seg !== 'vi' && (ENABLED as string[]).includes(seg) ? seg : 'vi';
}

// ---- Đường dẫn từng trang theo ngôn ngữ ----
export type PageKey = 'home' | 'services' | 'prices' | 'about' | 'contact' | 'faq' | 'policy';

const VI_PATH: Record<PageKey, string> = {
  home: '/', services: '/dich-vu/', prices: '/bang-gia/', about: '/gioi-thieu/',
  contact: '/lien-he/', faq: '/hoi-dap/', policy: '/chinh-sach/',
};
const FX_PATH: Record<PageKey, string> = {
  home: '', services: 'services/', prices: 'price-list/', about: 'about/',
  contact: 'contact/', faq: 'faq/', policy: 'policy/',
};
/** Đường dẫn nhóm dịch vụ cho bản tiếng nước ngoài */
export const SERVICE_SLUG: Record<string, string> = {
  'massage-tri-lieu': 'massage-therapy',
  'goi-dau-duong-sinh': 'head-spa',
  'dong-y-duong-sinh': 'oriental-wellness',
  'cham-soc-da': 'facial-care',
};

export function url(lang: Lang, key: PageKey): string {
  return lang === 'vi' ? VI_PATH[key] : `/${lang}/${FX_PATH[key]}`;
}
export function serviceUrl(lang: Lang, viSlug: string): string {
  return lang === 'vi' ? `/dich-vu/${viSlug}/` : `/${lang}/services/${SERVICE_SLUG[viSlug] ?? viSlug}/`;
}
export const bookUrl = (lang: Lang, service?: string) =>
  url(lang, 'contact') + (service ? `?dv=${encodeURIComponent(service)}` : '') + '#dat-lich';

/** Các phiên bản ngôn ngữ của cùng một trang (dùng cho nút chọn ngôn ngữ + hreflang). null = trang chỉ có tiếng Việt. */
export function alternates(pathname: string): Record<Lang, string> | null {
  const lang = getLang(new URL(pathname, 'https://x'));
  const rest = lang === 'vi' ? pathname : pathname.slice(lang.length + 1);
  const build = (fn: (l: Lang) => string) =>
    Object.fromEntries(ENABLED.map((l) => [l, fn(l)])) as Record<Lang, string>;

  for (const key of Object.keys(VI_PATH) as PageKey[]) {
    if (rest === (lang === 'vi' ? VI_PATH[key] : '/' + FX_PATH[key])) return build((l) => url(l, key));
  }
  for (const [vi, fx] of Object.entries(SERVICE_SLUG)) {
    if (rest === (lang === 'vi' ? `/dich-vu/${vi}/` : `/services/${fx}/`)) return build((l) => serviceUrl(l, vi));
  }
  return null;
}
