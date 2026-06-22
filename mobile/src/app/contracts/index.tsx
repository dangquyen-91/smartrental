import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { useMyContracts } from '@/hooks/use-contracts';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import { ListItemSkeleton } from '@/components/ui/skeleton';
import type { Contract, ContractStatus } from '@/types/contract';

const STATUS: Record<ContractStatus, { label: string; color: string }> = {
  draft: { label: 'Nháp', color: '#6b7280' },
  awaiting_signatures: { label: 'Chờ ký', color: '#d97706' },
  signed: { label: 'Đã ký', color: '#16a34a' },
  cancelled: { label: 'Đã hủy', color: '#dc2626' },
};

function propTitle(c: Contract) {
  return typeof c.property === 'object' ? c.property.title : 'Hợp đồng thuê';
}

export default function MyContracts() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useMyContracts();
  const contracts = data?.data ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title="Hợp đồng" />

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
          data={contracts}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            const st = STATUS[item.status];
            return (
              <PressableScale
                style={styles.card}
                haptic
                onPress={() => router.push(`/contracts/${item.id}`)}
              >
                <View style={styles.cardTop}>
                  <Ionicons name="document-text-outline" size={22} color={colors.brand} />
                  <Text style={styles.cardTitle} numberOfLines={1}>{propTitle(item)}</Text>
                  <View style={[styles.badge, { backgroundColor: st.color + '22' }]}>
                    <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>
                <View style={styles.signRow}>
                  <SignChip label="Chủ nhà" signed={item.signedByLandlord?.signed} />
                  <SignChip label="Người thuê" signed={item.signedByTenant?.signed} />
                </View>
              </PressableScale>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={44} color="#c1c1c1" />
              <Text style={styles.emptyTitle}>Chưa có hợp đồng</Text>
              <Text style={styles.emptySub}>Hợp đồng sẽ xuất hiện sau khi chủ nhà tạo.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function SignChip({ label, signed }: { label: string; signed?: boolean }) {
  return (
    <View style={styles.chip}>
      <Ionicons
        name={signed ? 'checkmark-circle' : 'ellipse-outline'}
        size={15}
        color={signed ? '#16a34a' : '#bbb'}
      />
      <Text style={[styles.chipText, signed && { color: '#16a34a', fontWeight: '600' }]}>
        {label} {signed ? 'đã ký' : 'chưa ký'}
      </Text>
    </View>
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
    padding: 14,
    gap: 10,
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  signRow: { flexDirection: 'row', gap: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipText: { fontSize: 12, color: colors.muted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingHorizontal: 30 },
});
