import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

// Ô nhập có icon dẫn đầu, viền focus vàng, hỗ trợ ẩn/hiện mật khẩu.
export default function IconInput({
  icon,
  secure,
  style,
  ...props
}: TextInputProps & { icon: IoniconName; secure?: boolean }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <View style={[styles.wrap, focused && styles.wrapFocused]}>
      <Ionicons name={icon} size={19} color={focused ? colors.brand : colors.muted} />
      <TextInput
        placeholderTextColor="#9b9886"
        {...props}
        secureTextEntry={secure && !show}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[styles.input, style]}
      />
      {secure && (
        <Pressable hitSlop={10} onPress={() => setShow((s) => !s)}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 52,
  },
  wrapFocused: { borderColor: colors.accent, backgroundColor: '#fffef2' },
  input: { flex: 1, fontSize: 15, color: colors.text, padding: 0 },
});
