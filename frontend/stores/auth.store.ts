import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

function setSessionCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'has_session=1; path=/; max-age=2592000; SameSite=Lax';
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
      setAuth: (user, accessToken, refreshToken) => {
        setSessionCookie();
        set({ user, accessToken, refreshToken });
      },
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () => {
        clearSessionCookie();
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: 'smartrental-auth',
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setSessionCookie();
      },
    },
  ),
);
