import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import PressableScale from '@/components/ui/pressable-scale';
import HeartButton from '@/components/ui/heart-button';
import PropertyReviews from '@/components/property-reviews';
import { StarDisplay } from '@/components/star-rating';
import { useProperty } from '@/hooks/use-properties';
import { usePropertyReviews } from '@/hooks/use-reviews';
import { useMyBookings } from '@/hooks/use-bookings';
import { formatPrice, TYPE_LABEL } from '@/lib/format';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';

const W = Dimensions.get('window').width;
type IoniconName = keyof typeof Ionicons.glyphMap;

// Map tiện nghi → icon (so khớp gần đúng theo từ khoá)
const amenityIcon = (a: string): IoniconName => {
  const s = a.toLowerCase();
  if (s.includes('wifi') || s.includes('mạng')) return 'wifi-outline';
  if (s.includes('lạnh') || s.includes('điều hòa') || s.includes('máy lạnh')) return 'snow-outline';
  if (s.includes('xe') || s.includes('để xe') || s.includes('giữ xe')) return 'car-outline';
  if (s.includes('thang máy')) return 'swap-vertical-outline';
  if (s.includes('bảo vệ') || s.includes('an ninh')) return 'shield-checkmark-outline';
  if (s.includes('bếp') || s.includes('nấu ăn')) return 'restaurant-outline';
  if (s.includes('giặt')) return 'water-outline';
  if (s.includes('gác') || s.includes('giường')) return 'bed-outline';
  if (s.includes('tủ lạnh')) return 'cube-outline';
  if (s.includes('camera')) return 'videocam-outline';
  return 'checkmark-circle-outline';
};

