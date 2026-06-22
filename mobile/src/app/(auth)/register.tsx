import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { registerApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import IconInput from '@/components/ui/icon-input';
import PressableScale from '@/components/ui/pressable-scale';
import FadeIn from '@/components/fade-in';

type Role = 'tenant' | 'landlord';

const PHONE_RE = /^(0|\+84)\d{9}$/;

function getErr(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

const TABS: { value: Role; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'tenant', label: 'Tìm phòng thuê', icon: 'search-outline' },
  { value: 'landlord', label: 'Cho thuê nhà', icon: 'key-outline' },
];

export default function Register() {
  const router = useRouter();
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [role, setRole] = useState<Role>('tenant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const validate = (): string | null => {
    if (name.trim().length < 2) return 'Tên ít nhất 2 ký tự';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Email không hợp lệ';
    if (role === 'landlord' && !PHONE_RE.test(phone)) return 'Chủ nhà cần số điện thoại hợp lệ';
    if (phone && !PHONE_RE.test(phone)) return 'Số điện thoại không hợp lệ';
    if (password.length < 6) return 'Mật khẩu ít nhất 6 ký tự';
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp';
    return null;
  };

  const handleRegister = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await registerApi({
        name,
        email,
        password,
        phone: phone || undefined,
        role,
      });
      qc.clear();
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/');
    } catch (err) {
      setError(getErr(err, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/register-bg.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FadeIn style={styles.fadeWrap}>
              <Text style={styles.hero}>Tham gia{'\n'}SmartRental</Text>

              <View style={styles.card}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />

                {/* Tab chọn vai trò */}
                <View style={styles.tabs}>
                  {TABS.map((t) => {
                    const active = role === t.value;
                    return (
                      <PressableScale
                        key={t.value}
                        style={[styles.tab, active && styles.tabActive]}
                        scaleTo={0.97}
                        haptic
                        onPress={() => { setRole(t.value); setError(''); }}
                      >
                        <Ionicons
                          name={t.icon}
                          size={16}
                          color={active ? colors.accentText : colors.muted}
                        />
                        <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                      </PressableScale>
                    );
                  })}
                </View>

                <View style={styles.fields}>
                  <IconInput icon="person-outline" placeholder="Họ tên" value={name} onChangeText={setName} />
                  <IconInput
                    icon="mail-outline"
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <IconInput
                    icon="call-outline"
                    placeholder={role === 'landlord' ? 'Số điện thoại (bắt buộc)' : 'Số điện thoại (tùy chọn)'}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                  <IconInput
                    icon="lock-closed-outline"
                    placeholder="Mật khẩu (≥ 6 ký tự)"
                    secure
                    value={password}
                    onChangeText={setPassword}
                  />
                  <IconInput
                    icon="lock-closed-outline"
                    placeholder="Xác nhận mật khẩu"
                    secure
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                {role === 'landlord' && (
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.brand} />
                    <Text style={styles.infoText}>Bạn sẽ vào trang quản lý cho thuê sau khi đăng ký.</Text>
                  </View>
                )}

                {!!error && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <PressableScale style={styles.button} haptic="medium" disabled={loading} onPress={handleRegister}>
                  {loading ? (
                    <ActivityIndicator color={colors.accentText} />
                  ) : (
                    <Text style={styles.buttonText}>Tạo tài khoản</Text>
                  )}
                </PressableScale>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Đã có tài khoản? </Text>
                  <Link href="/(auth)/login" style={styles.link}>Đăng nhập</Link>
                </View>
              </View>
            </FadeIn>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,18,10,0.55)' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  fadeWrap: { gap: 20 },
  hero: { color: '#fff', fontSize: 30, fontWeight: '800', lineHeight: 38, textAlign: 'center' },
  card: { backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: radius.xl, padding: 24, gap: 14, ...shadow.float },
  logo: { width: 150, height: 34, alignSelf: 'center', marginBottom: 2 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 4, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 11, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.accent, ...shadow.soft },
  tabText: { fontSize: 13.5, fontWeight: '700', color: colors.muted },
  tabTextActive: { color: colors.accentText },
  fields: { gap: 12 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbe6',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoText: { fontSize: 12.5, color: colors.brand, fontWeight: '600', flex: 1, lineHeight: 17 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', flex: 1 },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: 2,
    ...shadow.soft,
  },
  buttonText: { color: colors.accentText, fontWeight: '800', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: colors.muted },
  link: { fontSize: 14, color: colors.brand, fontWeight: '800' },
});
