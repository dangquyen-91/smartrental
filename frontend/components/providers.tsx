'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
if (!googleClientId && typeof window !== 'undefined') {
  console.error('[SmartRental] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google login will not work.');
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
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
