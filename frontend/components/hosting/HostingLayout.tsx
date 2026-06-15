'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LogOut, User, Star, ChevronDown, Settings, LayoutDashboard, Home, CalendarCheck, FileText, Wrench } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { PublicFooter } from '@/components/layout/public-navbar';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const NAV_ITEMS: { label: string; href: string; active: string; Icon: LucideIcon }[] = [
  { label: 'Tổng quan',    href: '/hosting',              active: '/hosting',              Icon: LayoutDashboard },
  { label: 'Tin đăng',     href: '/hosting/listings',     active: '/hosting/listings',     Icon: Home },
  { label: 'Đánh giá',     href: '/hosting/reviews',      active: '/hosting/reviews',      Icon: Star },
  { label: 'Yêu cầu thuê', href: '/hosting/reservations', active: '/hosting/reservations', Icon: CalendarCheck },
  { label: 'Hợp đồng',     href: '/hosting/contracts',    active: '/hosting/contracts',    Icon: FileText },
  { label: 'Dịch vụ',      href: '/hosting/services',     active: '/hosting/services',     Icon: Wrench },
];

function isActive(pathname: string, item: typeof NAV_ITEMS[0]) {
  if (item.href === '/hosting') return pathname === '/hosting';
  return pathname.startsWith(item.active);
}

export default function HostingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sidebarRef.current) return;
    // Subtle entrance for the whole sidebar (runs once on mount, no flash on route change)
    sidebarRef.current.animate(
      [
        { opacity: 0, transform: 'translateX(-8px)' },
        { opacity: 1, transform: 'translateX(0)' },
      ],
      { duration: 250, easing: 'ease-out', fill: 'forwards' },
    );
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push('/');
  };

  return (
    <div className="flex flex-col bg-white">
      <div className="self-stretch bg-white pb-[1px]">
        {/* Header */}
        <div
          className="self-stretch bg-cover bg-center py-[22px] px-20"
          style={{
            backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a96b7d52-ece8-4b43-b061-36e6dd821f51)',
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
                  aria-label="Mở menu tài khoản"
                  aria-expanded={menuOpen}
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
                          onClick={handleLogout}
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

        {/* Main content with sidebar */}
        <div className="flex items-start self-stretch">
          {/* Sidebar — fixed width, always visible */}
          <aside ref={sidebarRef} className="w-[223px] shrink-0 flex flex-col items-start bg-white border-r border-[#DDDDDD]">
            <div className="flex items-center py-[21px] pl-[15px] pr-[118px] gap-2 border-b border-solid border-b-[#DDDDDD] w-full">
              <span className="text-[#929292] text-[11px] font-bold uppercase tracking-widest">Quản lý</span>
            </div>
            <div className="flex flex-col items-start py-4 pl-[15px] pr-[70px] border-b border-solid border-b-[#DDDDDD]">
              <span className="text-[#929292] text-[13px] font-bold">QUẢN LÝ CHO THUÊ</span>
            </div>
            <nav className="flex flex-col items-start px-[7px] pt-3 gap-0.5 w-full">
              {NAV_ITEMS.map((item) => {
                const { label, href, Icon } = item;
                const active = isActive(pathname, item);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center py-2.5 rounded-lg w-full',
                      active ? 'bg-[#F7F7F7]' : '',
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 mx-3 shrink-0',
                        active ? 'text-[#222222]' : 'text-[#6A6A6A]',
                      )}
                    />
                    <span className={cn(
                      'text-[15px]',
                      active ? 'text-[#222222] font-bold' : 'text-[#6A6A6A]',
                    )}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content area */}
          <div className="flex flex-1 flex-col items-start bg-[#F6F8FB] p-8">
            <div className="max-w-[976px] w-full mx-auto">
              {children}
            </div>
          </div>
        </div>

        {/* Footer */}
        <PublicFooter />
      </div>
    </div>
  );
}
