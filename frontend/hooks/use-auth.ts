import { useAuthStore } from '@/stores/auth.store';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return {
    user,
    isAuthenticated: !!accessToken,
    isLandlord: user?.role === 'landlord',
    isTenant: user?.role === 'tenant',
    isAdmin: user?.role === 'admin',
    isProvider: user?.role === 'provider',
    logout: clearAuth,
  };
}
