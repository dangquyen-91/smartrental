'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import HostingSidebar from '@/components/layout/hosting-sidebar';
import AppNavbar from '@/components/layout/app-navbar';

export default function HostingLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLandlord, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (!isLandlord && !isAdmin) router.replace('/');
  }, [isAuthenticated, isLandlord, isAdmin, router]);

  if (!isAuthenticated || (!isLandlord && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <AppNavbar />
      <div className="flex flex-1 overflow-hidden">
        <HostingSidebar />
        <main className="flex-1 overflow-y-auto bg-[#f7f7f7] p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
