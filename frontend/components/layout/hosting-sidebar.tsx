'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  FileText,
  Wrench,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Tổng quan',    href: '/hosting',              icon: LayoutDashboard, exact: true },
  { label: 'Tin đăng',     href: '/hosting/listings',     icon: Building2 },
  { label: 'Yêu cầu thuê', href: '/hosting/reservations', icon: ClipboardList },
  { label: 'Hợp đồng',     href: '/hosting/contracts',    icon: FileText },
  { label: 'Dịch vụ',      href: '/hosting/services',     icon: Wrench },
];

export default function HostingSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-[#dddddd] bg-white flex flex-col h-full">
      {/* Back to explore */}
      <div className="h-16 flex items-center px-4 border-b border-[#dddddd] shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[#222222] hover:text-[#2683EB] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
          Khám phá
        </Link>
      </div>

      {/* Brand */}
      <div className="px-4 py-4 border-b border-[#dddddd]">
        <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Quản lý cho thuê</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {NAV.map(({ label, href, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[#2683EB]/8 text-[#2683EB] font-semibold shadow-sm'
                      : 'text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#222222] hover:shadow-sm',
                  )}
                >
                  {/* Active indicator bar */}
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#2683EB] transition-all duration-300',
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40',
                    )}
                  />

                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-all duration-200',
                      isActive
                        ? 'text-[#2683EB] scale-110'
                        : 'text-[#929292] group-hover:text-[#2683EB] group-hover:scale-105',
                    )}
                  />

                  <span className="transition-all duration-200">
                    {label}
                  </span>

                  {/* Active dot */}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2683EB] animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