export default function PropertyDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const { data: p, isLoading } = useProperty(id);
  const { data: reviews } = usePropertyReviews(id);
  const { data: myBookings } = useMyBookings();
  const [imgIndex, setImgIndex] = useState(0);

  if (isLoading || !p) {
    return (
      <SafeAreaView style={styles.center}>
        {isLoading ? <ActivityIndicator color={colors.brand} /> : <Text>Không tìm thấy phòng.</Text>}
      </SafeAreaView>
    );
  }

  const images = p.images?.length ? p.images : [];
  const owner = typeof p.owner === 'object' ? p.owner : undefined;
  const avg = reviews?.averageRating;
  const totalReviews = reviews?.totalReviews ?? 0;

  // Trạng thái nút đặt phòng theo quan hệ của user với phòng này
  const ownerId = owner?.id ?? owner?._id ?? (typeof p.owner === 'string' ? p.owner : undefined);
  const isOwner = !!user && !!ownerId && user.id === ownerId;
  const myBooking = accessToken
    ? (myBookings?.data ?? []).find((b) => {
        const bp = typeof b.property === 'object' ? b.property.id : b.property;
        return bp === p.id && ['pending', 'confirmed', 'active'].includes(b.status);
      })
    : undefined;
  const bookState: 'owner' | 'active' | 'requested' | 'rented' | 'available' = isOwner
    ? 'owner'
    : myBooking?.status === 'active'
      ? 'active'
      : myBooking
        ? 'requested'
        : p.status === 'rented'
          ? 'rented'
          : 'available';

  const onBook = () => {
    if (!accessToken) return router.push('/(auth)/login');
    if (user?.role === 'landlord') {
      toast.info('Tài khoản chủ nhà không thể đặt phòng');
      return;
    }
    router.push(`/bookings/new?propertyId=${p.id}`);
  };
  const onScrollImg = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setImgIndex(Math.round(e.nativeEvent.contentOffset.x / W));

  const openMap = () => {
    const { lat, lng } = p.address ?? {};
    const query =
      lat != null && lng != null
        ? `${lat},${lng}`
        : encodeURIComponent(
            p.address?.fullAddress ??
              [p.address?.street, p.address?.ward, p.address?.district, p.address?.city]
                .filter(Boolean)
                .join(', '),
          );
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Ảnh carousel */}
        <View>
          {images.length ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={onScrollImg}
              scrollEventThrottle={16}
            >
              {images.map((im, i) => (
                <Image key={i} source={{ uri: im.url }} style={styles.hero} contentFit="cover" transition={250} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.hero, styles.placeholder]}>
              <Ionicons name="image-outline" size={40} color="#bbb" />
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.32)', 'transparent']}
            style={styles.heroShade}
            pointerEvents="none"
          />

          {/* Chấm chỉ số ảnh */}
          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          {/* Nút back + ♡ */}
          <SafeAreaView edges={['top']} style={styles.topBar}>
            <PressableScale style={styles.circleBtn} haptic onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </PressableScale>
            <HeartButton propertyId={p.id} tone="light" hideWhenGuest={false} size={22} style={styles.circleBtn} />
          </SafeAreaView>
        </View>

        {/* Khối nội dung bo tròn đè lên ảnh */}
        <View style={styles.sheet}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{TYPE_LABEL[p.type] ?? p.type}</Text>
          </View>

          <Text style={styles.title}>{p.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.rowFlex}>
              <Ionicons name="location-outline" size={15} color={colors.muted} />
              <Text style={styles.address} numberOfLines={1}>
                {p.address?.fullAddress ??
                  [p.address?.district, p.address?.city].filter(Boolean).join(', ')}
              </Text>
            </View>
            {avg != null && totalReviews > 0 && (
              <View style={styles.ratingInline}>
                <StarDisplay rating={avg} size={13} />
                <Text style={styles.ratingText}>{avg.toFixed(1)} ({totalReviews})</Text>
              </View>
            )}
          </View>

          {/* Xem bản đồ */}
          <PressableScale style={styles.mapBtn} haptic onPress={openMap}>
            <Ionicons name="map-outline" size={16} color={colors.brand} />
            <Text style={styles.mapText}>Xem trên bản đồ</Text>
            <Ionicons name="open-outline" size={14} color={colors.muted} />
          </PressableScale>

          {/* Thông số */}
          <View style={styles.specs}>
            <Spec icon="resize-outline" label={`${p.area} m²`} />
            {p.bedrooms != null && <Spec icon="bed-outline" label={`${p.bedrooms} PN`} />}
            {p.bathrooms != null && <Spec icon="water-outline" label={`${p.bathrooms} WC`} />}
          </View>

          {!!p.description && (
            <>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.desc}>{p.description}</Text>
            </>
          )}

          {!!p.amenities?.length && (
            <>
              <Text style={styles.sectionTitle}>Tiện nghi</Text>
              <View style={styles.amenities}>
                {p.amenities.map((a) => (
                  <View key={a} style={styles.amenity}>
                    <Ionicons name={amenityIcon(a)} size={15} color={colors.brand} />
                    <Text style={styles.amenityText}>{a}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Chủ nhà */}
          {owner && (
            <>
              <Text style={styles.sectionTitle}>Chủ nhà</Text>
              <View style={styles.hostCard}>
                <View style={styles.hostAvatar}>
                  {owner.avatar ? (
                    <Image source={{ uri: owner.avatar }} style={styles.hostAvatarImg} />
                  ) : (
                    <Text style={styles.hostAvatarText}>{owner.name?.charAt(0)?.toUpperCase() ?? 'C'}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hostName}>{owner.name}</Text>
                  <Text style={styles.hostRole}>Chủ nhà · quản lý phòng này</Text>
                </View>
                <Ionicons name="shield-checkmark" size={20} color={colors.brand} />
              </View>
            </>
          )}

          {/* Đánh giá */}
          <PropertyReviews propertyId={p.id} />
        </View>
      </ScrollView>

      {/* Thanh đặt phòng cố định */}
      <SafeAreaView edges={['bottom']} style={styles.bookBarWrap}>
        <View style={styles.bookBar}>
          <View style={{ flex: 1 }}>
            {bookState === 'owner' ? (
              <Text style={styles.bookState}>Tin đăng của bạn</Text>
            ) : bookState === 'active' ? (
              <Text style={styles.bookState}>Bạn đang thuê phòng này</Text>
            ) : bookState === 'requested' ? (
              <Text style={styles.bookState}>Đang chờ chủ nhà duyệt</Text>
            ) : (
              <>
                <Text style={styles.bookPrice}>{formatPrice(p.price)}đ</Text>
                <Text style={styles.bookUnit}>mỗi tháng</Text>
              </>
            )}
          </View>

          {bookState === 'owner' ? (
            <PressableScale style={styles.bookBtn} haptic onPress={() => router.push('/listings')}>
              <Text style={styles.bookBtnText}>Quản lý tin</Text>
            </PressableScale>
          ) : bookState === 'active' || bookState === 'requested' ? (
            <PressableScale style={styles.bookBtn} haptic onPress={() => router.push('/bookings')}>
              <Text style={styles.bookBtnText}>Xem chuyến đi</Text>
            </PressableScale>
          ) : bookState === 'rented' ? (
            <View style={[styles.bookBtn, styles.bookBtnDisabled]}>
              <Text style={styles.bookBtnDisabledText}>Đã cho thuê</Text>
            </View>
          ) : (
            <PressableScale style={styles.bookBtn} haptic="medium" onPress={onBook}>
              <Text style={styles.bookBtnText}>Đặt phòng</Text>
            </PressableScale>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

function Spec({ icon, label }: { icon: IoniconName; label: string }) {
  return (
    <View style={styles.spec}>
      <Ionicons name={icon} size={18} color={colors.brand} />
      <Text style={styles.specText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  hero: { width: W, height: 300, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  heroShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 90 },
  dots: { position: 'absolute', bottom: 36, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { width: 20, backgroundColor: '#fff' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between' },
  circleBtn: {
    margin: 12,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.accentText },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2, lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowFlex: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  address: { fontSize: 14, color: colors.muted, flex: 1 },
  ratingInline: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ratingText: { fontSize: 12, fontWeight: '700', color: colors.text },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
    ...shadow.soft,
  },
  mapText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  specs: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 4 },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.sm,
    ...shadow.soft,
  },
  specText: { fontSize: 13, fontWeight: '700', color: colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 16 },
  desc: { fontSize: 14, color: colors.muted, lineHeight: 22 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.sm,
    ...shadow.soft,
  },
  amenityText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 10,
    ...shadow.card,
  },
  hostAvatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hostAvatarImg: { width: '100%', height: '100%' },
  hostAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  hostName: { fontSize: 15, fontWeight: '800', color: colors.text },
  hostRole: { fontSize: 12, color: colors.muted, marginTop: 2 },
  bookBarWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, ...shadow.float },
  bookBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bookPrice: { fontSize: 18, fontWeight: '800', color: colors.brand },
  bookUnit: { fontSize: 12, color: colors.muted },
  bookState: { fontSize: 15, fontWeight: '700', color: colors.text },
  bookBtnDisabled: { backgroundColor: colors.surfaceAlt },
  bookBtnDisabledText: { fontSize: 15, fontWeight: '700', color: colors.muted },
  bookBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  bookBtnText: { fontSize: 15, fontWeight: '800', color: colors.accentText },
});
