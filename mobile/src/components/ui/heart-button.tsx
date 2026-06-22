import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import { useToggleWishlist, useWishlist } from '@/hooks/use-wishlist';
import { useAuthStore } from '@/stores/auth.store';
import PressableScale from './pressable-scale';

// Nút ♡ lưu tin — cập nhật optimistic (đổi màu tức thì), tự đồng bộ với server.
export default function HeartButton({
  propertyId,
  size = 18,
  tone = 'dark',
  hideWhenGuest = true,
  style,
}: {
  propertyId: string;
  size?: number;
  tone?: 'dark' | 'light';
  hideWhenGuest?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: wishlist } = useWishlist();
  const toggle = useToggleWishlist();

  const serverSaved = !!wishlist?.some((w) => w.id === propertyId);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const saved = optimistic ?? serverSaved;

  // Khi server đã khớp với lựa chọn optimistic → nhả optimistic
  useEffect(() => {
    if (optimistic !== null && optimistic === serverSaved) setOptimistic(null);
  }, [serverSaved, optimistic]);

  if (!accessToken && hideWhenGuest) return null;

  const onPress = () => {
    if (!accessToken) {
      router.push('/(auth)/login');
      return;
    }
    setOptimistic(!saved); // đổi màu ngay
    toggle.mutate(propertyId);
  };

  return (
    <PressableScale
      style={[tone === 'dark' ? styles.dark : styles.light, style]}
      haptic="medium"
      scaleTo={0.8}
      onPress={onPress}
    >
      <Ionicons
        name={saved ? 'heart' : 'heart-outline'}
        size={size}
        color={saved ? colors.danger : tone === 'dark' ? '#fff' : colors.text}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  dark: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
