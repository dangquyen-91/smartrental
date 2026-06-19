'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Heart,
  CalendarDays,
  FileText,
  Users,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const NAV = [
  { label: 'Yêu thích',             href: '/wishlist',      icon: Heart },
  { label: 'Đơn thuê',             href: '/trips',        icon: CalendarDays },
  { label: 'Hợp đồng',             href: '/contracts',     icon: FileText },
  { label: 'Tìm bạn cùng phòng',  href: '/roommate',     icon: Users },
  { label: 'Dịch vụ',              href: '/services',     icon: Wrench },
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-56 shrink-0 border-r border-[#dddddd] bg-white flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[#dddddd] shrink-0">
        <Link href="/">
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/34538423-5348-42bb-bb85-fa3cb65dcafe"
            alt="SmartRental"
            className="h-[26px] w-auto object-contain cursor-pointer"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="px-4 mb-3 text-xs font-semibold text-[#929292] uppercase tracking-wider">
          Quản lý tài khoản
        </p>
        <ul className="space-y-0.5 px-2">
          {NAV.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
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

                  <span className="transition-all duration-200">{label}</span>

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

      {/* User info at bottom */}
      {user && (
        <div className="px-4 py-4 border-t border-[#dddddd] shrink-0">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#f7f7f7] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#222222] text-white flex items-center justify-center text-sm font-bold shrink-0">
              {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#222222] truncate">{user.name}</p>
              <p className="text-xs text-[#929292] truncate">{user.email}</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
