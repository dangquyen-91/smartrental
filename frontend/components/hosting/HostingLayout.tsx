'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Star, LayoutDashboard, Home, CalendarCheck, FileText, Wrench } from 'lucide-react';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';
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
  const sidebarRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />

      {/* Main content with sidebar */}
      <div className="flex flex-1 self-stretch">
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
  );
}
