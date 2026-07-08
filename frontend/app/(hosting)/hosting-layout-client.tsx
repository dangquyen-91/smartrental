'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import HostingLayoutWrapper from '@/components/hosting/HostingLayout';

export default function HostingLayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLandlord, isAdmin, hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (!isLandlord && !isAdmin) router.replace('/');
  }, [hasHydrated, isAuthenticated, isLandlord, isAdmin, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#2683EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || (!isLandlord && !isAdmin)) {
    return null;
  }

  return <HostingLayoutWrapper>{children}</HostingLayoutWrapper>;
}
