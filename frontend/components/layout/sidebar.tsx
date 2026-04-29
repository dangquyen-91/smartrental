'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  FileText,
  Wrench,
  Users,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const TENANT_NAV: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard/tenant', icon: LayoutDashboard },
  { label: 'Tìm phòng', href: '/properties', icon: Building2 },
  { label: 'Đặt phòng của tôi', href: '/dashboard/bookings', icon: CalendarCheck },
  { label: 'Hợp đồng', href: '/dashboard/contracts', icon: FileText },
  { label: 'Dịch vụ', href: '/dashboard/services', icon: Wrench },
  { label: 'Tìm bạn ghép', href: '/roommates', icon: Users },
];

const LANDLORD_NAV: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard/landlord', icon: LayoutDashboard },
  { label: 'Tin đăng của tôi', href: '/dashboard/properties', icon: Building2 },
  { label: 'Yêu cầu đặt phòng', href: '/dashboard/requests', icon: ClipboardList },
  { label: 'Hợp đồng', href: '/dashboard/contracts', icon: FileText },
  { label: 'Dịch vụ', href: '/dashboard/services', icon: Wrench },
  { label: 'Gói đăng ký', href: '/plans', icon: CreditCard },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Người dùng', href: '/dashboard/admin/users', icon: Users },
  { label: 'Tin đăng', href: '/dashboard/admin/properties', icon: Building2 },
  { label: 'Giao dịch', href: '/dashboard/admin/transactions', icon: CreditCard },
];

const PROVIDER_NAV: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard/provider', icon: LayoutDashboard },
  { label: 'Dịch vụ được giao', href: '/dashboard/services', icon: Wrench },
];

function getNavItems(role?: string): NavItem[] {
  switch (role) {
    case 'landlord': return LANDLORD_NAV;
    case 'admin': return ADMIN_NAV;
    case 'provider': return PROVIDER_NAV;
    default: return TENANT_NAV;
  }
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const navItems = getNavItems(user?.role);

  return (
    <aside
      className={cn(
        'flex flex-col bg-[#222222] text-white transition-all duration-200 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/10 flex-shrink-0">
        {!collapsed && (
          <Link href="/" className="font-bold text-lg tracking-tight">
            <span className="text-white">Smart</span>
            <span className="text-[#ff385c]">Rental</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0',
            collapsed ? 'mx-auto' : 'ml-auto',
          )}
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-[#929292]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[#929292]" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#ff385c] text-white'
                      : 'text-[#c1c1c1] hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center px-2',
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className={cn('px-4 py-4 border-t border-white/10', collapsed && 'px-2')}>
          {collapsed ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-[#ff385c] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ff385c] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-[#929292] truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
