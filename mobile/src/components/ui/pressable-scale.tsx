import { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean | 'light' | 'medium' | 'heavy';
  children: React.ReactNode;
};

// Pressable có hiệu ứng co nhẹ + rung haptic — cảm giác phản hồi như app native.
export default function PressableScale({
  style,
  scaleTo = 0.96,
  haptic = false,
  onPressIn,
  onPress,
  children,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();

  // Tách style: lớp Pressable (ngoài) giữ VỊ TRÍ + layout-trong-cha (position/top/left/
  // flex/margin/zIndex...) để định vị đúng; lớp Animated.View (trong) giữ HÌNH THỨC
  // (bg/bo góc/kích thước/padding) + transform co giãn. Tránh lỗi tách rời khi position:absolute.
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const OUTER_KEYS = [
    'position', 'top', 'right', 'bottom', 'left', 'zIndex', 'flex', 'alignSelf',
    'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
    'marginHorizontal', 'marginVertical',
  ];
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const k of Object.keys(flat)) {
    (OUTER_KEYS.includes(k) ? outer : inner)[k] = flat[k];
  }

  return (
    <Pressable
      {...rest}
      style={outer as ViewStyle}
      onPressIn={(e) => {
        animate(scaleTo);
        if (haptic) {
          const impact =
            haptic === 'medium'
              ? Haptics.ImpactFeedbackStyle.Medium
              : haptic === 'heavy'
                ? Haptics.ImpactFeedbackStyle.Heavy
                : Haptics.ImpactFeedbackStyle.Light;
          Haptics.impactAsync(impact).catch(() => {});
        }
        onPressIn?.(e);
      }}
      onPressOut={() => animate(1)}
      onPress={onPress}
    >
      <Animated.View
        style={[
          'flex' in outer ? styles.fill : null,
          inner as ViewStyle,
          { transform: [{ scale }] },
          rest.disabled ? styles.disabled : null,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  disabled: { opacity: 0.5 },
});
