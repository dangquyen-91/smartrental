import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (token ? p.resolve(token) : p.reject(error)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh on login/register — the 401 is a credential error
    const noRefreshUrls = ['/auth/login', '/auth/register', '/auth/google'];
    if (noRefreshUrls.some((u) => original.url?.includes(u))) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
        { refreshToken },
        { timeout: 10000 },
      );
      const newToken: string = data.data.accessToken;
      const newRefreshToken: string = data.data.refreshToken;
      setTokens(newToken, newRefreshToken);
      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      clearAuth();
      // Only redirect to /login for protected routes.
      // Public routes (e.g. /, /properties, /about) should not redirect —
      // just reject so the UI can show an error or guest content gracefully.
      if (typeof window !== 'undefined') {
        const PUBLIC_ROUTES = ['/', '/about', '/guide', '/news'];
        const pathname = window.location.pathname;
        const isProtected = !PUBLIC_ROUTES.includes(pathname) && !pathname.startsWith('/properties');
        if (isProtected) window.location.href = '/login';
      }
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
