import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { useProperties } from '@/hooks/use-properties';
import { useAuthStore } from '@/stores/auth.store';
import FeaturedCarousel from '@/components/featured-carousel';
import PressableScale from '@/components/ui/pressable-scale';
import { PropertyCardSkeleton } from '@/components/ui/skeleton';
import FadeIn from '@/components/fade-in';
import CityMarquee from '@/components/city-marquee';
import type { PropertyType } from '@/types/property';

type IoniconName = keyof typeof Ionicons.glyphMap;

const CATEGORIES: { label: string; value: PropertyType | 'all'; icon: IoniconName }[] = [
  { label: 'Tất cả', value: 'all', icon: 'apps-outline' },
  { label: 'Phòng trọ', value: 'room', icon: 'bed-outline' },
  { label: 'Căn hộ', value: 'apartment', icon: 'business-outline' },
  { label: 'Nhà nguyên căn', value: 'house', icon: 'home-outline' },
  { label: 'Studio', value: 'studio', icon: 'cube-outline' },
];

const STEPS = [
  { step: '1', title: 'Tìm & đặt phòng', desc: 'Lọc theo khu vực, giá, loại phòng rồi gửi yêu cầu đặt ngay.' },
  { step: '2', title: 'Xác nhận & thanh toán', desc: 'Chủ nhà xác nhận trong 24h. Thanh toán cọc an toàn.' },
  { step: '3', title: 'Ký hợp đồng điện tử', desc: 'Hợp đồng số hoá, có hiệu lực pháp lý, lưu trên cloud.' },
];

const STATS = [
  { value: '10.000+', label: 'Tin đăng' },
  { value: '2.500+', label: 'Chủ nhà xác minh' },
  { value: '8.000+', label: 'Người thuê hài lòng' },
];

const CITIES = [
  { city: 'TP. Hồ Chí Minh', subtitle: 'Cho thuê phòng' },
  { city: 'Hà Nội', subtitle: 'Cho thuê căn hộ' },
  { city: 'Đà Nẵng', subtitle: 'Nhà nguyên căn' },
  { city: 'Cần Thơ', subtitle: 'Phòng sinh viên' },
  { city: 'Bình Dương', subtitle: 'Phòng trọ KCN' },
  { city: 'Nha Trang', subtitle: 'Phòng view biển' },
  { city: 'Đà Lạt', subtitle: 'Phòng nghỉ dưỡng' },
  { city: 'Hải Phòng', subtitle: 'Căn hộ mini' },
];

