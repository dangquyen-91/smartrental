import { create } from 'zustand';
import { tokenStorage, ACCESS_KEY, REFRESH_KEY } from '@/lib/token-storage';
import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean; // đã đọc token từ SecureStore xong chưa

  setAuth: (user: User, access: string, refresh: string) => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  setAuth: async (user, access, refresh) => {
    await tokenStorage.set(ACCESS_KEY, access);
    await tokenStorage.set(REFRESH_KEY, refresh);
    set({ user, accessToken: access, refreshToken: refresh });
  },

  setUser: (user) => set({ user }),

  setTokens: async (access, refresh) => {
    await tokenStorage.set(ACCESS_KEY, access);
    await tokenStorage.set(REFRESH_KEY, refresh);
    set({ accessToken: access, refreshToken: refresh });
  },

  loadFromStorage: async () => {
    const access = await tokenStorage.get(ACCESS_KEY);
    const refresh = await tokenStorage.get(REFRESH_KEY);
    set({ accessToken: access, refreshToken: refresh, hydrated: true });
  },

  clearAuth: async () => {
    await tokenStorage.remove(ACCESS_KEY);
    await tokenStorage.remove(REFRESH_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
