import type { ImageMetadata } from 'astro';

// Tất cả ảnh trong src/assets/images/ – gọi theo tên file, ví dụ img('phong-bon-go.jpg')
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/images/*.{jpg,jpeg,png,webp}', {
  eager: true,
});

export function img(name?: string): ImageMetadata | undefined {
  if (!name) return undefined;
  const hit = Object.entries(files).find(([path]) => path.endsWith('/' + name));
  if (!hit) throw new Error(`Không tìm thấy ảnh: src/assets/images/${name}`);
  return hit[1].default;
}

export const vnd = (n: number) => (n > 0 ? new Intl.NumberFormat('vi-VN').format(n) + 'đ' : 'Liên hệ');

export const formatDate = (d: Date) =>
  d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const nav = [
  { href: '/dich-vu/', label: 'Dịch vụ' },
  { href: '/bang-gia/', label: 'Bảng giá' },
  { href: '/gioi-thieu/', label: 'Giới thiệu' },
  { href: '/blog/', label: 'Blog' },
  { href: '/lien-he/', label: 'Liên hệ' },
];
