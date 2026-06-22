import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

type City = { city: string; subtitle: string };

// Dải thành phố tự chạy ngang liên tục (giống marquee web)
export default function CityMarquee({
  cities,
  onPressCity,
}: {
  cities: City[];
  onPressCity: (city: string) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!width) return;
    translateX.setValue(0);
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -width,
        duration: width * 22, // ~45 px/giây
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [width, translateX]);

  const renderSet = (prefix: string, measure?: boolean) => (
    <View
      style={styles.row}
      onLayout={measure ? (e) => setWidth(e.nativeEvent.layout.width) : undefined}
    >
      {cities.map((c, i) => (
        <Pressable
          key={`${prefix}-${c.city}-${i}`}
          style={styles.item}
          onPress={() => onPressCity(c.city)}
        >
          <Ionicons name="location" size={15} color={colors.brand} />
          <View>
            <Text style={styles.name}>{c.city}</Text>
            <Text style={styles.sub}>{c.subtitle}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={styles.viewport}>
      <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
        {renderSet('a', true)}
        {renderSet('b')}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { overflow: 'hidden' },
  track: { flexDirection: 'row' },
  row: { flexDirection: 'row' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 26, paddingLeft: 2 },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.muted },
});
