import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import PasswordInput from '@/components/password-input';
import { changePasswordApi } from '@/lib/api/users.api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';

export default function ChangePassword() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!user) return;
    setError('');
    if (!current || !next) {
      setError('Vui lòng nhập đầy đủ mật khẩu');
      return;
    }
    if (next.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (next !== confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setSaving(true);
    try {
      await changePasswordApi(user.id, { currentPassword: current, newPassword: next });
      toast.success('Đã đổi mật khẩu thành công');
      router.back();
    } catch (e) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Đổi mật khẩu thất bại',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Mật khẩu hiện tại">
          <PasswordInput
            value={current}
            onChangeText={setCurrent}
            placeholder="Nhập mật khẩu hiện tại"
            style={styles.input}
          />
        </Field>

        <Field label="Mật khẩu mới">
          <PasswordInput
            value={next}
            onChangeText={setNext}
            placeholder="Tối thiểu 6 ký tự"
            style={styles.input}
          />
        </Field>

        <Field label="Xác nhận mật khẩu mới">
          <PasswordInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Nhập lại mật khẩu mới"
            style={styles.input}
          />
        </Field>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.submit} disabled={saving} onPress={save}>
          {saving ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.submitText}>Đổi mật khẩu</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
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
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, fontSize: 15, padding: 12 },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
  submit: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 999, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 16, fontWeight: '700', color: colors.accentText },
});
