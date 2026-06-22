import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { formatPrice, TYPE_LABEL } from '@/lib/format';
import PressableScale from '@/components/ui/pressable-scale';
import HeartButton from '@/components/ui/heart-button';
import type { Property } from '@/types/property';

// Thẻ hàng ngang cho danh sách tìm kiếm.
export default function PropertyRow({ property }: { property: Property }) {
  const router = useRouter();
  const img = property.images?.find((i) => i.isPrimary)?.url ?? property.images?.[0]?.url;
  const rented = property.status === 'rented';

  return (
    <PressableScale
      style={styles.card}
      haptic
      onPress={() => router.push({ pathname: '/properties/[id]', params: { id: property.id } })}
    >
      <View style={styles.thumbWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.thumb} contentFit="cover" transition={250} />
        ) : (
          <View style={[styles.thumb, styles.placeholder]}>
            <Ionicons name="image-outline" size={24} color="#bbb" />
          </View>
        )}
        <HeartButton propertyId={property.id} size={15} style={styles.heart} />
      </View>

      <View style={styles.info}>
        <Text style={styles.type}>{(TYPE_LABEL[property.type] ?? property.type).toUpperCase()}</Text>
        <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={12} color={colors.muted} />
          <Text style={styles.location} numberOfLines={1}>
            {property.address?.district}, {property.address?.city}
          </Text>
        </View>
        <View style={styles.foot}>
          <Text style={styles.price}>
            {formatPrice(property.price)}
            <Text style={styles.priceUnit}>đ/th</Text>
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
  card: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 10, ...shadow.card },
  thumbWrap: { position: 'relative' },
  thumb: { width: 96, height: 96, borderRadius: 14, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  heart: { position: 'absolute', top: 6, right: 6 },
  info: { flex: 1, justifyContent: 'center' },
  type: { fontSize: 11, fontWeight: '800', color: colors.brand, letterSpacing: 0.4 },
  title: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  location: { fontSize: 12, color: colors.muted, flexShrink: 1 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 },
  price: { fontSize: 15, fontWeight: '800', color: colors.brand },
  priceUnit: { fontSize: 11, fontWeight: '600', color: colors.muted },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '600', color: colors.muted },
});
