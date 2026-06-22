import axios from 'axios';
import { API_BASE_URL } from '@/lib/config';
import { useAuthStore } from '@/stores/auth.store';

const api = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

// Tự gắn Bearer token vào mọi request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gặp 401 -> thử refresh token 1 lần rồi chạy lại request cũ
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const noRefresh = ['/auth/login', '/auth/register', '/auth/google', '/auth/refresh-token'];

    if (error.response?.status !== 401 || original?._retry) return Promise.reject(error);
    if (noRefresh.some((u) => original?.url?.includes(u))) return Promise.reject(error);

    original._retry = true;
    const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
    if (!refreshToken) {
      await clearAuth();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
      await setTokens(data.data.accessToken, data.data.refreshToken);
      original.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(original);
    } catch (err) {
      await clearAuth();
      return Promise.reject(err);
    }
  },
);

export default api;
