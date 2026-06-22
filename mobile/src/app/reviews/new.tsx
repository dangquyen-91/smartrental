import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { StarInput } from '@/components/star-rating';
import { useCreateReview } from '@/hooks/use-reviews';
import { toast } from '@/stores/toast.store';

const RATING_LABEL: Record<number, string> = {
  1: 'Rất tệ',
  2: 'Tệ',
  3: 'Bình thường',
  4: 'Tốt',
  5: 'Tuyệt vời',
};

export default function NewReview() {
  const router = useRouter();
  const { bookingId, title } = useLocalSearchParams<{ bookingId: string; title?: string }>();
  const create = useCreateReview();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!bookingId) return;
    setError('');
    create.mutate(
      { bookingId, targetType: 'property', rating, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Cảm ơn bạn! Đánh giá đã được gửi.');
          router.back();
        },
        onError: (e) =>
          setError(
            (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Gửi đánh giá thất bại',
          ),
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Viết đánh giá</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {!!title && (
          <Text style={styles.propTitle} numberOfLines={2}>
            {title}
          </Text>
        )}

        <View style={styles.ratingBox}>
          <Text style={styles.label}>Bạn chấm phòng này mấy sao?</Text>
          <StarInput value={rating} onChange={setRating} />
          <Text style={styles.ratingLabel}>{RATING_LABEL[rating]}</Text>
        </View>

        <Text style={styles.label}>Nhận xét (không bắt buộc)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Chia sẻ trải nghiệm của bạn về phòng, chủ nhà, vị trí..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          value={comment}
          onChangeText={setComment}
        />
        <Text style={styles.counter}>{comment.length}/1000</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.submit} disabled={create.isPending} onPress={submit}>
          {create.isPending ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.submitText}>Gửi đánh giá</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  propTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  ratingBox: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 22,
  },
  ratingLabel: { fontSize: 15, fontWeight: '700', color: colors.brand },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textarea: { height: 130, textAlignVertical: 'top' },
  counter: { fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: -6 },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  submit: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 999, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 16, fontWeight: '700', color: colors.accentText },
});
