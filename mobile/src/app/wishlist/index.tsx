import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import PropertyCard from '@/components/property-card';
import ScreenHeader from '@/components/ui/screen-header';
import EmptyState from '@/components/ui/empty-state';
import { PropertyCardSkeleton } from '@/components/ui/skeleton';
import { useWishlist } from '@/hooks/use-wishlist';

export default function Wishlist() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useWishlist();
  const items = data ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title="Tin đã lưu" />

      {isLoading ? (
        <View style={[styles.list, { flexDirection: 'row', flexWrap: 'wrap' }]}>
          {[0, 1, 2, 3].map((i) => (
            <PropertyCardSkeleton key={i} style={{ width: '48%', marginBottom: 12 }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <PropertyCard property={item} style={{ flex: 1 }} />}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="Chưa lưu tin nào"
              subtitle="Nhấn ♡ ở phòng yêu thích để lưu lại xem sau."
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingHorizontal: 30 },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: colors.accentText },
});
