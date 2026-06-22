import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import {
  useCancelRoommateRequest,
  useRespondRoommateRequest,
  useRoommateRequests,
} from '@/hooks/use-roommate';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import { ListItemSkeleton } from '@/components/ui/skeleton';
import type { RequestStatus, RoommateRequest, RoommateUser } from '@/types/roommate';

const STATUS: Record<RequestStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ phản hồi', color: '#d97706' },
  accepted: { label: 'Đã ghép', color: '#16a34a' },
  rejected: { label: 'Đã từ chối', color: '#dc2626' },
  cancelled: { label: 'Đã hủy', color: '#6b7280' },
};

export default function RoommateRequests() {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const { data, isLoading, refetch, isRefetching } = useRoommateRequests(tab);
  const respond = useRespondRoommateRequest();
  const cancel = useCancelRoommateRequest();
  const requests = data?.data ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title="Lời mời ghép" />

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['received', 'sent'] as const).map((t) => {
          const active = t === tab;
          return (
            <PressableScale
              key={t}
              style={[styles.tab, active && styles.tabActive]}
              scaleTo={0.97}
              haptic
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {t === 'received' ? 'Nhận được' : 'Đã gửi'}
              </Text>
            </PressableScale>
          );
        })}
      </View>

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
          data={requests}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const other: RoommateUser | undefined =
              tab === 'received'
                ? (typeof item.sender === 'object' ? item.sender : undefined)
                : (typeof item.receiver === 'object' ? item.receiver : undefined);
            const st = STATUS[item.status];
            const canRespond = tab === 'received' && item.status === 'pending';
            const canCancel = tab === 'sent' && item.status === 'pending';

            return (
              <View style={styles.card}>
                <View style={styles.top}>
                  <View style={styles.avatar}>
                    {other?.avatar ? (
                      <Image source={{ uri: other.avatar }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarTxt}>{other?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{other?.name ?? 'Người dùng'}</Text>
                    {!!item.message && <Text style={styles.message} numberOfLines={2}>“{item.message}”</Text>}
                    <View style={[styles.badge, { backgroundColor: st.color + '22' }]}>
                      <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                </View>

                {item.status === 'accepted' && other?.phone && (
                  <View style={styles.contact}>
                    <Ionicons name="call" size={15} color="#16a34a" />
                    <Text style={styles.contactText}>Liên hệ: {other.phone}</Text>
                  </View>
                )}

                {(canRespond || canCancel) && (
                  <View style={styles.actions}>
                    {canRespond && (
                      <>
                        <PressableScale
                          style={styles.rejectBtn}
                          haptic
                          onPress={() => respond.mutate({ id: item.id, action: 'rejected' })}
                        >
                          <Text style={styles.rejectText}>Từ chối</Text>
                        </PressableScale>
                        <PressableScale
                          style={styles.acceptBtn}
                          haptic="medium"
                          onPress={() => respond.mutate({ id: item.id, action: 'accepted' })}
                        >
                          <Text style={styles.acceptText}>Chấp nhận</Text>
                        </PressableScale>
                      </>
                    )}
                    {canCancel && (
                      <PressableScale style={styles.rejectBtn} haptic onPress={() => cancel.mutate(item.id)}>
                        <Text style={styles.rejectText}>Hủy lời mời</Text>
                      </PressableScale>
                    )}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="mail-outline" size={44} color="#c1c1c1" />
              <Text style={styles.emptyTitle}>
                {tab === 'received' ? 'Chưa có lời mời nào' : 'Bạn chưa gửi lời mời'}
              </Text>
              <Text style={styles.emptySub}>
                {tab === 'received' ? 'Lời mời ghép sẽ hiện ở đây.' : 'Xem gợi ý và gửi lời mời để bắt đầu.'}
              </Text>
            </View>
          }
        />
      )}

      {(respond.isPending || cancel.isPending) && (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.brand} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', ...shadow.soft },
  tabActive: { backgroundColor: colors.brand },
  tabText: { fontSize: 14, fontWeight: '700', color: colors.text },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 4, flexGrow: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, gap: 10, ...shadow.card },
  top: { flexDirection: 'row', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarTxt: { color: '#fff', fontSize: 18, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  message: { fontSize: 13, color: colors.muted, fontStyle: 'italic', marginTop: 2 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ecfdf3', borderRadius: radius.sm, padding: 10 },
  contactText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  acceptBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.accent },
  acceptText: { fontSize: 14, fontWeight: '800', color: colors.accentText },
  rejectBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  rejectText: { fontSize: 14, fontWeight: '600', color: colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingHorizontal: 30 },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
