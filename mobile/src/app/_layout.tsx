import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
} from '@expo-google-fonts/be-vietnam-pro';
import { FONT_FAMILY } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';
import { tokenStorage } from '@/lib/token-storage';
import ToastHost from '@/components/ui/toast';

const queryClient = new QueryClient();

// Lần đầu mở app (chưa xem onboarding) → chuyển sang màn giới thiệu
function OnboardingGate() {
  const router = useRouter();
  useEffect(() => {
    let mounted = true;
    (async () => {
      const seen = await tokenStorage.get('onboarded');
      if (mounted && !seen) router.replace('/onboarding');
    })();
    return () => {
      mounted = false;
    };
  }, [router]);
  return null;
}

// ─── Áp font Be Vietnam Pro toàn app, map theo fontWeight ───────────────────────
// Patch Text.render 1 lần: đọc fontWeight của từng Text → chọn đúng file font
// (Regular/Medium/SemiBold/Bold/ExtraBold) thay vì faux-bold xấu.
let patched = false;
function patchTextFont() {
  if (patched) return;
  patched = true;
  const TextAny = Text as unknown as { render: (...a: unknown[]) => { props: { style?: unknown } } };
  const orig = TextAny.render;
  TextAny.render = function render(...args: unknown[]) {
    const el = orig.apply(this, args) as {
      props: { style?: unknown };
    };
    const flat = (StyleSheet.flatten(el.props.style) ?? {}) as TextStyle;
    const weight = String(flat.fontWeight ?? '400');
    const family = FONT_FAMILY[weight] ?? FONT_FAMILY['400'];
    return {
      ...el,
      props: {
        ...el.props,
        style: [{ fontFamily: family }, el.props.style, { fontWeight: undefined }],
      },
    };
  };
}
patchTextFont();

export default function RootLayout() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  // Nạp token đã lưu khi mở app
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
        <OnboardingGate />
        <ToastHost />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
