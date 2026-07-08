'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LogOut, ChevronDown,
  LayoutDashboard, Users, Building2, CreditCard, Wrench, Star, Home,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Tổng quan',  href: '/admin',              icon: LayoutDashboard, exact: true },
  { label: 'Người dùng', href: '/admin/users',        icon: Users },
  { label: 'Tin đăng',   href: '/admin/properties',   icon: Building2 },
  { label: 'Dịch vụ',    href: '/admin/services',     icon: Wrench },
  { label: 'Giao dịch',  href: '/admin/transactions', icon: CreditCard },
  { label: 'Đánh giá',  href: '/admin/reviews',      icon: Star },
];

const SIDEBAR_W = 224;

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, user, hasHydrated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (!isAdmin) router.replace('/');
  }, [hasHydrated, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!hasHydrated || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5f7]">
        <div className="w-8 h-8 border-2 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f4f5f7]">
      {/* ── Header ── */}
      <header className="h-[64px] shrink-0 bg-white border-b border-[#e2e5ea] flex items-center px-5 gap-4 z-30">
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2 shrink-0 mr-2">
          <Image
            src="/logo/SmartRental_02.png"
            alt="SmartRental"
            width={160}
            height={160}
            className="h-10 w-auto object-contain"
            loading="eager"
            priority
          />
        </Link>

        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Admin badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full border border-[#e2e5ea] text-[#6a6a6a] text-xs font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff385c]" />
            Quản trị viên
          </div>

          {/* Avatar / User dropdown */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 h-9 rounded-[20px] px-2 hover:bg-[#f4f5f7] transition-colors ml-1"
            >
              <div className="w-7 h-7 rounded-full bg-[#222] text-white text-xs font-bold flex items-center justify-center">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
              <ChevronDown className={cn('w-3.5 h-3.5 text-[#6a6a6a] transition-transform', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 max-w-[calc(100vw-32px)] bg-white border border-[#e2e5ea] rounded-xl shadow-lg py-1 z-50">
                <div className="px-4 py-3 border-b border-[#e2e5ea]">
                  <p className="text-sm font-semibold text-[#222] truncate">{user?.name}</p>
                  <p className="text-xs text-[#9ca3af] truncate mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); logout(); router.push('/'); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#c13515] hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="lg:hidden flex overflow-x-auto gap-1 px-4 py-2 bg-[#1a1a2e] shrink-0">
        {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap text-sm shrink-0 transition-colors',
                isActive ? 'bg-[#ff385c] text-white font-semibold' : 'text-white/50 hover:text-white/90',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="hidden lg:flex flex-col shrink-0 bg-[#1a1a2e] border-r border-black/5"
          style={{ width: SIDEBAR_W }}
        >
          {/* Section label */}
          <div className="flex items-center h-11 px-4 border-b border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Quản trị hệ thống
            </span>
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
            {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl transition-all duration-150 group relative h-11 px-3',
                    isActive
                      ? 'bg-[#ff385c] text-white shadow-[0_2px_8px_rgba(255,56,92,0.3)]'
                      : 'text-white/50 hover:bg-white/10 hover:text-white/90',
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white rounded-r-full" />
                  )}
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-white/50 group-hover:text-white/90')} />
                  <span className={cn('text-sm', isActive ? 'font-bold' : 'font-medium')}>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="shrink-0 px-2 pb-4 pt-2 border-t border-white/10 flex flex-col gap-1">
            <Link
              href="/"
              className="flex items-center gap-3 h-10 px-3 rounded-xl text-white/40 hover:bg-white/10 hover:text-white/80 transition-all duration-150"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">Về trang chủ</span>
            </Link>
            <p className="text-[10px] text-white/20 px-3">SmartRental Admin · v1.0.0</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#f4f5f7]">
          <div className="px-6 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
