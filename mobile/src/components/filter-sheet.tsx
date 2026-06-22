import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import PressableScale from '@/components/ui/pressable-scale';
import type { PropertyType } from '@/types/property';

export interface Filters {
  type: PropertyType | 'all';
  minPrice?: number;
  maxPrice?: number;
}

const TYPES: { label: string; value: PropertyType | 'all' }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Phòng trọ', value: 'room' },
  { label: 'Căn hộ', value: 'apartment' },
  { label: 'Nhà nguyên căn', value: 'house' },
  { label: 'Studio', value: 'studio' },
];

const PRICES: { label: string; min?: number; max?: number }[] = [
  { label: 'Dưới 3 triệu', max: 3_000_000 },
  { label: '3 – 5 triệu', min: 3_000_000, max: 5_000_000 },
  { label: '5 – 10 triệu', min: 5_000_000, max: 10_000_000 },
  { label: 'Trên 10 triệu', min: 10_000_000 },
];

export default function FilterSheet({
  visible,
  initial,
  onApply,
  onClose,
}: {
  visible: boolean;
  initial: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<Filters['type']>(initial.type);
  const [min, setMin] = useState<number | undefined>(initial.minPrice);
  const [max, setMax] = useState<number | undefined>(initial.maxPrice);

  useEffect(() => {
    if (visible) {
      setType(initial.type);
      setMin(initial.minPrice);
      setMax(initial.maxPrice);
    }
  }, [visible, initial.type, initial.minPrice, initial.maxPrice]);

  const priceActive = (p: { min?: number; max?: number }) => min === p.min && max === p.max;

  const reset = () => {
    setType('all');
    setMin(undefined);
    setMax(undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.head}>
          <Text style={styles.title}>Bộ lọc</Text>
          <PressableScale style={styles.close} scaleTo={0.85} onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.text} />
          </PressableScale>
        </View>

        <Text style={styles.label}>Loại phòng</Text>
        <View style={styles.chips}>
          {TYPES.map((t) => {
            const active = type === t.value;
            return (
              <PressableScale
                key={t.value}
                style={[styles.chip, active && styles.chipActive]}
                haptic
                onPress={() => setType(t.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
              </PressableScale>
            );
          })}
        </View>

        <Text style={styles.label}>Khoảng giá</Text>
        <View style={styles.chips}>
          {PRICES.map((p) => {
            const active = priceActive(p);
            return (
              <PressableScale
                key={p.label}
                style={[styles.chip, active && styles.chipActive]}
                haptic
                onPress={() => {
                  if (active) {
                    setMin(undefined);
                    setMax(undefined);
                  } else {
                    setMin(p.min);
                    setMax(p.max);
                  }
                }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
              </PressableScale>
            );
          })}
        </View>

        <View style={styles.actions}>
          <PressableScale style={styles.resetBtn} haptic onPress={reset}>
            <Text style={styles.resetText}>Đặt lại</Text>
          </PressableScale>
          <PressableScale
            style={styles.applyBtn}
            haptic="medium"
            onPress={() => onApply({ type, minPrice: min, maxPrice: max })}
          >
            <Text style={styles.applyText}>Áp dụng</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 20,
    paddingBottom: 34,
    gap: 12,
    ...shadow.float,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 999, backgroundColor: colors.border, marginBottom: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 19, fontWeight: '800', color: colors.text },
  close: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  chipActive: { backgroundColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#fff' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  resetBtn: { flex: 1, paddingVertical: 15, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  resetText: { fontSize: 15, fontWeight: '700', color: colors.text },
  applyBtn: { flex: 2, paddingVertical: 15, borderRadius: radius.pill, backgroundColor: colors.accent, alignItems: 'center' },
  applyText: { fontSize: 15, fontWeight: '800', color: colors.accentText },
});
