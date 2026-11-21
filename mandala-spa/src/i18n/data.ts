// Ghép nội dung tiếng Việt (gốc: giá, ảnh, video, đường dẫn) với bản dịch trong src/data/<mã>/*.json.
// Bản dịch chỉ chứa chữ; giá và ảnh luôn lấy từ bản tiếng Việt nên không bao giờ bị lệch.
import type { Lang } from './config';
import viInfo from '../data/info.json';
import viHome from '../data/home.json';
import viServices from '../data/services.json';
import viAbout from '../data/about.json';
import viFaq from '../data/faq.json';
import viVideos from '../data/videos.json';

const files = import.meta.glob<{ default: unknown }>('../data/*/*.json', { eager: true });
const tr = (lang: Lang, name: string): any => files[`../data/${lang}/${name}.json`]?.default;

/** Ghép sâu: object theo khóa, mảng object theo thứ tự, mảng chữ thì thay cả mảng */
function merge<T>(base: T, over: any): T {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(over)) return base;
    if (base.every((x) => typeof x === 'object' && x !== null)) return base.map((b, i) => merge(b, over[i])) as T;
    return over as T;
  }
  if (typeof base === 'object' && base !== null) {
    const out: any = { ...base };
    for (const k of Object.keys(over)) out[k] = k in out ? merge(out[k], over[k]) : over[k];
    return out;
  }
  return over as T;
}

const pick = <T>(lang: Lang, name: string, base: T): T => (lang === 'vi' ? base : merge(base, tr(lang, name)));

export const getInfo = (lang: Lang) => pick(lang, 'info', viInfo);
export const getHome = (lang: Lang) => pick(lang, 'home', viHome);
export const getAbout = (lang: Lang) => pick(lang, 'about', viAbout);
export const getFaq = (lang: Lang) => pick(lang, 'faq', viFaq);
export const getVideos = (lang: Lang) => pick(lang, 'videos', viVideos);

/** Dịch vụ: mỗi liệu trình có thêm viName (tên tiếng Việt) để lễ tân nhận ra khi khách đặt từ bản nước ngoài */
export function getServices(lang: Lang) {
  const s = pick(lang, 'services', viServices);
  return {
    groups: s.groups.map((g, gi) => ({ ...g, items: g.items.map((it, ii) => ({ ...it, viName: viServices.groups[gi].items[ii].name })) })),
    combos: s.combos.map((c, ci) => ({ ...c, viName: viServices.combos[ci].name })),
  };
}

/** Giá: tiếng Việt "249.000đ", nước ngoài "249,000 VND"; 0 = liên hệ */
export function price(lang: Lang, n: number, onRequest: string) {
  if (!(n > 0)) return onRequest;
  return lang === 'vi' ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : new Intl.NumberFormat('en-US').format(n) + ' VND';
}
