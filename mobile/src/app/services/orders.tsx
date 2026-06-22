import { useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { SERVICE_ICON, SERVICE_STATUS } from '@/constants/service-meta';
import { formatPrice } from '@/lib/format';
import {
  useLandlordServiceOrders,
  useMyServiceOrders,
  useServiceCatalog,
  useServiceOrderAction,
} from '@/hooks/use-services';
import { useAuthStore } from '@/stores/auth.store';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import EmptyState from '@/components/ui/empty-state';
import { ListItemSkeleton } from '@/components/ui/skeleton';
import type { ServiceType } from '@/types/service';

const fmtDate = (s?: string) => {
  if (!s) return '';
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function ServiceOrders() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const isLandlord = role === 'landlord';

  const tenantQ = useMyServiceOrders();
  const landlordQ = useLandlordServiceOrders();
  const q = isLandlord ? landlordQ : tenantQ;
  const orders = q.data?.data ?? [];

  const { data: catalog } = useServiceCatalog();
  const nameOf = useMemo(() => {
    const m = new Map<ServiceType, string>();
    catalog?.forEach((c) => m.set(c.type, c.name));
    return (t: ServiceType) => m.get(t) ?? t;
  }, [catalog]);

  const action = useServiceOrderAction();

  const confirmCancel = (id: string) =>
    Alert.alert('Hủy đơn dịch vụ', 'Bạn chắc chắn muốn hủy đơn này?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Hủy đơn', style: 'destructive', onPress: () => action.mutate({ id, status: 'cancelled' }) },
    ]);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader
        title="Đơn dịch vụ"
        right={
          <PressableScale haptic scaleTo={0.85} onPress={() => router.push('/services')}>
            <Ionicons name="add" size={24} color={colors.brand} />
          </PressableScale>
        }
      />

      {q.isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <ListItemSkeleton />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={q.refetch}
          refreshing={q.isRefetching}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const prop = typeof item.property === 'object' ? item.property : undefined;
            const tenant = typeof item.tenant === 'object' ? item.tenant : undefined;
            const st = SERVICE_STATUS[item.status];
            const isPaid = item.paymentStatus === 'paid';
            const canPay = !isLandlord && item.status === 'confirmed' && item.paymentStatus === 'unpaid';
            const canTenantCancel = !isLandlord && item.status === 'pending';
            const canConfirm = isLandlord && item.status === 'pending';
            const canLandlordCancel = isLandlord && (item.status === 'pending' || item.status === 'confirmed');

            return (
              <View style={styles.card}>
                <View style={styles.top}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={SERVICE_ICON[item.type] ?? 'cube-outline'} size={22} color={colors.brand} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{nameOf(item.type)}</Text>
                    <Text style={styles.sub} numberOfLines={1}>
                      {prop?.title ?? 'Phòng'}{isLandlord && tenant?.name ? ` · ${tenant.name}` : ''}
                    </Text>
                    <Text style={styles.sub}>Ngày: {fmtDate(item.scheduledAt)}</Text>
                    <Text style={styles.price}>{formatPrice(item.price)}đ</Text>
                    <View style={styles.badges}>
                      <View style={[styles.badge, { backgroundColor: st.color + '22' }]}>
                        <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                      </View>
                      {isPaid && (
                        <View style={[styles.badge, { backgroundColor: '#16a34a22' }]}>
                          <Text style={[styles.badgeText, { color: '#16a34a' }]}>Đã thanh toán</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {item.status === 'cancelled' && item.cancelReason && (
                  <Text style={styles.reason}>Lý do hủy: {item.cancelReason}</Text>
                )}

                {(canPay || canTenantCancel || canConfirm || canLandlordCancel) && (
                  <View style={styles.actions}>
                    {(canTenantCancel || canLandlordCancel) && (
                      <PressableScale style={styles.outlineBtn} haptic onPress={() => confirmCancel(item.id)}>
                        <Text style={styles.outlineText}>Hủy</Text>
                      </PressableScale>
                    )}
                    {canConfirm && (
                      <PressableScale
                        style={styles.primaryBtn}
                        haptic="medium"
                        onPress={() => action.mutate({ id: item.id, status: 'confirmed' })}
                      >
                        <Text style={styles.primaryText}>Xác nhận</Text>
                      </PressableScale>
                    )}
                    {canPay && (
                      <PressableScale
                        style={styles.primaryBtn}
                        haptic="medium"
                        onPress={() => router.push(`/payment/service?orderId=${item.id}`)}
                      >
                        <Text style={styles.primaryText}>Thanh toán</Text>
                      </PressableScale>
                    )}
                  </View>
                )}

                {!isLandlord && item.status === 'pending' && (
                  <Text style={styles.hint}>Chờ chủ nhà xác nhận trước khi thanh toán.</Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="construct-outline"
              title="Chưa có đơn dịch vụ"
              subtitle="Đặt dịch vụ tiện ích cho nơi ở của bạn."
              actionLabel="Xem dịch vụ"
              onAction={() => router.push('/services')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, paddingTop: 8, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, gap: 10, ...shadow.card },
  top: { flexDirection: 'row', gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
  price: { fontSize: 14, fontWeight: '800', color: colors.brand, marginTop: 3 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  reason: { fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  outlineBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  outlineText: { fontSize: 14, fontWeight: '600', color: colors.text },
  primaryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.accent },
  primaryText: { fontSize: 14, fontWeight: '700', color: colors.accentText },
  hint: { fontSize: 12, color: colors.muted, fontStyle: 'italic' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  emptyBtn: { marginTop: 12, backgroundColor: colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.pill },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: colors.accentText },
});
