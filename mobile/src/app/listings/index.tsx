import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useDeleteProperty, useMyListings, useUpdateProperty } from '@/hooks/use-properties';
import { formatPrice, TYPE_LABEL } from '@/lib/format';
import type { Property } from '@/types/property';

const STATUS: Record<string, { label: string; color: string }> = {
  available: { label: 'Đang hiển thị', color: '#16a34a' },
  rented: { label: 'Đã cho thuê', color: '#2563eb' },
  maintenance: { label: 'Bảo trì', color: '#d97706' },
};

export default function MyListings() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useMyListings();
  const del = useDeleteProperty();
  const upd = useUpdateProperty();
  const listings = data?.data ?? [];

  const confirmDelete = (p: Property) =>
    Alert.alert('Xóa tin', `Xóa "${p.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => del.mutate(p.id) },
    ]);

  const changeStatus = (p: Property) =>
    Alert.alert('Đổi trạng thái', p.title, [
      { text: 'Đang hiển thị', onPress: () => upd.mutate({ id: p.id, data: { status: 'available' } }) },
      { text: 'Đã cho thuê', onPress: () => upd.mutate({ id: p.id, data: { status: 'rented' } }) },
      { text: 'Bảo trì', onPress: () => upd.mutate({ id: p.id, data: { status: 'maintenance' } }) },
      { text: 'Hủy', style: 'cancel' },
    ]);

  const showActions = (p: Property) =>
    Alert.alert('Tùy chọn', p.title, [
      { text: 'Sửa tin', onPress: () => router.push(`/listings/${p.id}/edit`) },
      { text: 'Đổi trạng thái', onPress: () => changeStatus(p) },
      { text: 'Xóa tin', style: 'destructive', onPress: () => confirmDelete(p) },
      { text: 'Hủy', style: 'cancel' },
    ]);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Tin của tôi</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/listings/new')}>
          <Ionicons name="add" size={22} color={colors.accentText} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const img = item.images?.find((i) => i.isPrimary)?.url ?? item.images?.[0]?.url;
            const st = STATUS[item.status] ?? { label: item.status, color: colors.muted };
            return (
              <View style={styles.card}>
                <Pressable
                  style={styles.cardMain}
                  onPress={() => router.push({ pathname: '/properties/[id]', params: { id: item.id } })}
                >
                  {img ? (
                    <Image source={{ uri: img }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.placeholder]}>
                      <Ionicons name="image-outline" size={22} color="#bbb" />
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {TYPE_LABEL[item.type]} · {item.address?.district}
                    </Text>
                    <Text style={styles.price}>{formatPrice(item.price)}/tháng</Text>
                    <View style={[styles.statusBadge, { backgroundColor: st.color + '22' }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                </Pressable>
                <Pressable style={styles.delBtn} onPress={() => showActions(item)}>
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.muted} />
                </Pressable>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="home-outline" size={44} color="#c1c1c1" />
              <Text style={styles.emptyTitle}>Chưa có tin đăng</Text>
              <Text style={styles.emptySub}>Đăng tin đầu tiên để bắt đầu cho thuê.</Text>
              <Pressable style={styles.emptyBtn} onPress={() => router.push('/listings/new')}>
                <Text style={styles.emptyBtnText}>+ Đăng tin mới</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, paddingTop: 8, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardMain: { flex: 1, flexDirection: 'row', gap: 12, padding: 10 },
  thumb: { width: 90, height: 90, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3, justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 12, color: colors.muted },
  price: { fontSize: 14, fontWeight: '800', color: colors.brand },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginTop: 2 },
  statusText: { fontSize: 11, fontWeight: '700' },
  delBtn: { width: 44, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: colors.border },
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
