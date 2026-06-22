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
import { useGenerateContract } from '@/hooks/use-contracts';

export default function NewContract() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const gen = useGenerateContract();

  const [terms, setTerms] = useState('');
  const [electricityPrice, setElectricityPrice] = useState('');
  const [waterPrice, setWaterPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!bookingId) return;
    setError('');
    gen.mutate(
      {
        bookingId,
        terms: terms.trim() || undefined,
        electricityPrice: electricityPrice ? Number(electricityPrice) : null,
        waterPrice: waterPrice ? Number(waterPrice) : null,
        paymentMethod: paymentMethod.trim() || null,
      },
      {
        onSuccess: (contract) => router.replace(`/contracts/${contract.id}`),
        onError: (e) =>
          setError(
            (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              'Tạo hợp đồng thất bại',
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
        <Text style={styles.headerTitle}>Tạo hợp đồng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Thông tin cơ bản (phòng, các bên, giá thuê) lấy tự động từ booking. Bạn chỉ cần bổ sung điều khoản & chi phí.
        </Text>

        <Field label="Điều khoản hợp đồng">
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="VD: Đặt cọc 1 tháng, báo trước 30 ngày khi trả phòng..."
            placeholderTextColor="#999"
            multiline
            value={terms}
            onChangeText={setTerms}
          />
        </Field>

        <View style={styles.row2}>
          <Field label="Giá điện (đ/kWh)" style={styles.flex1}>
            <TextInput
              style={styles.input}
              placeholder="3500"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={electricityPrice}
              onChangeText={setElectricityPrice}
            />
          </Field>
          <Field label="Giá nước (đ/người)" style={styles.flex1}>
            <TextInput
              style={styles.input}
              placeholder="100000"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={waterPrice}
              onChangeText={setWaterPrice}
            />
          </Field>
        </View>

        <Field label="Phương thức thanh toán">
          <TextInput
            style={styles.input}
            placeholder="VD: Chuyển khoản hàng tháng trước ngày 5"
            placeholderTextColor="#999"
            value={paymentMethod}
            onChangeText={setPaymentMethod}
          />
        </Field>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.submit} disabled={gen.isPending} onPress={submit}>
          {gen.isPending ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <Text style={styles.submitText}>Tạo hợp đồng</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, style, children }: { label: string; style?: object; children: React.ReactNode }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  hint: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: colors.text, backgroundColor: colors.surface },
  textarea: { height: 110, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  submit: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 999, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 16, fontWeight: '700', color: colors.accentText },
});
