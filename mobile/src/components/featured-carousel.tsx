import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import FeaturedPropertyCard from '@/components/property-card-featured';
import PressableScale from '@/components/ui/pressable-scale';
import type { Property } from '@/types/property';

const W = Dimensions.get('window').width;
const ITEM_W = Math.round(W * 0.72);
const SPACING = 14;
const SNAP = ITEM_W + SPACING;
const SIDE = (W - ITEM_W) / 2;
const CARD_H = 230;

type Slide = { type: 'card'; property: Property } | { type: 'seeAll' };

// Carousel coverflow: ảnh giữa nổi bật, 2 bên thu nhỏ + mờ. Có nút mũi tên ‹ ›.
export default function FeaturedCarousel({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const cards = properties.slice(0, 3);
  const slides: Slide[] = cards.map((property) => ({ type: 'card', property }));
  if (properties.length > 3) slides.push({ type: 'seeAll' });

  const go = (dir: 1 | -1) => {
    const next = Math.min(slides.length - 1, Math.max(0, index + dir));
    scrollRef.current?.scrollTo({ x: next * SNAP, animated: true });
    setIndex(next);
  };
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SNAP));

  return (
    <View>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE, paddingVertical: 6 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
      >
        {slides.map((s, i) => {
          const inputRange = [(i - 1) * SNAP, i * SNAP, (i + 1) * SNAP];
          const scale = scrollX.interpolate({ inputRange, outputRange: [0.85, 1, 0.85], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
          return (
            <Animated.View
              key={s.type === 'card' ? s.property.id : 'see-all'}
              style={[
                { width: ITEM_W, transform: [{ scale }], opacity },
                i < slides.length - 1 && { marginRight: SPACING },
              ]}
            >
              {s.type === 'card' ? (
                <FeaturedPropertyCard property={s.property} />
              ) : (
                <PressableScale style={styles.seeAll} haptic onPress={() => router.push('/search')}>
                  <View style={styles.seeAllIcon}>
                    <Ionicons name="grid" size={30} color={colors.brand} />
                  </View>
                  <Text style={styles.seeAllText}>Xem tất cả</Text>
                  <Text style={styles.seeAllSub}>Khám phá thêm nhiều phòng phù hợp</Text>
                  <View style={styles.seeAllBtn}>
                    <Text style={styles.seeAllBtnText}>Khám phá</Text>
                    <Ionicons name="arrow-forward" size={15} color={colors.accentText} />
                  </View>
                </PressableScale>
              )}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* Nút mũi tên */}
      {index > 0 && (
        <PressableScale style={[styles.arrow, styles.arrowLeft]} haptic scaleTo={0.85} onPress={() => go(-1)}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </PressableScale>
      )}
      {index < slides.length - 1 && (
        <PressableScale style={[styles.arrow, styles.arrowRight]} haptic scaleTo={0.85} onPress={() => go(1)}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    top: 6 + CARD_H / 2 - 19,
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
  arrowLeft: { left: Math.max(6, SIDE - 26) },
  arrowRight: { right: Math.max(6, SIDE - 26) },

  seeAll: {
    height: CARD_H,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    ...shadow.card,
  },
  seeAllIcon: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllText: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 4 },
  seeAllSub: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  seeAllBtnText: { fontSize: 14, fontWeight: '800', color: colors.accentText },
});
