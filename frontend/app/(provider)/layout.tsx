'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import AppNavbar from '@/components/layout/app-navbar';
import { LayoutDashboard, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Tổng quan', href: '/provider', icon: LayoutDashboard, exact: true },
  { label: 'Dịch vụ được giao', href: '/provider/services', icon: Wrench },
];

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isProvider } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (!isProvider) router.replace('/');
  }, [isAuthenticated, isProvider, router]);

  if (!isAuthenticated || !isProvider) {
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
        <aside className="w-56 flex-shrink-0 border-r border-[#dddddd] bg-white flex flex-col">
          <div className="px-4 py-4 border-b border-[#dddddd]">
            <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Nhà cung cấp</p>
          </div>
          <nav className="flex-1 py-3">
            <ul className="space-y-0.5 px-2">
              {NAV.map(({ label, href, icon: Icon, exact }) => {
                const isActive = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[#f7f7f7] text-[#222222] font-semibold'
                          : 'text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222]',
                      )}
                    >
                      <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#ff385c]' : 'text-[#929292]')} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto bg-[#f7f7f7] p-8">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
