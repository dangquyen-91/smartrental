import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { useProperties } from '@/hooks/use-properties';
import PropertyRow from '@/components/property-row';
import PressableScale from '@/components/ui/pressable-scale';
import { ListItemSkeleton } from '@/components/ui/skeleton';
import FilterSheet, { type Filters } from '@/components/filter-sheet';
import type { PropertyType } from '@/types/property';

const CATEGORIES: { label: string; value: PropertyType | 'all' }[] = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Phòng trọ', value: 'room' },
  { label: 'Căn hộ', value: 'apartment' },
  { label: 'Nhà nguyên căn', value: 'house' },
  { label: 'Studio', value: 'studio' },
];

export default function Search() {
  const params = useLocalSearchParams<{ search?: string; type?: string }>();
  const [search, setSearch] = useState(params.search ?? '');
  const [applied, setApplied] = useState(params.search ?? '');
  const [filters, setFilters] = useState<Filters>({
    type: (params.type as PropertyType) ?? 'all',
    minPrice: undefined,
    maxPrice: undefined,
  });
  const [showFilter, setShowFilter] = useState(false);

  // Màn search là tab giữ mount sẵn -> useState chỉ chạy lúc mount đầu.
  // Khi bấm category khác ở Home (param đổi), đồng bộ lại loại + ô tìm kiếm.
  useEffect(() => {
    setFilters((f) => ({ ...f, type: (params.type as PropertyType) ?? 'all' }));
  }, [params.type]);

  useEffect(() => {
    setSearch(params.search ?? '');
    setApplied(params.search ?? '');
  }, [params.search]);

  const { data, isLoading, refetch, isRefetching } = useProperties({
    status: 'available',
    search: applied || undefined,
    type: filters.type,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    limit: 20,
  });
  const properties = data?.data ?? [];
  const priceFilterOn = filters.minPrice != null || filters.maxPrice != null;

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.pad}>
        <Text style={styles.heading}>Tìm phòng</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Khu vực, tên phòng…"
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={() => setApplied(search)}
            />
            {!!search && (
              <PressableScale scaleTo={0.8} onPress={() => { setSearch(''); setApplied(''); }}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </PressableScale>
            )}
          </View>
          <PressableScale style={styles.filterBtn} haptic onPress={() => setShowFilter(true)}>
            <Ionicons name="options-outline" size={22} color="#fff" />
            {priceFilterOn && <View style={styles.filterDot} />}
          </PressableScale>
        </View>
      </View>

      {/* Category chips */}
      <View style={styles.chipsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(c) => c.value}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => {
            const active = item.value === filters.type;
            return (
              <PressableScale
                style={[styles.chip, active && styles.chipActive]}
                haptic
                onPress={() => setFilters((f) => ({ ...f, type: item.value }))}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </PressableScale>
            );
          }}
        />
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <ListItemSkeleton />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) => <PropertyRow property={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color="#c1c1c1" />
              <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
              <Text style={styles.emptySub}>Thử đổi bộ lọc hoặc khu vực khác.</Text>
            </View>
          }
        />
      )}

      <FilterSheet
        visible={showFilter}
        initial={filters}
        onClose={() => setShowFilter(false)}
        onApply={(f) => { setFilters(f); setShowFilter(false); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 16, paddingTop: 4 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  searchRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...shadow.soft,
  },
  input: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  filterDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  chipsWrap: { paddingVertical: 12 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  chipActive: { backgroundColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 4, flexGrow: 1 },
  empty: { alignItems: 'center', gap: 6, marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.muted },
});
