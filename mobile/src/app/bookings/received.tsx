import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { useBookingAction, useLandlordBookings } from '@/hooks/use-bookings';
import { formatPrice } from '@/lib/format';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import { ListItemSkeleton } from '@/components/ui/skeleton';
import type { BookingStatus } from '@/types/booking';

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

export default function ReceivedBookings() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useLandlordBookings();
  const action = useBookingAction();
  const bookings = data?.data ?? [];

  const run = (act: 'confirm' | 'reject' | 'activate' | 'complete', id: string) =>
    action.mutate({ action: act, id });

  const confirmAct = (
    act: 'confirm' | 'reject' | 'activate' | 'complete',
    id: string,
    title: string,
    msg: string,
    destructive?: boolean,
  ) =>
    Alert.alert(title, msg, [
      { text: 'Hủy', style: 'cancel' },
      { text: title, style: destructive ? 'destructive' : 'default', onPress: () => run(act, id) },
    ]);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title="Đặt phòng nhận được" />

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
            const tenant = typeof item.tenant === 'object' ? item.tenant : undefined;
            const img = prop?.images?.find((i) => i.isPrimary)?.url ?? prop?.images?.[0]?.url;
            const st = STATUS[item.status];
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
                      <Ionicons name="home-outline" size={20} color="#bbb" />
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={styles.propTitle} numberOfLines={1}>{prop?.title ?? 'Phòng'}</Text>
                    <View style={styles.row}>
                      <Ionicons name="person-outline" size={13} color={colors.muted} />
                      <Text style={styles.tenant} numberOfLines={1}>
                        {tenant?.name ?? 'Khách'}{tenant?.phone ? ` · ${tenant.phone}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.dates}>{fmtDate(item.startDate)} · {item.duration} tháng</Text>
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

                {/* Hành động theo trạng thái */}
                {item.status === 'pending' && (
                  <View style={styles.actions}>
                    <Pressable
                      style={styles.rejectBtn}
                      onPress={() => confirmAct('reject', item.id, 'Từ chối', 'Từ chối yêu cầu này?', true)}
                    >
                      <Text style={styles.rejectText}>Từ chối</Text>
                    </Pressable>
                    <Pressable style={styles.primaryBtn} onPress={() => run('confirm', item.id)}>
                      <Text style={styles.primaryText}>Xác nhận</Text>
                    </Pressable>
                  </View>
                )}
                {item.status === 'confirmed' && (
                  <View style={styles.actions}>
                    <Pressable
                      style={styles.outlineBtn}
                      onPress={() => router.push(`/contracts/new?bookingId=${item.id}`)}
                    >
                      <Text style={styles.outlineText}>Tạo HĐ</Text>
                    </Pressable>
                    <Pressable
                      style={styles.primaryBtn}
                      onPress={() => confirmAct('activate', item.id, 'Check-in', 'Xác nhận khách đã nhận phòng?')}
                    >
                      <Text style={styles.primaryText}>Check-in</Text>
                    </Pressable>
                  </View>
                )}
                {item.status === 'active' && (
                  <View style={styles.actions}>
                    <Pressable
                      style={styles.outlineBtn}
                      onPress={() => router.push(`/contracts/new?bookingId=${item.id}`)}
                    >
                      <Text style={styles.outlineText}>Tạo HĐ</Text>
                    </Pressable>
                    <Pressable
                      style={styles.outlineBtn}
                      onPress={() => confirmAct('complete', item.id, 'Hoàn tất', 'Kết thúc kỳ thuê này?')}
                    >
                      <Text style={styles.outlineText}>Hoàn tất</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="file-tray-outline" size={44} color="#c1c1c1" />
              <Text style={styles.emptyTitle}>Chưa có yêu cầu đặt phòng</Text>
              <Text style={styles.emptySub}>Khi có khách đặt, yêu cầu sẽ hiện ở đây.</Text>
            </View>
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
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, gap: 10, ...shadow.card },
  top: { flexDirection: 'row', gap: 12 },
  thumb: { width: 84, height: 84, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3, justifyContent: 'center' },
  propTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tenant: { fontSize: 12, color: colors.muted, flexShrink: 1 },
  dates: { fontSize: 12, color: colors.muted },
  price: { fontSize: 14, fontWeight: '800', color: colors.brand },
  badges: { flexDirection: 'row', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  primaryBtn: { backgroundColor: colors.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  primaryText: { fontSize: 14, fontWeight: '700', color: colors.accentText },
  rejectBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.danger },
  rejectText: { fontSize: 14, fontWeight: '600', color: colors.danger },
  outlineBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  outlineText: { fontSize: 14, fontWeight: '600', color: colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.muted },
});
