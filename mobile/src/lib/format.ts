export function formatPrice(v: number): string {
  if (v == null) return '';
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)} triệu`;
  }
  return v.toLocaleString('vi-VN');
}

export const TYPE_LABEL: Record<string, string> = {
  room: 'Phòng trọ',
  apartment: 'Căn hộ',
  house: 'Nhà nguyên căn',
  studio: 'Studio',
};
