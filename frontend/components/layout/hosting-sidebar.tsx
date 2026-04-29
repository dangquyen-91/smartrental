'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  FileText,
  Wrench,
  CreditCard,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Tổng quan', href: '/hosting', icon: LayoutDashboard, exact: true },
  { label: 'Tin đăng', href: '/hosting/listings', icon: Building2 },
  { label: 'Yêu cầu thuê', href: '/hosting/reservations', icon: ClipboardList },
  { label: 'Hợp đồng', href: '/hosting/contracts', icon: FileText },
  { label: 'Dịch vụ', href: '/hosting/services', icon: Wrench },
  { label: 'Gói đăng ký', href: '/hosting/plans', icon: CreditCard },
];

export default function HostingSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-[#dddddd] bg-white flex flex-col h-full">
      {/* Back to explore */}
      <div className="h-16 flex items-center px-4 border-b border-[#dddddd] flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[#222222] hover:text-[#ff385c] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
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
  );
}
