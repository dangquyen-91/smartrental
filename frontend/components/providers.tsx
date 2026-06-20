'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
if (!googleClientId && typeof window !== 'undefined') {
  console.error('[SmartRental] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google login will not work.');
}

// Handles Google OAuth redirect back to the root URL (https://smartrental.io.vn#access_token=...)
function GoogleOAuthCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!window.location.hash.includes('access_token')) return;
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get('access_token');
    if (!token) return;
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
    sessionStorage.setItem('google_pending_token', token);
    const source = sessionStorage.getItem('google_oauth_source') ?? 'login';
    sessionStorage.removeItem('google_oauth_source');
    router.push(`/${source}`);
  }, [router]);

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
    // If already hydrated (shouldn't happen with skipHydration, but safe-guard), do nothing.
    if (useAuthStore.getState()._hasHydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      useAuthStore.getState().setHasHydrated(true);
    });
    // Trigger rehydration (sync if already cached, async if not).
    useAuthStore.persist.rehydrate();
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
