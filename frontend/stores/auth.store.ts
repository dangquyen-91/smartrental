import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setHasHydrated: (v: boolean) => void;
  resyncSessionCookie: () => void;
}

function setSessionCookie() {
  if (typeof document !== 'undefined') {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `has_session=1; path=/; max-age=604800; SameSite=Lax${secure}`;
  }
}

function clearSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'has_session=; path=/; max-age=0';
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) => {
        setSessionCookie();
        set({ user, accessToken, refreshToken });
      },
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setTokens: (accessToken, refreshToken) => {
        // Refresh proves the session is still valid — roll the has_session
        // cookie's expiry forward too, so it doesn't silently outlive/desync
        // from the tokens it's supposed to gate access for.
        setSessionCookie();
        set({ accessToken, refreshToken });
      },
      clearAuth: () => {
        clearSessionCookie();
        set({ user: null, accessToken: null, refreshToken: null });
      },
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      // Recreates has_session from an already-valid client session. Used when
      // the proxy (middleware) bounced us to /login because the cookie was
      // missing/expired even though our own token is still valid — see
      // app/(auth)/login/page.tsx.
      resyncSessionCookie: () => setSessionCookie(),
    }),
    {
      name: 'smartrental-auth',
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
