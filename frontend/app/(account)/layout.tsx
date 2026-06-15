'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Heart, CalendarCheck, FileText, Users, Wrench, User, Settings, LayoutDashboard, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-navbar';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Hồ sơ cá nhân',      href: '/profile',   Icon: User },
  { label: 'Yêu thích',          href: '/wishlist',  Icon: Heart },
  { label: 'Đơn thuê',           href: '/trips',     Icon: CalendarCheck },
  { label: 'Hợp đồng',           href: '/contracts', Icon: FileText },
  { label: 'Tìm bạn cùng phòng', href: '/roommate',  Icon: Users },
  { label: 'Dịch vụ',            href: '/services',  Icon: Wrench },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hasHydrated, logout, isAdmin, isLandlord } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.replace('/login');
  }, [hasHydrated, isAuthenticated, router]);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#2683EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-screen">
      {/* ── Header ── */}
      <div
        className="bg-cover bg-center py-[22px] px-20"
        style={{
          backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/eb609fa3-9a4b-4bf7-8291-56c045573ba8)',
        }}
      >
        <div className="flex justify-between items-center self-stretch">
          <Link href="/">
            <img
              src="/logo/logo_header.png"
              alt="SmartRental"
              className="w-[182px] h-[26px] object-contain cursor-pointer"
            />
          </Link>

          <div className="flex shrink-0 items-center">
            {/* Avatar dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-black/10 transition-colors"
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name ?? 'Avatar'}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border border-[#ccc7ac]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#ffef3d] text-[#676000] flex items-center justify-center text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-[#222222] transition-transform',
                    menuOpen && 'rotate-180',
                  )}
                />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-xl shadow-lg border border-[#ccc7ac] z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#ccc7ac]">
                      <p className="text-sm font-semibold text-[#191c1d] truncate">{user?.name}</p>
                      <p className="text-xs text-[#4a4733] truncate mt-0.5">{user?.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#191c1d] hover:bg-[#f3f4f5] transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Tài khoản của tôi
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#676000] hover:bg-[#f3f4f5] transition-colors font-semibold"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Trang quản trị
                        </Link>
                      )}

                      {isLandlord && (
                        <Link
                          href="/hosting"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#191c1d] hover:bg-[#f3f4f5] transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Quản lý chỗ ở
                        </Link>
                      )}

                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#191c1d] hover:bg-[#f3f4f5] transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Cài đặt
                      </Link>
                    </div>

                    <div className="py-1 border-t border-[#ccc7ac]">
                      <button
                        onClick={() => { setMenuOpen(false); logout(); router.push('/'); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#ba1a1a] hover:bg-[#fff0f3] transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1 self-stretch">
        {/* Sidebar — fixed width, always visible */}
        <aside className="w-[223px] shrink-0 flex flex-col items-start bg-white border-r border-[#DDDDDD]">
          <div className="flex items-center py-[21px] pl-[15px] pr-[118px] gap-2 border-b border-solid border-b-[#DDDDDD] w-full">
            <span className="text-[#929292] text-[11px] font-bold uppercase tracking-widest">Tài khoản</span>
          </div>

          {/* Section label */}
          <div className="flex flex-col items-start py-4 pl-[15px] pr-[70px] border-b border-solid border-b-[#DDDDDD]">
            <span className="text-[#929292] text-[13px] font-bold">QUẢN LÝ TÀI KHOẢN</span>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col items-start px-[7px] pt-3 gap-0.5 w-full">
            {NAV_ITEMS.map(({ label, href, Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center py-2.5 rounded-lg w-full',
                    isActive ? 'bg-[#F7F7F7]' : '',
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 mx-3 shrink-0',
                      isActive ? 'text-[#222222]' : 'text-[#6A6A6A]',
                    )}
                  />
                  <span className={cn(
                    'text-[15px]',
                    isActive ? 'text-[#222222] font-bold' : 'text-[#6A6A6A]',
                  )}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-[#F6F8FB] p-8">
          <div className="max-w-[1217px]">{children}</div>
        </main>
      </div>

      {/* ── Footer ── */}
      <PublicFooter />
    </div>
  );
}
