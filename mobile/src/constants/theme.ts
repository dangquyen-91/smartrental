import { Platform, TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';

export { colors };

// ─── Bán kính bo góc (chuẩn hoá) ───────────────────────────────────────────────
export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

// ─── Khoảng cách ───────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

// ─── Đổ bóng mềm (thay viền phẳng) ─────────────────────────────────────────────
const shadowOf = (
  opacity: number,
  radiusVal: number,
  offsetY: number,
  elevation: number,
): ViewStyle => ({
  shadowColor: '#1a1a0a',
  shadowOpacity: opacity,
  shadowRadius: radiusVal,
  shadowOffset: { width: 0, height: offsetY },
  ...Platform.select({ android: { elevation } }),
});

export const shadow = {
  // Card tĩnh — bóng rất nhẹ
  card: shadowOf(0.06, 10, 4, 2),
  // Phần tử nổi (search bar, FAB, bottom bar)
  float: shadowOf(0.12, 16, 6, 6),
  // Nhấn nhẹ
  soft: shadowOf(0.04, 6, 2, 1),
} as const;

// ─── Typography scale (Be Vietnam Pro) ─────────────────────────────────────────
// Family được map tự động theo fontWeight ở _layout (patch Text.render),
// nên ở đây chỉ cần khai báo size + weight + lineHeight nhất quán.
type T = TextStyle;
export const type = {
  h1: { fontSize: 26, fontWeight: '800', lineHeight: 34 } as T,
  h2: { fontSize: 22, fontWeight: '800', lineHeight: 28 } as T,
  h3: { fontSize: 18, fontWeight: '800', lineHeight: 24 } as T,
  title: { fontSize: 16, fontWeight: '700', lineHeight: 22 } as T,
  body: { fontSize: 15, fontWeight: '400', lineHeight: 21 } as T,
  bodyStrong: { fontSize: 15, fontWeight: '600', lineHeight: 21 } as T,
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 } as T,
  small: { fontSize: 11, fontWeight: '600', lineHeight: 14 } as T,
} as const;

// Map fontWeight → font family Be Vietnam Pro (dùng ở _layout)
export const FONT_FAMILY: Record<string, string> = {
  '400': 'BeVietnamPro_400Regular',
  '500': 'BeVietnamPro_500Medium',
  '600': 'BeVietnamPro_600SemiBold',
  '700': 'BeVietnamPro_700Bold',
  '800': 'BeVietnamPro_800ExtraBold',
  normal: 'BeVietnamPro_400Regular',
  bold: 'BeVietnamPro_700Bold',
};
