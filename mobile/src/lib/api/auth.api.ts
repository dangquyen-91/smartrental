import api from '@/lib/api';
import type { AuthData, Role, User } from '@/types/auth';

export async function registerApi(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'tenant' | 'landlord';
}) {
  const { data } = await api.post('/auth/register', input);
  return data.data as AuthData;
}

export async function loginApi(input: { email: string; password: string }) {
  const { data } = await api.post('/auth/login', input);
  return data.data as AuthData;
}

export async function getMeApi() {
  const { data } = await api.get('/auth/me');
  // Production bọc trong { user }, main trả thẳng -> hỗ trợ cả hai
  return (data.data?.user ?? data.data) as User;
}

// Gửi access token Google + role (chọn lúc đăng ký) -> trả token app + user
export async function googleLoginApi(googleAccessToken: string, role?: Role) {
  const { data } = await api.post('/auth/google', { googleAccessToken, role });
  return data.data as AuthData;
}
