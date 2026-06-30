'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { googleLoginApi } from '@/lib/api/auth.api';
import type { User } from '@/types';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
if (!googleClientId && typeof window !== 'undefined') {
  console.error('[SmartRental] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google login will not work.');
}

// Handles Google OAuth redirect back to the root URL (https://smartrental.io.vn#access_token=...)
// Processes the token directly to avoid showing the login page as a middleman.
function GoogleOAuthCallbackHandler() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (!window.location.hash.includes('access_token')) return;
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get('access_token');
    if (!token) return;
    window.history.replaceState({}, '', window.location.pathname + window.location.search);

    const source = sessionStorage.getItem('google_oauth_source') ?? 'login';
    // Only trust google_register_role when coming from the register page — on the
    // login flow this key may be stale from a previous abandoned register attempt,
    // which would silently bypass the role-picker for new accounts.
    const role = source === 'register'
      ? (sessionStorage.getItem('google_register_role') as 'tenant' | 'landlord' | null)
      : null;
    sessionStorage.removeItem('google_oauth_source');
    sessionStorage.removeItem('google_register_role');

    const handle = async () => {
      try {
        const data = await googleLoginApi(token, role ?? undefined);
        const gUser = data.user as unknown as User;
        setAuth(gUser, data.accessToken, data.refreshToken);
        if (gUser.role === 'admin') router.push('/admin');
        else if (role === 'landlord') router.push('/hosting');
        else router.push('/');
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404 && !role) {
          // New user from login flow — store token so login page shows role picker
          sessionStorage.setItem('google_pending_token', token);
          router.push('/login');
          return;
        }
        router.push(`/${source}?error=google`);
      }
    };
    handle();
  }, [router, setAuth]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  );

  // Zustand persist does NOT auto-rehydrate when skipHydration is true.
  // We must call rehydrate() explicitly AND listen for completion.
  useEffect(() => {
    if (useAuthStore.getState()._hasHydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      useAuthStore.getState().setHasHydrated(true);
    });
    useAuthStore.persist.rehydrate();
    // Safety: localStorage is synchronous — hydration may complete inside
    // rehydrate() before the callback above fires. Check the flag directly.
    if (useAuthStore.persist.hasHydrated()) {
      useAuthStore.getState().setHasHydrated(true);
    }
    return () => unsub();
  }, []);

  return (
    <GoogleOAuthProvider clientId={googleClientId ?? ''}>
      <QueryClientProvider client={queryClient}>
        <GoogleOAuthCallbackHandler />
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
