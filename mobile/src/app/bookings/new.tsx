import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/constants/colors';
import { useProperty } from '@/hooks/use-properties';
import { useCreateBooking } from '@/hooks/use-bookings';
import { formatPrice } from '@/lib/format';
import { toast } from '@/stores/toast.store';

const toYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatVN = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

export default function NewBooking() {
  const router = useRouter();
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const { data: p } = useProperty(propertyId);
  const create = useCreateBooking();

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [duration, setDuration] = useState(1);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const total = p ? p.price * duration : 0;

  const submit = () => {
    if (!propertyId) return;
    setError('');
    create.mutate(
      { property: propertyId, startDate: toYMD(date), duration, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Đã gửi yêu cầu đặt phòng. Chờ chủ nhà xác nhận.');
          router.replace('/bookings');
        },
        onError: (err) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            'Đặt phòng thất bại';
          setError(msg);
        },
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Đặt phòng</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Tóm tắt phòng */}
        {p && (
          <View style={styles.summary}>
            <Text style={styles.propTitle} numberOfLines={2}>{p.title}</Text>
            <Text style={styles.propPrice}>{formatPrice(p.price)}/tháng</Text>
          </View>
        )}

        {/* Ngày bắt đầu */}
        <View style={styles.field}>
          <Text style={styles.label}>Ngày bắt đầu thuê</Text>
          <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={colors.brand} />
            <Text style={styles.dateText}>{formatVN(date)}</Text>
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onValueChange={(_e, d) => {
                setShowPicker(Platform.OS === 'ios');
                if (d) setDate(d);
              }}
              onDismiss={() => setShowPicker(false)}
            />
          )}
        </View>

        {/* Số tháng thuê */}
        <View style={styles.field}>
          <Text style={styles.label}>Thời gian thuê (tháng)</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setDuration((d) => Math.max(1, d - 1))}
            >
              <Ionicons name="remove" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.stepValue}>{duration}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setDuration((d) => Math.min(24, d + 1))}
            >
              <Ionicons name="add" size={22} color={colors.text} />
            </Pressable>
          </View>
          <Text style={styles.hint}>Từ 1 đến 24 tháng</Text>
        </View>

        {/* Ghi chú */}
        <View style={styles.field}>
          <Text style={styles.label}>Ghi chú cho chủ nhà (tùy chọn)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="VD: Tôi muốn xem phòng trước khi ký..."
            placeholderTextColor="#999"
            multiline
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Tạm tính */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Tạm tính ({duration} tháng)</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>
        <Text style={styles.note}>
          Đây là yêu cầu đặt phòng. Bạn chỉ thanh toán sau khi chủ nhà xác nhận và bạn nhận phòng.
        </Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.submit} disabled={create.isPending} onPress={submit}>
          {create.isPending ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.submitText}>Gửi yêu cầu đặt phòng</Text>
          )}
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  summary: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 4,
  },
  propTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  propPrice: { fontSize: 15, fontWeight: '800', color: colors.brand },

  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.muted },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
  },
  dateText: { fontSize: 15, color: colors.text, fontWeight: '600' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  stepValue: { width: 56, textAlign: 'center', fontSize: 18, fontWeight: '800', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  textarea: { height: 90, textAlignVertical: 'top' },

  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 16,
  },
  totalLabel: { fontSize: 14, color: colors.muted },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.brand },
  note: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  submit: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 999, alignItems: 'center' },
  submitText: { fontSize: 16, fontWeight: '700', color: colors.accentText },
});