export default function Home() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const { data, isLoading } = useProperties({ status: 'available', limit: 6 });
  const featured = data?.data ?? [];

  const goSearch = (params: Record<string, string>) =>
    router.push({ pathname: '/search', params });

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={['#d3eaf2', '#ffffff']} style={styles.heroGradient}>
        {/* Top bar */}
        {accessToken ? (
          <View style={styles.topBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.greetingName} numberOfLines={1}>
                {user?.name ? `Chào, ${user.name.split(' ').slice(-1)[0]}` : 'Tìm tổ ấm của bạn'}
              </Text>
            </View>
            <PressableScale style={styles.avatarBtn} haptic onPress={() => router.push('/account')}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
            </PressableScale>
          </View>
        ) : (
          <View style={styles.topBar}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <PressableScale style={styles.loginPill} haptic onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginPillText}>Đăng nhập</Text>
            </PressableScale>
          </View>
        )}

        {/* Hero */}
        <FadeIn style={styles.hero}>
          <Image
            source={require('../../../assets/hero-brand.png')}
            style={styles.heroBrand}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Tìm nhà trọ phù hợp,{'\n'}dễ dàng và nhanh chóng</Text>
          <Text style={styles.heroSub}>
            Hàng nghìn phòng trọ, căn hộ, nhà nguyên căn đang chờ bạn khám phá.
          </Text>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <View style={styles.searchField}>
              <Text style={styles.searchLabel}>ĐỊA ĐIỂM</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm quận, thành phố..."
                placeholderTextColor="rgba(0,0,0,0.4)"
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                onSubmitEditing={() => goSearch(search ? { search } : {})}
              />
            </View>
            <PressableScale
              style={styles.searchBtn}
              haptic="medium"
              onPress={() => goSearch(search ? { search } : {})}
            >
              <Ionicons name="search" size={20} color="#fff" />
            </PressableScale>
          </View>
        </FadeIn>
        </LinearGradient>

        {/* Categories — icon tròn */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cats}
        >
          {CATEGORIES.map((c) => {
            const isAll = c.value === 'all';
            return (
              <PressableScale
                key={c.value}
                style={styles.cat}
                haptic
                onPress={() => goSearch({ type: c.value })}
              >
                <View style={[styles.catIcon, isAll && styles.catIconActive]}>
                  <Ionicons name={c.icon} size={22} color={isAll ? colors.accentText : colors.brand} />
                </View>
                <Text style={[styles.catLabel, isAll && styles.catLabelActive]}>{c.label}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>

        {/* Featured */}
        <View style={[styles.section, { paddingBottom: 4 }]}>
          <View style={styles.sectionHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Bất động sản phù hợp với bạn</Text>
              <Text style={styles.sectionSub}>Gợi ý những không gian sống tốt nhất.</Text>
            </View>
            <Pressable onPress={() => goSearch({})}>
              <Text style={styles.link}>Xem tất cả</Text>
            </Pressable>
          </View>
        </View>

        {isLoading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}
          >
            {[0, 1, 2].map((i) => (
              <PropertyCardSkeleton key={i} style={styles.featuredCard} />
            ))}
          </ScrollView>
        ) : featured.length === 0 ? (
          <Text style={[styles.empty, { paddingHorizontal: 20 }]}>Chưa có tin đăng nào.</Text>
        ) : (
          <FeaturedCarousel properties={featured} />
        )}

        {/* How it works */}
        <View style={[styles.section, styles.sectionAlt]}>
          <Text style={styles.sectionTitleCenter}>Cách SmartRental hoạt động</Text>
          <View style={styles.steps}>
            {STEPS.map((s) => (
              <View key={s.step} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{s.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Popular cities (marquee tự chạy) */}
        <View style={styles.citiesSection}>
          <Text style={[styles.sectionLabel, styles.citiesLabel]}>KHÁM PHÁ THEO THÀNH PHỐ</Text>
          <CityMarquee cities={CITIES} onPressCity={(c) => goSearch({ search: c })} />
        </View>

        {/* CTA */}
        <View style={[styles.section, styles.cta]}>
          <Text style={styles.ctaTitle}>Bắt đầu ngay hôm nay!</Text>
          <Text style={styles.ctaSub}>
            Tạo tài khoản miễn phí để lưu tin yêu thích, đặt phòng và nhận thông báo mới.
          </Text>
          {!accessToken && (
            <View style={styles.ctaBtns}>
              <PressableScale
                style={styles.ctaPrimary}
                haptic="medium"
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={styles.ctaPrimaryText}>Tạo tài khoản miễn phí</Text>
              </PressableScale>
              <PressableScale
                style={styles.ctaSecondary}
                haptic
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.ctaSecondaryText}>Đăng nhập</Text>
              </PressableScale>
            </View>
          )}

          {/* Landlord card */}
          <View style={styles.hostCard}>
            <Ionicons name="key-outline" size={26} color={colors.brand} />
            <Text style={styles.hostTitle}>Bạn là chủ nhà?</Text>
            <Text style={styles.hostDesc}>
              Đăng tin miễn phí, quản lý đặt phòng và hợp đồng điện tử — tất cả trong một nơi.
            </Text>
            <PressableScale
              style={styles.hostBtn}
              haptic="medium"
              onPress={() => router.push(accessToken ? '/account' : '/(auth)/login')}
            >
              <Text style={styles.hostBtnText}>Đăng tin cho thuê</Text>
            </PressableScale>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safeTop: { backgroundColor: '#d3eaf2' },
  scroll: { paddingBottom: 32 },
  heroGradient: { paddingBottom: 8 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logo: { width: 130, height: 28 },
  greeting: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  greetingName: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 1 },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  loginPill: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  loginPillText: { fontSize: 13, fontWeight: '700', color: colors.accentText },

  hero: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 10 },
  heroBrand: { width: '100%', height: 60, marginBottom: 2 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: colors.text, lineHeight: 34 },
  heroSub: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchField: { flex: 1, gap: 1 },
  searchLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.45)', letterSpacing: 0.5 },
  searchInput: { fontSize: 15, color: '#000', padding: 0 },
  searchBtn: {
    backgroundColor: '#000',
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cats: { paddingHorizontal: 20, paddingVertical: 10, gap: 16 },
  cat: { alignItems: 'center', width: 64 },
  catIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  catIconActive: { backgroundColor: colors.accent },
  catLabel: { fontSize: 11, fontWeight: '600', color: colors.muted, marginTop: 7, textAlign: 'center' },
  catLabelActive: { color: colors.text, fontWeight: '700' },

  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionAlt: { backgroundColor: colors.surfaceAlt, marginTop: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionTitleCenter: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 16 },
  sectionSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: colors.text, letterSpacing: 1, marginBottom: 12 },
  link: { fontSize: 13, fontWeight: '700', color: colors.brand },
  empty: { fontSize: 14, color: colors.muted, textAlign: 'center', marginVertical: 20 },

  featuredRow: { gap: 14, paddingLeft: 20, paddingRight: 6 },
  featuredCard: { width: 280 },

  steps: { gap: 16 },
  step: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  stepNum: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  stepDesc: { fontSize: 13, color: colors.muted, lineHeight: 19 },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...shadow.card,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.brand },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'center' },

  citiesSection: { paddingVertical: 18 },
  citiesLabel: { paddingHorizontal: 20 },

  cta: { alignItems: 'center', gap: 10 },
  ctaTitle: { fontSize: 24, fontWeight: '800', color: colors.brand, textAlign: 'center' },
  ctaSub: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  ctaBtns: { width: '100%', gap: 10, marginTop: 8 },
  ctaPrimary: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  ctaPrimaryText: { fontSize: 15, fontWeight: '700', color: colors.accentText },
  ctaSecondary: {
    borderWidth: 1,
    borderColor: colors.muted,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  ctaSecondaryText: { fontSize: 15, fontWeight: '700', color: colors.text },

  hostCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 22,
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    width: '100%',
    ...shadow.card,
  },
  hostTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  hostDesc: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19 },
  hostBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 6,
  },
  hostBtnText: { fontSize: 14, fontWeight: '700', color: colors.accentText },
});
