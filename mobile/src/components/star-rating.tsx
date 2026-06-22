import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const STAR_COLOR = '#fbbf24'; // amber-400

// Hiển thị sao (read-only), hỗ trợ nửa sao
export function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((s) => {
        const name = rating >= s ? 'star' : rating >= s - 0.5 ? 'star-half' : 'star-outline';
        return <Ionicons key={s} name={name} size={size} color={STAR_COLOR} />;
      })}
    </View>
  );
}

// Chọn sao (input)
export function StarInput({
  value,
  onChange,
  size = 36,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.inputRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Pressable key={s} onPress={() => onChange(s)} hitSlop={6}>
          <Ionicons
            name={value >= s ? 'star' : 'star-outline'}
            size={size}
            color={STAR_COLOR}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
  inputRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
});
