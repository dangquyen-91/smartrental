import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import PressableScale from '@/components/ui/pressable-scale';
import { tokenStorage } from '@/lib/token-storage';

const W = Dimensions.get('window').width;
type IoniconName = keyof typeof Ionicons.glyphMap;

const SLIDES: { icon: IoniconName; title: string; desc: string }[] = [
  {
    icon: 'search',
    title: 'Tìm phòng dễ dàng',
    desc: 'Hàng nghìn phòng trọ, căn hộ, nhà nguyên căn — lọc theo khu vực, giá và loại phòng chỉ trong vài chạm.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Đặt & thanh toán an toàn',
    desc: 'Gửi yêu cầu đặt phòng, chủ nhà xác nhận, thanh toán qua PayOS minh bạch — không lo lừa đảo.',
  },
  {
    icon: 'document-text',
    title: 'Hợp đồng điện tử & hơn thế',
    desc: 'Ký hợp đồng số, đặt dịch vụ tiện ích, tìm bạn ở ghép — tất cả trong một ứng dụng.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  const finish = async () => {
    await tokenStorage.set('onboarded', '1');
    router.replace('/');
  };

  const next = () => {
    if (last) return finish();
    scrollRef.current?.scrollTo({ x: (index + 1) * W, animated: true });
    setIndex(index + 1);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(e.nativeEvent.contentOffset.x / W));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        {!last ? (
          <PressableScale haptic onPress={finish}>
            <Text style={styles.skip}>Bỏ qua</Text>
          </PressableScale>
        ) : (
          <View style={{ height: 20 }} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={styles.slide}>
            <LinearGradient
              colors={[colors.accent, '#fff6b0']}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={s.icon} size={64} color={colors.brand} />
            </LinearGradient>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.desc}>{s.desc}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <PressableScale style={styles.nextBtn} haptic="medium" onPress={next}>
          <Text style={styles.nextText}>{last ? 'Bắt đầu' : 'Tiếp tục'}</Text>
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8, minHeight: 32 },
  skip: { fontSize: 15, fontWeight: '700', color: colors.muted },
  slide: { width: W, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 16 },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...shadow.float,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  desc: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, paddingVertical: 20 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: colors.border },
  dotActive: { width: 22, backgroundColor: colors.brand },
  footer: { paddingHorizontal: 24, paddingBottom: 12 },
  nextBtn: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: radius.pill, alignItems: 'center', ...shadow.soft },
  nextText: { fontSize: 16, fontWeight: '800', color: colors.accentText },
});
