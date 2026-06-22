import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { formatPrice, TYPE_LABEL } from '@/lib/format';
import PressableScale from '@/components/ui/pressable-scale';
import HeartButton from '@/components/ui/heart-button';
import type { Property } from '@/types/property';

// Thẻ nổi bật: ảnh lớn + overlay tên/vị trí, dải giá + trạng thái bên dưới.
export default function FeaturedPropertyCard({
  property,
  style,
}: {
  property: Property;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  const img = property.images?.find((i) => i.isPrimary)?.url ?? property.images?.[0]?.url;
  const rented = property.status === 'rented';

  return (
    <PressableScale
      style={[styles.card, style]}
      haptic
      onPress={() => router.push({ pathname: '/properties/[id]', params: { id: property.id } })}
    >
      <View style={styles.imgWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.img} contentFit="cover" transition={250} />
        ) : (
          <View style={[styles.img, styles.placeholder]}>
            <Ionicons name="image-outline" size={32} color="#bbb" />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.ov} pointerEvents="none" />

        <View style={styles.tag}>
          <Text style={styles.tagText}>{TYPE_LABEL[property.type] ?? property.type}</Text>
        </View>

        <HeartButton propertyId={property.id} style={styles.heart} />

        <View style={styles.overlayText}>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.9)" />
            <Text style={styles.location} numberOfLines={1}>
              {property.address?.district}, {property.address?.city}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.foot}>
        <Text style={styles.price}>
          {formatPrice(property.price)}
          <Text style={styles.priceUnit}>đ/tháng</Text>
        </Text>
        <View style={styles.statusWrap}>
          <View style={[styles.dot, { backgroundColor: rented ? colors.muted : '#16a34a' }]} />
          <Text style={styles.statusText}>{rented ? 'Đã thuê' : 'Còn trống'}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 178, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  ov: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
  tag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 11, fontWeight: '800', color: colors.accentText },
  heart: { position: 'absolute', top: 10, right: 10 },
  overlayText: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  title: { fontSize: 16, fontWeight: '800', color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  location: { fontSize: 12, color: 'rgba(255,255,255,0.92)', flexShrink: 1 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  price: { fontSize: 16, fontWeight: '800', color: colors.brand },
  priceUnit: { fontSize: 11, fontWeight: '600', color: colors.muted },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.muted },
});
