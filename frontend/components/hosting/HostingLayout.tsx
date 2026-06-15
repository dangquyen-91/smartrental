'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LogOut, User, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { PublicFooter } from '@/components/layout/public-navbar';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Tổng quan', href: '/hosting', active: '/hosting' },
  { label: 'Tin đăng', href: '/hosting/listings', active: '/hosting/listings' },
  { label: 'Đánh giá', href: '/hosting/reviews', active: '/hosting/reviews' },
  { label: 'Yêu cầu thuê', href: '/hosting/reservations', active: '/hosting/reservations' },
  { label: 'Hợp đồng', href: '/hosting/contracts', active: '/hosting/contracts' },
  { label: 'Dịch vụ', href: '/hosting/services', active: '/hosting/services' },
];

function isActive(pathname: string, item: typeof NAV_ITEMS[0]) {
  if (item.href === '/hosting') return pathname === '/hosting';
  return pathname.startsWith(item.active);
}

export default function HostingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
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
                src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/967d7281-d8d4-4d5a-9c6f-a5aa9bd652cb"
                className="w-[182px] h-[26px] object-fill cursor-pointer"
              />
            </Link>
            <div className="flex shrink-0 items-center">
              <div className="flex flex-col shrink-0 items-center py-2 mr-1 rounded-[20px]">
                <span className="text-[#222222] text-sm font-bold">Quản lý cho thuê</span>
              </div>

              {/* Avatar dropdown */}
              <div className="relative" ref={menuRef}>
                <div className="flex shrink-0 items-center py-[5px] px-[13px] mx-2 gap-[9px] rounded-[20px] border border-solid border-black">
                  <img
                    src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b5b3cd4d-f43c-48c2-83b2-c9748b667ce4"
                    className="w-4 h-3 rounded-[20px] object-fill"
                    alt=""
                  />
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="Mở menu tài khoản"
                    aria-expanded={menuOpen}
                    className="flex flex-col shrink-0 items-center bg-[#222222] text-left py-1.5 px-[11px] rounded-[26843500px] border-0 hover:opacity-90 transition-opacity"
                  >
                    <span className="text-white text-sm font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() ?? 'N'}
                    </span>
                  </button>
                </div>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-[#DDDDDD] rounded-xl shadow-lg py-2 z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-[#DDDDDD]">
                      <p className="text-sm font-semibold text-[#222222] truncate">{user?.name}</p>
                      <p className="text-xs text-[#6A6A6A] truncate">{user?.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#222222] hover:bg-[#f7f7f7] transition-colors"
                      >
                        <User className="w-4 h-4 text-[#6A6A6A]" />
                        Hồ sơ cá nhân
                      </Link>
                    </div>

                    <div className="border-t border-[#DDDDDD] py-1.5">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#c13515] hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content with sidebar */}
        <div className="flex items-start self-stretch">
          {/* Sidebar — fixed width, always visible */}
          <div ref={sidebarRef} className="flex flex-col shrink-0 items-start bg-white pb-[1px]">
            <Link
              href="/"
              className="flex items-center py-[21px] pl-4 pr-[117px] gap-2 border-b-[0.800000011920929px] border-solid border-b-[#DDDDDD] hover:opacity-80 transition-opacity"
            />
            <div className="flex flex-col items-start py-4 pl-4 pr-[81px] border-b-[0.800000011920929px] border-solid border-b-[#DDDDDD]">
              <span className="text-[#929292] text-[13px] font-bold">QUẢN LÝ CHO THUÊ</span>
            </div>
            <div className="flex flex-col items-center pt-3">
              <div className="flex flex-col items-start px-2 gap-0.5">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group relative flex items-center py-2.5 rounded-lg w-full transition-all duration-200',
                        active
                          ? 'bg-[#2683EB]/8 font-semibold'
                          : 'hover:bg-[#f7f7f7] hover:shadow-sm',
                      )}
                    >
                      {/* Active indicator bar */}
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#2683EB] transition-all duration-300',
                          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
                        )}
                      />

                      <img
                        src={
                          item.href === '/hosting' ? 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9302bd31-9df7-4ad9-ac85-c7362a7c1429' :
                          item.href === '/hosting/listings' ? 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/fd20a51c-09ce-46ab-867e-eaace5405f4d' :
                          item.href === '/hosting/reservations' ? 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/e6bccfb9-fe5b-46fa-851f-bbce964ac950' :
                          item.href === '/hosting/contracts' ? 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/568fb559-5f11-48b0-8430-c4aac2f043e6' :
                          'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/116d5d89-5e4f-400e-a1d0-6854978476b7'
                        }
                        className={cn(
                          'w-4 h-4 mx-3 rounded-lg object-fill transition-all duration-200',
                          active
                            ? 'text-[#2683EB] scale-110'
                            : 'text-[#929292] group-hover:text-[#2683EB] group-hover:scale-105',
                          item.href === '/hosting/reviews' ? 'hidden' : '',
                        )}
                      />
                      {item.href === '/hosting/reviews' && (
                        <Star
                          className={cn(
                            'w-4 h-4 mx-3 transition-all duration-200',
                            active
                              ? 'fill-[#2683EB] text-[#2683EB] scale-110'
                              : 'text-[#929292] group-hover:text-[#2683EB] group-hover:scale-105',
                          )}
                        />
                      )}
                      <span className={cn(
                        'text-[15px] transition-all duration-200',
                        active ? 'font-bold text-[#2683EB]' : 'text-[#6A6A6A] group-hover:text-[#222222]'
                      )}>
                        {item.label}
                      </span>

                      {/* Active dot */}
                      {active && (
                        <span className="ml-auto mr-4 w-1.5 h-1.5 rounded-full bg-[#2683EB] animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

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
