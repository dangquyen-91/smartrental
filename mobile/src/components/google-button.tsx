import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { googleLoginApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

export default function GoogleButton({
  role,
  onError,
}: {
  role?: 'tenant' | 'landlord';
  onError?: (msg: string) => void;
}) {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    try {
      setLoading(true);
      onError?.('');
      await GoogleSignin.hasPlayServices();
      // Đăng xuất phiên Google cũ để LUÔN hiện bảng chọn tài khoản
      // (nếu không, signIn() tự dùng lại account đã đăng nhập trước đó).
      await GoogleSignin.signOut();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return; // người dùng bấm hủy

      const { accessToken } = await GoogleSignin.getTokens();
      // role chỉ có ở màn Đăng ký → cho phép tạo tài khoản Google mới
      const data = await googleLoginApi(accessToken, role);
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/');
    } catch (err) {
      if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) return;
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Đăng nhập Google thất bại';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable style={styles.btn} onPress={handlePress} disabled={loading}>
      {loading ? (
        <ActivityIndicator color="#444" />
      ) : (
        <>
          <Text style={styles.g}>G</Text>
          <Text style={styles.text}>Tiếp tục với Google</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
  },
  g: { color: '#4285F4', fontWeight: '900', fontSize: 18 },
  text: { color: '#191c1d', fontWeight: '600', fontSize: 15 },
});
