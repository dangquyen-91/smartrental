import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { useRevenueStats } from '@/hooks/use-revenue';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';
import { Skeleton } from '@/components/ui/skeleton';
import type { RevenuePeriod } from '@/types/revenue';

const PERIODS: { key: RevenuePeriod; label: string }[] = [
  { key: '3m', label: '3 tháng' },
  { key: '6m', label: '6 tháng' },
  { key: '1y', label: '1 năm' },
];

const money = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}tr` : (v ?? 0).toLocaleString('vi-VN');

const monthLabel = (m: string) => m.slice(5); // 'YYYY-MM' → 'MM'

export default function Revenue() {
  const [period, setPeriod] = useState<RevenuePeriod>('3m');
  const { data, isLoading } = useRevenueStats(period);

  const summary = data?.summary;
  const monthly = data?.monthly ?? [];
  const byProperty = data?.byProperty ?? [];
  const maxGross = Math.max(1, ...monthly.map((m) => m.grossRevenue));

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader title="Doanh thu" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Đổi kỳ */}
        <View style={styles.periods}>
          {PERIODS.map((p) => {
            const active = p.key === period;
            return (
              <PressableScale
                key={p.key}
                style={[styles.period, active && styles.periodActive]}
                haptic
                onPress={() => setPeriod(p.key)}
              >
                <Text style={[styles.periodText, active && styles.periodTextActive]}>{p.label}</Text>
              </PressableScale>
            );
          })}
        </View>

        {isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={120} radius={radius.lg} />
            <Skeleton height={180} radius={radius.lg} />
          </View>
        ) : (
          <>
            {/* Tổng quan */}
            <View style={styles.summaryGrid}>
              <SummaryCard icon="cash-outline" label="Tổng doanh thu" value={money(summary?.grossRevenue ?? 0)} highlight />
              <SummaryCard icon="wallet-outline" label="Thực nhận" value={money(summary?.landlordPayout ?? 0)} />
              <SummaryCard icon="remove-circle-outline" label="Phí nền tảng" value={money(summary?.platformFee ?? 0)} />
              <SummaryCard icon="receipt-outline" label="Lượt thuê" value={String(summary?.totalBookings ?? 0)} />
            </View>

            {/* Biểu đồ tháng */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Doanh thu theo tháng</Text>
              {monthly.length === 0 ? (
                <Text style={styles.empty}>Chưa có dữ liệu trong kỳ này.</Text>
              ) : (
                <View style={styles.chart}>
                  {monthly.map((m) => (
                    <View key={m.month} style={styles.barCol}>
                      <Text style={styles.barValue}>{money(m.grossRevenue)}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[styles.bar, { height: `${(m.grossRevenue / maxGross) * 100}%` }]}
                        />
                      </View>
                      <Text style={styles.barLabel}>T{monthLabel(m.month)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Theo phòng */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Theo bất động sản</Text>
              {byProperty.length === 0 ? (
                <Text style={styles.empty}>Chưa có doanh thu theo phòng.</Text>
              ) : (
                byProperty.map((p) => (
                  <View key={p.propertyId} style={styles.propRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.propTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={styles.propSub}>
                        {p.address?.district ?? ''} · {p.bookingCount} lượt thuê
                      </Text>
                    </View>
                    <Text style={styles.propValue}>{money(p.landlordPayout)}</Text>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.note}>Chỉ tính booking đã thanh toán. "Thực nhận" = tiền sau khi trừ phí nền tảng.</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.sumCard, highlight && styles.sumCardHi]}>
      <Ionicons name={icon} size={20} color={highlight ? colors.accentText : colors.brand} />
      <Text style={[styles.sumValue, highlight && { color: colors.accentText }]}>{value}</Text>
      <Text style={[styles.sumLabel, highlight && { color: colors.accentText }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  periods: { flexDirection: 'row', gap: 8 },
  period: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', ...shadow.soft },
  periodActive: { backgroundColor: colors.brand },
  periodText: { fontSize: 13, fontWeight: '700', color: colors.text },
  periodTextActive: { color: '#fff' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sumCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 16,
    gap: 4,
    ...shadow.card,
  },
  sumCardHi: { backgroundColor: colors.accent },
  sumValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 2 },
  sumLabel: { fontSize: 12, color: colors.muted },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12, ...shadow.card },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  empty: { fontSize: 13, color: colors.muted, paddingVertical: 12, textAlign: 'center' },

  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 9, fontWeight: '700', color: colors.muted },
  barTrack: { flex: 1, width: '60%', justifyContent: 'flex-end', maxWidth: 34 },
  bar: { width: '100%', backgroundColor: colors.brand, borderRadius: 6, minHeight: 3 },
  barLabel: { fontSize: 11, fontWeight: '600', color: colors.text },

  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  propTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  propSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  propValue: { fontSize: 15, fontWeight: '800', color: colors.brand },

  note: { fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 17 },
});
