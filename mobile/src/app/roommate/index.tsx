import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { formatPrice } from '@/lib/format';
import {
  CLEAN_LABEL,
  DURATION_LABEL,
  GENDER_LABEL,
  LIFESTYLE_LABEL,
  SCHEDULE_LABEL,
  YESNO_LABEL,
} from '@/constants/roommate-meta';
import { useMyRoommateProfile } from '@/hooks/use-roommate';
import ScreenHeader from '@/components/ui/screen-header';
import PressableScale from '@/components/ui/pressable-scale';

export default function RoommateHub() {
  const router = useRouter();
  const { data: profile, isLoading, isError } = useMyRoommateProfile();

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader
        title="Ở ghép"
        right={
          profile ? (
            <PressableScale haptic scaleTo={0.85} onPress={() => router.push('/roommate/profile')}>
              <Ionicons name="create-outline" size={22} color={colors.brand} />
            </PressableScale>
          ) : undefined
        }
      />

      {isLoading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : isError || !profile ? (
        // Chưa có hồ sơ
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={40} color={colors.brand} />
          </View>
          <Text style={styles.emptyTitle}>Tìm bạn ở ghép</Text>
          <Text style={styles.emptySub}>
            Tạo hồ sơ để hệ thống gợi ý những người phù hợp về ngân sách, lối sống và thói quen.
          </Text>
          <PressableScale style={styles.cta} haptic="medium" onPress={() => router.push('/roommate/profile')}>
            <Text style={styles.ctaText}>Tạo hồ sơ tìm ghép</Text>
          </PressableScale>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Trạng thái */}
          <View style={styles.statusCard}>
            <View style={[styles.dot, { backgroundColor: profile.looking ? '#16a34a' : colors.muted }]} />
            <Text style={styles.statusText}>
              {profile.looking ? 'Đang tìm bạn ở ghép' : 'Đang tạm ẩn hồ sơ'}
            </Text>
          </View>

          {/* Tóm tắt hồ sơ */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hồ sơ của tôi</Text>
            <Row label="Ngân sách" value={`${formatPrice(profile.budget.min)} – ${formatPrice(profile.budget.max)}đ`} />
            <Row label="Giới tính ghép" value={GENDER_LABEL[profile.gender]} />
            <Row label="Giờ giấc" value={SCHEDULE_LABEL[profile.schedule]} />
            <Row label="Lối sống" value={LIFESTYLE_LABEL[profile.lifestyle]} />
            <Row label="Vệ sinh" value={CLEAN_LABEL[profile.cleanliness]} />
            <Row label="Thời hạn" value={DURATION_LABEL[profile.duration]} />
            <Row label="Thú cưng" value={YESNO_LABEL[profile.pets]} />
            <Row label="Hút thuốc" value={YESNO_LABEL[profile.smoking]} />
            {!!profile.city && <Row label="Khu vực" value={profile.city} />}
            {!!profile.bio && (
              <>
                <Text style={[styles.rowLabel, { marginTop: 6 }]}>Giới thiệu</Text>
                <Text style={styles.bio}>{profile.bio}</Text>
              </>
            )}
          </View>

          <PressableScale style={styles.primaryBtn} haptic="medium" onPress={() => router.push('/roommate/matches')}>
            <Ionicons name="sparkles" size={18} color={colors.accentText} />
            <Text style={styles.primaryText}>Xem gợi ý ghép</Text>
          </PressableScale>

          <PressableScale style={styles.outlineBtn} haptic onPress={() => router.push('/roommate/requests')}>
            <Ionicons name="mail-outline" size={18} color={colors.text} />
            <Text style={styles.outlineText}>Lời mời ghép</Text>
          </PressableScale>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 6 },
  emptySub: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  cta: { backgroundColor: colors.accent, paddingVertical: 15, paddingHorizontal: 28, borderRadius: radius.pill, marginTop: 10 },
  ctaText: { fontSize: 15, fontWeight: '800', color: colors.accentText },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...shadow.soft,
  },
  dot: { width: 9, height: 9, borderRadius: 999 },
  statusText: { fontSize: 14, fontWeight: '700', color: colors.text },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 8, ...shadow.card },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 14, color: colors.muted },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  bio: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 2 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 15,
    borderRadius: radius.pill,
    marginTop: 4,
    ...shadow.soft,
  },
  primaryText: { fontSize: 15, fontWeight: '800', color: colors.accentText },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineText: { fontSize: 15, fontWeight: '700', color: colors.text },
});
