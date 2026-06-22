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

export default function PropertyCard({
  property,
  style,
  showFavorite = true,
}: {
  property: Property;
  style?: StyleProp<ViewStyle>;
  showFavorite?: boolean;
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
            <Ionicons name="image-outline" size={28} color="#bbb" />
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'transparent']}
          style={styles.topShade}
          pointerEvents="none"
        />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{TYPE_LABEL[property.type] ?? property.type}</Text>
        </View>

        {showFavorite && <HeartButton propertyId={property.id} style={styles.heart} />}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {property.title}
        </Text>

        <View style={styles.row}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          <Text style={styles.location} numberOfLines={1}>
            {property.address?.district}, {property.address?.city}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.price}>
            {formatPrice(property.price)}
            <Text style={styles.priceUnit}>/tháng</Text>
          </Text>
          <View style={styles.statusWrap}>
            <View style={[styles.dot, { backgroundColor: rented ? colors.muted : '#16a34a' }]} />
            <Text style={styles.statusText}>{rented ? 'Đã thuê' : 'Còn trống'}</Text>
          </View>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  imgWrap: { position: 'relative' },
  img: { width: '100%', height: 150, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 56 },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.accentText },
  heart: { position: 'absolute', top: 8, right: 8 },
  body: { padding: 12, gap: 6 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 12, color: colors.muted, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  price: { fontSize: 15, fontWeight: '800', color: colors.brand },
  priceUnit: { fontSize: 11, fontWeight: '500', color: colors.muted },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.muted },
});
