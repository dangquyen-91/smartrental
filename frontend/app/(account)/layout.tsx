'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import AppNavbar from '@/components/layout/app-navbar';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.replace('/login');
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppNavbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {children}
      </main>
    </div>
  );
}
