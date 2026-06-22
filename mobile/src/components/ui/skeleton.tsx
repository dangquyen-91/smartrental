import { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';

// Khối skeleton nhấp nháy (shimmer) — thay cho spinner để cảm giác load mượt.
export function Skeleton({
  width,
  height = 14,
  radius: r = 8,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: width ?? '100%', height, borderRadius: r, backgroundColor: colors.surfaceAlt2, opacity },
        style,
      ]}
    />
  );
}

// Card phòng dạng skeleton (khớp PropertyCard)
export function PropertyCardSkeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton height={150} radius={0} />
      <View style={styles.body}>
        <Skeleton width="80%" height={15} />
        <Skeleton width="55%" height={12} />
        <View style={styles.row}>
          <Skeleton width={70} height={15} />
          <Skeleton width={45} height={12} />
        </View>
      </View>
    </View>
  );
}

// Hàng skeleton cho list dọc (thumbnail + 3 dòng)
export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <Skeleton width={84} height={84} radius={10} />
      <View style={styles.listInfo}>
        <Skeleton width="70%" height={15} />
        <Skeleton width="40%" height={12} />
        <Skeleton width="50%" height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  listItem: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  listInfo: { flex: 1, gap: 8, justifyContent: 'center' },
});
