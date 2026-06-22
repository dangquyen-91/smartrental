import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { useToastStore, type ToastType } from '@/stores/toast.store';

const CONFIG: Record<ToastType, { bg: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { bg: '#ecfdf3', icon: 'checkmark-circle', color: '#16a34a' },
  error: { bg: '#fef2f2', icon: 'alert-circle', color: colors.danger },
  info: { bg: '#fffbe6', icon: 'information-circle', color: colors.brand },
};

// Banner toast trượt từ trên xuống, tự ẩn sau 2.6s. Gắn 1 lần ở _layout.
export default function ToastHost() {
  const insets = useSafeAreaInsets();
  const id = useToastStore((s) => s.id);
  const message = useToastStore((s) => s.message);
  const type = useToastStore((s) => s.type);

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 6 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -120, duration: 220, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }, 2600);
    return () => clearTimeout(t);
  }, [id, translateY, opacity]);

  if (!id) return null;
  const c = CONFIG[type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { top: insets.top + 8, backgroundColor: c.bg, transform: [{ translateY }], opacity },
      ]}
    >
      <Ionicons name={c.icon} size={20} color={c.color} />
      <Text style={[styles.text, { color: c.color }]} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: radius.md,
    zIndex: 9999,
    ...shadow.float,
  },
  text: { flex: 1, fontSize: 14, fontWeight: '700' },
});
