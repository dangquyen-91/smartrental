import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { SERVICE_ICON } from '@/constants/service-meta';
import { formatPrice } from '@/lib/format';
import { useServiceCatalog } from '@/hooks/use-services';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import { Skeleton } from '@/components/ui/skeleton';

export default function Services() {
  const router = useRouter();
  const { data: catalog, isLoading } = useServiceCatalog();

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader
        title="Dịch vụ tiện ích"
        right={
          <PressableScale haptic scaleTo={0.85} onPress={() => router.push('/services/orders')}>
            <Ionicons name="receipt-outline" size={22} color={colors.brand} />
          </PressableScale>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Đặt dịch vụ cho nơi ở của bạn — chọn dịch vụ để bắt đầu.</Text>

        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={76} radius={radius.md} />
            ))}
          </View>
        ) : (
          catalog?.map((s) => (
            <PressableScale
              key={s.id}
              style={styles.card}
              haptic
              onPress={() => router.push(`/services/new?type=${s.type}`)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={SERVICE_ICON[s.type] ?? 'cube-outline'} size={24} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.name}</Text>
                <Text style={styles.price}>
                  {formatPrice(s.price)}đ<Text style={styles.unit}> / {s.unit}</Text>
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#c3c2b4" />
            </PressableScale>
          ))
        )}

        <PressableScale style={styles.ordersBtn} haptic onPress={() => router.push('/services/orders')}>
          <Ionicons name="list-outline" size={18} color={colors.text} />
          <Text style={styles.ordersText}>Đơn dịch vụ của tôi</Text>
        </PressableScale>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  intro: { fontSize: 13.5, color: colors.muted, lineHeight: 19, marginBottom: 2 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    ...shadow.card,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  price: { fontSize: 14, fontWeight: '800', color: colors.brand, marginTop: 2 },
  unit: { fontSize: 12, fontWeight: '500', color: colors.muted },
  ordersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  ordersText: { fontSize: 14, fontWeight: '700', color: colors.text },
});
