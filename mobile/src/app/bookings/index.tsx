import { Alert, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { useCancelBooking, useMyBookings } from '@/hooks/use-bookings';
import { formatPrice } from '@/lib/format';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import EmptyState from '@/components/ui/empty-state';
import { ListItemSkeleton } from '@/components/ui/skeleton';
import type { Booking, BookingStatus } from '@/types/booking';

const STATUS: Record<BookingStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: '#d97706' },
  confirmed: { label: 'Đã xác nhận', color: '#2563eb' },
  active: { label: 'Đang thuê', color: '#16a34a' },
  completed: { label: 'Hoàn tất', color: '#6b7280' },
  cancelled: { label: 'Đã hủy', color: '#dc2626' },
  rejected: { label: 'Bị từ chối', color: '#dc2626' },
};

const fmtDate = (s?: string) => {
  if (!s) return '';
  const d = new Date(s);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function MyBookings() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useMyBookings();
  const cancel = useCancelBooking();
  const bookings = data?.data ?? [];

  const onCancel = (b: Booking) =>
    Alert.alert('Hủy đặt phòng', 'Bạn chắc chắn muốn hủy yêu cầu này?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Hủy đặt phòng', style: 'destructive', onPress: () => cancel.mutate({ id: b.id }) },
    ]);

  const onPay = (b: Booking) => router.push(`/payment/checkout?bookingId=${b.id}`);

  const onReview = (b: Booking) => {
    const prop = typeof b.property === 'object' ? b.property : undefined;
    router.push(`/reviews/new?bookingId=${b.id}&title=${encodeURIComponent(prop?.title ?? '')}`);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title="Chuyến đi của tôi" />

      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <ListItemSkeleton />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const prop = typeof item.property === 'object' ? item.property : undefined;
            const propId = prop?.id ?? (typeof item.property === 'string' ? item.property : undefined);
            const img = prop?.images?.find((i) => i.isPrimary)?.url ?? prop?.images?.[0]?.url;
            const st = STATUS[item.status];
            const canCancel = item.status === 'pending' || item.status === 'confirmed';
            const canPay = item.status === 'active' && item.paymentStatus === 'unpaid';
            const canReview = item.status === 'completed';
            const isPaid = item.paymentStatus === 'paid';

            return (
              <View style={styles.card}>
                <PressableScale
                  style={styles.top}
                  haptic
                  disabled={!propId}
                  onPress={() => propId && router.push({ pathname: '/properties/[id]', params: { id: propId } })}
                >
                  {img ? (
                    <Image source={{ uri: img }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.placeholder]}>
                      <Ionicons name="home-outline" size={22} color="#bbb" />
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={styles.propTitle} numberOfLines={1}>{prop?.title ?? 'Phòng'}</Text>
                    <Text style={styles.dates}>
                      {fmtDate(item.startDate)} · {item.duration} tháng
                    </Text>
                    <Text style={styles.price}>{formatPrice(item.totalPrice)}</Text>
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
                  <Ionicons name="chevron-forward" size={18} color="#c3c2b4" />
                </PressableScale>

                {item.status === 'rejected' && item.rejectionReason && (
                  <Text style={styles.reason}>Lý do từ chối: {item.rejectionReason}</Text>
                )}

                {(canCancel || canPay || canReview) && (
                  <View style={styles.actions}>
                    {canCancel && (
                      <PressableScale style={styles.cancelBtn} haptic onPress={() => onCancel(item)}>
                        <Text style={styles.cancelText}>Hủy</Text>
                      </PressableScale>
                    )}
                    {canPay && (
                      <PressableScale style={styles.payBtn} haptic="medium" onPress={() => onPay(item)}>
                        <Text style={styles.payText}>Thanh toán</Text>
                      </PressableScale>
                    )}
                    {canReview && (
                      <PressableScale style={styles.reviewBtn} haptic="medium" onPress={() => onReview(item)}>
                        <Ionicons name="star" size={15} color={colors.accentText} />
                        <Text style={styles.payText}>Đánh giá</Text>
                      </PressableScale>
                    )}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title="Chưa có chuyến đi nào"
              subtitle="Tìm phòng và đặt để bắt đầu hành trình của bạn."
              actionLabel="Tìm phòng"
              onAction={() => router.push('/search')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  list: { padding: 16, paddingTop: 8, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
    ...shadow.card,
  },
  top: { flexDirection: 'row', gap: 12 },
  thumb: { width: 84, height: 84, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3, justifyContent: 'center' },
  propTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  dates: { fontSize: 12, color: colors.muted },
  price: { fontSize: 14, fontWeight: '800', color: colors.brand },
  badges: { flexDirection: 'row', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  reason: { fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.text },
  payBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.accent,
    minWidth: 110,
    alignItems: 'center',
  },
  payText: { fontSize: 14, fontWeight: '700', color: colors.accentText },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.muted },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: colors.accentText },
});
