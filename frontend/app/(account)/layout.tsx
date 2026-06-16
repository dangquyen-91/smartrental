'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Heart, CalendarCheck, FileText, Users, Wrench, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';
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
  const { isAuthenticated, hasHydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.replace('/login');
  }, [hasHydrated, isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#2683EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-screen">
      <PublicNavbar />

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
