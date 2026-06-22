import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { createBookingPaymentApi, getBookingPaymentStatusApi } from '@/lib/api/payment.api';
import { toast } from '@/stores/toast.store';

export default function Checkout() {
  const router = useRouter();
  const qc = useQueryClient();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const handled = useRef(false); // tránh xử lý 2 lần

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { checkoutUrl } = await createBookingPaymentApi(bookingId);
        if (mounted) setUrl(checkoutUrl);
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Không tạo được link thanh toán';
        if (mounted) setError(msg);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  const finish = async (paid: boolean) => {
    if (handled.current) return;
    handled.current = true;

    if (!paid) {
      router.back();
      return;
    }

    setVerifying(true);
    // Poll DB chờ webhook cập nhật (paymentStatus)
    let ok = false;
    for (let i = 0; i < 6; i++) {
      try {
        const s = await getBookingPaymentStatusApi(bookingId);
        if (s.paymentStatus === 'paid') {
          ok = true;
          break;
        }
      } catch {
        /* bỏ qua, thử lại */
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    qc.invalidateQueries({ queryKey: ['my-bookings'] });
    if (ok) toast.success('Thanh toán thành công! 🎉');
    else toast.info('Đã nhận thanh toán, đang cập nhật...');
    router.back();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Thanh toán</Text>
        <View style={{ width: 40 }} />
      </View>

      {error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : !url || verifying ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.loadingText}>
            {verifying ? 'Đang xác nhận thanh toán...' : 'Đang tải trang thanh toán...'}
          </Text>
        </View>
      ) : (
        <WebView
          source={{ uri: url }}
          startInLoadingState
          // Chặn ngay khi PayOS redirect về returnUrl/cancelUrl -> không load trang localhost
          onShouldStartLoadWithRequest={(req) => {
            if (req.url.includes('payment=success')) {
              finish(true);
              return false;
            }
            if (req.url.includes('payment=cancel')) {
              finish(false);
              return false;
            }
            return true;
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  loadingText: { fontSize: 14, color: colors.muted },
  error: { fontSize: 15, color: colors.danger, textAlign: 'center' },
});
