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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { radius, shadow } from '@/constants/theme';
import { loginApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import IconInput from '@/components/ui/icon-input';
import PressableScale from '@/components/ui/pressable-scale';
import FadeIn from '@/components/fade-in';

export default function Login() {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: async (data) => {
      qc.clear();
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/');
    },
  });

  const errMsg =
    (mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    'Email hoặc mật khẩu không đúng';

  return (
    <ImageBackground
      source={require('../../../assets/login-bg.jpg')}
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
              <Text style={styles.hero}>Bắt đầu hành trình{'\n'}tìm kiếm tổ ấm</Text>

              <View style={styles.features}>
                <View style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.accentText} />
                  </View>
                  <Text style={styles.featureText}>Thông tin minh bạch</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="flash" size={16} color={colors.accentText} />
                  </View>
                  <Text style={styles.featureText}>Đăng ký nhanh chóng</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.title}>Đăng nhập</Text>
                <Text style={styles.subtitle}>Chào mừng bạn quay lại 👋</Text>

                <View style={styles.fields}>
                  <IconInput
                    icon="mail-outline"
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <IconInput
                    icon="lock-closed-outline"
                    placeholder="Mật khẩu"
                    secure
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                {mutation.isError && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text style={styles.errorText}>{errMsg}</Text>
                  </View>
                )}

                <PressableScale
                  style={styles.button}
                  haptic="medium"
                  disabled={mutation.isPending}
                  onPress={() => mutation.mutate({ email, password })}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator color={colors.accentText} />
                  ) : (
                    <Text style={styles.buttonText}>Đăng nhập</Text>
                  )}
                </PressableScale>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                  <Link href="/(auth)/register" style={styles.link}>Đăng ký ngay</Link>
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
  features: { gap: 10, alignSelf: 'center' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { backgroundColor: colors.accent, padding: 6, borderRadius: 8 },
  featureText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: radius.xl, padding: 24, gap: 14, ...shadow.float },
  logo: { width: 150, height: 34, alignSelf: 'center', marginBottom: 2 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: -8 },
  fields: { gap: 12, marginTop: 2 },
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
    marginTop: 4,
    ...shadow.soft,
  },
  buttonText: { color: colors.accentText, fontWeight: '800', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  footerText: { fontSize: 14, color: colors.muted },
  link: { fontSize: 14, color: colors.brand, fontWeight: '800' },
});
