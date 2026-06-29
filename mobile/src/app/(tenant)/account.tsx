import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, type Href } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import PressableScale from '@/components/ui/pressable-scale';
import { getMeApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { useMyBookings, useLandlordBookings } from '@/hooks/use-bookings';
import { useWishlist } from '@/hooks/use-wishlist';
import { useMyReviews } from '@/hooks/use-reviews';
import { useMyListings } from '@/hooks/use-properties';
import { useMyContracts } from '@/hooks/use-contracts';

type IoniconName = keyof typeof Ionicons.glyphMap;
type MenuItem = { icon: IoniconName; label: string; route: string; tint: string };

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const ROLE_LABEL: Record<string, string> = {
  tenant: 'Người thuê',
  landlord: 'Chủ nhà',
  admin: 'Quản trị',
  provider: 'Nhà cung cấp',
};

const cnt = (q: { data?: { pagination?: { total: number }; data?: unknown[] } }) =>
  q.data?.pagination?.total ?? q.data?.data?.length ?? 0;

// ─── Thẻ thống kê (3 cột trong 1 card nổi đè header) ───────────────────────────
function StatItem({
  icon,
  value,
  label,
  loading,
  onPress,
}: {
  icon: IoniconName;
  value: number;
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.statItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={colors.brand} />
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ height: 24 }} />
      ) : (
        <Text style={styles.statValue}>{value}</Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function TenantStats({ go }: { go: (r: Href) => void }) {
  const bookings = useMyBookings();
  const wishlist = useWishlist();
  const reviews = useMyReviews();
  return (
    <View style={styles.statsCard}>
      <StatItem icon="briefcase-outline" value={cnt(bookings)} label="Chuyến đi" loading={bookings.isLoading} onPress={() => go('/bookings')} />
      <View style={styles.statDivider} />
      <StatItem icon="heart-outline" value={wishlist.data?.length ?? 0} label="Đã lưu" loading={wishlist.isLoading} onPress={() => go('/wishlist')} />
      <View style={styles.statDivider} />
      <StatItem icon="star-outline" value={cnt(reviews)} label="Đánh giá" loading={reviews.isLoading} onPress={() => go('/bookings')} />
    </View>
  );
}

function LandlordStats({ go }: { go: (r: Href) => void }) {
  const listings = useMyListings();
  const received = useLandlordBookings();
  const contracts = useMyContracts();
  return (
    <View style={styles.statsCard}>
      <StatItem icon="home-outline" value={cnt(listings)} label="Tin đăng" loading={listings.isLoading} onPress={() => go('/listings')} />
      <View style={styles.statDivider} />
      <StatItem icon="briefcase-outline" value={cnt(received)} label="Đặt phòng" loading={received.isLoading} onPress={() => go('/bookings/received')} />
      <View style={styles.statDivider} />
      <StatItem icon="document-text-outline" value={cnt(contracts)} label="Hợp đồng" loading={contracts.isLoading} onPress={() => go('/contracts')} />
    </View>
  );
}

function MenuGroup({ title, items, onItem }: { title: string; items: MenuItem[]; onItem: (r: string) => void }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.menu}>
        {items.map((m, i) => (
          <PressableScale
            key={m.label}
            style={[styles.menuItem, i < items.length - 1 && styles.menuItemBorder]}
            scaleTo={0.98}
            haptic
            onPress={() => onItem(m.route)}
          >
            <View style={[styles.menuChip, { backgroundColor: m.tint + '1f' }]}>
              <Ionicons name={m.icon} size={19} color={m.tint} />
            </View>
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#c3c2b4" />
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

export default function Account() {
  const router = useRouter();
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMeApi,
    enabled: !!accessToken && !user,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  // ─── Khách (chưa đăng nhập) ───
  if (!accessToken) {
    return (
      <SafeAreaView edges={['top']} style={styles.center}>
        <View style={styles.guestIconWrap}>
          <Ionicons name="person-circle-outline" size={64} color={colors.brand} />
        </View>
        <Text style={styles.guestTitle}>Chào mừng đến SmartRental</Text>
        <Text style={styles.guestSub}>Đăng nhập để đặt phòng, lưu tin và quản lý tài khoản.</Text>
        <View style={styles.guestActions}>
          <PressableScale style={styles.primary} haptic="medium" onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.primaryText}>Đăng nhập</Text>
          </PressableScale>
          <PressableScale style={styles.secondary} haptic onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.secondaryText}>Tạo tài khoản</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    );
  }

  const me = user ?? data;
  if (isLoading && !me) {
    return (
      <SafeAreaView edges={['top']} style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </SafeAreaView>
    );
  }

  const isLandlord = me?.role === 'landlord';
  const activityMenu: MenuItem[] = isLandlord
    ? [
        { icon: 'add-circle-outline', label: 'Đăng tin mới', route: '/listings/new', tint: '#16a34a' },
        { icon: 'home-outline', label: 'Tin của tôi', route: '/listings', tint: '#2563eb' },
        { icon: 'briefcase-outline', label: 'Đặt phòng nhận được', route: '/bookings/received', tint: '#d97706' },
        { icon: 'document-text-outline', label: 'Hợp đồng', route: '/contracts', tint: colors.brand },
        { icon: 'construct-outline', label: 'Dịch vụ', route: '/services', tint: '#0891b2' },
        { icon: 'people-outline', label: 'Ở ghép', route: '/roommate', tint: '#7c3aed' },
        { icon: 'bar-chart-outline', label: 'Doanh thu', route: '/revenue', tint: '#16a34a' },
        { icon: 'diamond-outline', label: 'Gói thuê bao', route: '/plans', tint: '#d97706' },
      ]
    : [
        { icon: 'briefcase-outline', label: 'Chuyến đi của tôi', route: '/bookings', tint: '#2563eb' },
        { icon: 'heart-outline', label: 'Tin đã lưu', route: '/wishlist', tint: '#ec4899' },
        { icon: 'document-text-outline', label: 'Hợp đồng', route: '/contracts', tint: colors.brand },
        { icon: 'construct-outline', label: 'Dịch vụ', route: '/services', tint: '#0891b2' },
        { icon: 'people-outline', label: 'Ở ghép', route: '/roommate', tint: '#7c3aed' },
      ];
  const accountMenu: MenuItem[] = [
    { icon: 'person-outline', label: 'Sửa hồ sơ', route: '/profile/edit', tint: colors.brand },
    { icon: 'lock-closed-outline', label: 'Đổi mật khẩu', route: '/profile/password', tint: '#6b7280' },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header gradient */}
        <LinearGradient
          colors={[colors.brand, '#8c8400']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profile}
        >
          <View style={styles.profileBlob} />
          <PressableScale
            style={styles.editBtn}
            haptic
            scaleTo={0.85}
            onPress={() => router.push('/profile/edit')}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
          </PressableScale>

          <View style={styles.avatar}>
            {me?.avatar ? (
              <Image source={{ uri: me.avatar }} style={styles.avatarImg} contentFit="cover" transition={200} />
            ) : (
              <Text style={styles.avatarText}>{me?.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{me?.name}</Text>
            <Text style={styles.email} numberOfLines={1}>{me?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{ROLE_LABEL[me?.role ?? ''] ?? me?.role}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Thống kê nổi đè header */}
        {isLandlord ? (
          <LandlordStats go={(r) => router.push(r)} />
        ) : (
          <TenantStats go={(r) => router.push(r)} />
        )}

        <MenuGroup title="Hoạt động của tôi" items={activityMenu} onItem={(r) => router.push(r as never)} />
        <MenuGroup title="Tài khoản" items={accountMenu} onItem={(r) => router.push(r as never)} />

        {/* Đăng xuất */}
        <PressableScale
          style={styles.logout}
          haptic="medium"
          onPress={async () => {
            await clearAuth();
            qc.clear();
            router.replace('/');
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </PressableScale>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>SmartRental</Text>
          <Text style={styles.footerVersion}>Phiên bản {APP_VERSION}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },

  // Header
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 44,
    overflow: 'hidden',
    ...shadow.float,
  },
  profileBlob: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: 'rgba(255,239,61,0.16)',
  },
  editBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: colors.accentText, fontSize: 24, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: '#fff' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
  },
  roleText: { fontSize: 11, fontWeight: '700', color: colors.accentText },

  // Stats — card nổi đè đáy header
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 16,
    marginTop: -28,
    marginHorizontal: 6,
    ...shadow.float,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 12, color: colors.muted },

  // Menu
  section: { marginTop: 22 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 6,
    marginBottom: 10,
  },
  menu: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 12 },
  menuItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  menuChip: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600' },

  // Logout
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#f2d5d5',
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: colors.danger },

  footer: { alignItems: 'center', gap: 2, paddingTop: 18 },
  footerBrand: { fontSize: 13, fontWeight: '800', color: colors.muted, letterSpacing: 0.5 },
  footerVersion: { fontSize: 11, color: colors.muted },

  // Guest + loading
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
  guestIconWrap: {
    width: 104,
    height: 104,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    ...shadow.soft,
  },
  guestTitle: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  guestSub: { fontSize: 14.5, color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: 8, maxWidth: 300 },
  guestActions: { width: '100%', maxWidth: 360, gap: 12, marginTop: 28 },
  primary: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center', ...shadow.soft },
  primaryText: { fontSize: 16, fontWeight: '800', color: colors.accentText },
  secondary: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center' },
  secondaryText: { fontSize: 16, fontWeight: '700', color: colors.text },
});
