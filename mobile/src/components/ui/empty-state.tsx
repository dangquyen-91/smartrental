import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';
import PressableScale from './pressable-scale';

type IoniconName = keyof typeof Ionicons.glyphMap;

// Trạng thái rỗng nhất quán: icon trong vòng tròn gradient + tiêu đề + mô tả + (tuỳ chọn) nút.
export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: IoniconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['#fffbe0', colors.surfaceAlt]}
        style={styles.circle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={icon} size={42} color={colors.brand} />
      </LinearGradient>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <PressableScale style={styles.btn} haptic onPress={onAction}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 36, paddingTop: 70 },
  circle: { width: 96, height: 96, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 10, backgroundColor: colors.accent, paddingHorizontal: 26, paddingVertical: 13, borderRadius: radius.pill },
  btnText: { fontSize: 15, fontWeight: '800', color: colors.accentText },
});
