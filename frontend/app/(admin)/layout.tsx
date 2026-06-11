'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { PublicFooter } from '@/components/layout/public-navbar';
import { LayoutDashboard, Users, Building2, CreditCard, Wrench, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Tổng quan',   href: '/admin',              icon: LayoutDashboard, exact: true },
  { label: 'Người dùng',  href: '/admin/users',        icon: Users },
  { label: 'Tin đăng',    href: '/admin/properties',   icon: Building2 },
  { label: 'Dịch vụ',     href: '/admin/services',     icon: Wrench },
  { label: 'Giao dịch',   href: '/admin/transactions', icon: CreditCard },
  { label: 'Đánh giá',    href: '/admin/reviews',      icon: Star },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white">
      {/* ── Header with background banner ── */}
      <div
        className="bg-cover bg-center py-[22px] px-20"
        style={{
          backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d0cf2b1a-a96d-4ad5-a5e6-13ba2cd73546)',
        }}
      >
        <div className="flex justify-between items-center self-stretch">
          {/* Logo */}
          <Link href="/">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/eedac9f9-e8fc-4f08-9da9-576116b1b6d0"
              alt="SmartRental"
              className="w-[182px] h-[26px] object-fill cursor-pointer"
            />
          </Link>

          {/* Right controls */}
          <div className="flex shrink-0 items-center">
            {/* Admin label */}
            <div className="flex flex-col shrink-0 items-start py-2 px-4 mr-1 rounded-[20px]">
              <span className="text-[#222222] text-sm font-bold">Trang quản trị</span>
            </div>

            {/* Avatar / User dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex shrink-0 items-center py-1 mx-2 rounded-[20px] border border-solid border-[#DDDDDD] bg-white px-2 hover:bg-[#f7f7f7] transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#222222] text-white text-sm font-bold shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
                </div>
                <ChevronDown className={cn('w-3.5 h-3.5 text-[#6A6A6A] ml-1 transition-transform', menuOpen && 'rotate-180')} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#DDDDDD] rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#DDDDDD]">
                    <p className="text-sm font-semibold text-[#222222] truncate">{user?.name}</p>
                    <p className="text-xs text-[#6A6A6A] truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); logout(); router.push('/'); }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-[#c13515] hover:bg-red-50 transition-colors gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + content + footer ── */}
      <div className="flex flex-col items-start self-stretch flex-1">
        {/* Wrapper: sidebar left + content right + footer bottom */}
        <div className="flex flex-col items-start self-stretch flex-1 w-full">
          <div className="flex items-start self-stretch flex-1">
            {/* Sidebar */}
            <aside className="w-[223px] shrink-0 flex flex-col items-start py-4 pl-4 border-r border-[#DDDDDD] border-b border-[#DDDDDD] bg-white">
              <span className="text-[#929292] text-xs font-bold mb-3">QUẢN TRỊ HỆ THỐNG</span>

              <div className="flex flex-col items-start gap-0.5">
                {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
                  const isActive = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center rounded-lg py-2.5 px-3 transition-colors w-full',
                        isActive
                          ? 'bg-[#F7F7F7] text-[#222222] font-bold text-sm'
                          : 'text-[#6A6A6A] text-sm hover:bg-[#F7F7F7] hover:text-[#222222]',
                      )}
                    >
                      <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 bg-[#F7F7F7] pt-[31px] pb-[156px] px-24">
              {children}
            </main>
          </div>

          {/* Footer */}
          <PublicFooter />
        </div>
      </div>
    </div>
  );
}
