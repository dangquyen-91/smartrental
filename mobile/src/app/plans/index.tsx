import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { formatPrice } from '@/lib/format';
import { useMySubscription, usePlans } from '@/hooks/use-subscription';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import { Skeleton } from '@/components/ui/skeleton';
import type { Plan } from '@/types/subscription';

export default function Plans() {
  const router = useRouter();
  const { data: plans, isLoading } = usePlans();
  const { data: sub } = useMySubscription();

  const currentKey = sub?.plan?.key;
  const limit = sub?.plan?.listingLimit ?? 0;
  const used = sub?.activeListings ?? 0;
  const unlimited = limit === -1;
  const ratio = unlimited ? 0 : Math.min(1, limit ? used / limit : 0);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title="Gói thuê bao" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Gói hiện tại */}
        {sub && (
          <View style={styles.current}>
            <View style={styles.currentTop}>
              <View>
                <Text style={styles.currentLabel}>Gói hiện tại</Text>
                <Text style={styles.currentName}>{sub.plan?.name ?? '—'}</Text>
              </View>
              {!!sub.plan?.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{sub.plan.badge}</Text>
                </View>
              )}
            </View>

            <View style={styles.usageRow}>
              <Text style={styles.usageText}>
                Tin đăng: {used}/{unlimited ? '∞' : limit}
              </Text>
              {sub.daysLeft != null && (
                <Text style={[styles.usageText, sub.isExpiringSoon && { color: '#fbbf24' }]}>
                  Còn {sub.daysLeft} ngày
                </Text>
              )}
            </View>
            {!unlimited && (
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
              </View>
            )}
            {used >= limit && !unlimited && (
              <Text style={styles.warn}>⚠️ Đã đạt giới hạn — nâng cấp để đăng thêm tin.</Text>
            )}
          </View>
        )}

        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={150} radius={radius.lg} />
            ))}
          </View>
        ) : (
          plans?.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              isCurrent={p.key === currentKey}
              onBuy={() => router.push(`/payment/subscription?planKey=${p.key}`)}
            />
          ))
        )}

        <Text style={styles.note}>
          Thanh toán qua PayOS. Gói kích hoạt ngay sau khi thanh toán thành công.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({ plan, isCurrent, onBuy }: { plan: Plan; isCurrent: boolean; onBuy: () => void }) {
  const isFree = plan.price === 0;
  const highlight = plan.key === 'premium';

  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      <View style={styles.cardHead}>
        <View style={styles.row}>
          <Text style={styles.planName}>{plan.name}</Text>
          {!!plan.badge && (
            <View style={[styles.badge, styles.badgeSm]}>
              <Text style={styles.badgeText}>{plan.badge}</Text>
            </View>
          )}
        </View>
        {isCurrent && (
          <View style={styles.currentTag}>
            <Text style={styles.currentTagText}>Đang dùng</Text>
          </View>
        )}
      </View>

      <Text style={styles.price}>
        {isFree ? 'Miễn phí' : `${formatPrice(plan.price)}đ`}
        {!isFree && <Text style={styles.priceUnit}>/tháng</Text>}
      </Text>

      <View style={styles.features}>
        {(plan.features ?? []).map((f) => (
          <View key={f} style={styles.feature}>
            <Ionicons name="checkmark-circle" size={16} color={colors.brand} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {!isFree && !isCurrent && (
        <PressableScale style={styles.buyBtn} haptic="medium" onPress={onBuy}>
          <Text style={styles.buyText}>Nâng cấp {plan.name}</Text>
        </PressableScale>
      )}
      {isCurrent && (
        <View style={styles.usingBtn}>
          <Ionicons name="checkmark-done" size={16} color={colors.brand} />
          <Text style={styles.usingText}>Gói đang sử dụng</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  current: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    padding: 18,
    gap: 10,
    ...shadow.float,
  },
  currentTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  currentLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  currentName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  usageText: { fontSize: 13, color: 'rgba(255,255,255,0.92)', fontWeight: '600' },
  track: { height: 7, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 999 },
  warn: { fontSize: 12.5, color: colors.accent, fontWeight: '700' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 18,
    gap: 12,
    ...shadow.card,
  },
  cardHighlight: { borderWidth: 2, borderColor: colors.accent },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 18, fontWeight: '800', color: colors.text },
  badge: { backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.accentText },
  currentTag: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  currentTagText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  price: { fontSize: 24, fontWeight: '800', color: colors.brand },
  priceUnit: { fontSize: 13, fontWeight: '600', color: colors.muted },
  features: { gap: 8 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: colors.text, flex: 1 },
  buyBtn: { backgroundColor: colors.accent, paddingVertical: 14, borderRadius: radius.pill, alignItems: 'center', marginTop: 4 },
  buyText: { fontSize: 15, fontWeight: '800', color: colors.accentText },
  usingBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginTop: 2 },
  usingText: { fontSize: 14, fontWeight: '700', color: colors.brand },
  note: { fontSize: 12.5, color: colors.muted, textAlign: 'center', lineHeight: 18, marginTop: 4 },
});
