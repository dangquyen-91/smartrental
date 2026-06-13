'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, ChevronDown, Search, Bell, HelpCircle,
  LayoutDashboard, Users, Building2, CreditCard, Wrench, Star,
  ChevronLeft, ChevronRight, Home, Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Trang chủ',    href: '/',                   icon: Home,             exact: true },
  { label: 'Tổng quan',   href: '/admin',              icon: LayoutDashboard,  exact: true },
  { label: 'Người dùng',  href: '/admin/users',        icon: Users },
  { label: 'Tin đăng',    href: '/admin/properties',    icon: Building2 },
  { label: 'Dịch vụ',     href: '/admin/services',      icon: Wrench },
  { label: 'Giao dịch',   href: '/admin/transactions',  icon: CreditCard },
  { label: 'Đánh giá',   href: '/admin/reviews',       icon: Star },
  { label: 'Cài đặt',     href: '/admin/settings',      icon: Settings },
];

const SIDEBAR_FULL_W = 224;
const SIDEBAR_COLLAPSED_W = 68;
const SIDEBAR_MOTION_W = SIDEBAR_FULL_W;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, user, hasHydrated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (!isAdmin) router.replace('/');
  }, [hasHydrated, isAuthenticated, isAdmin, router]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/admin/users?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
    setSearchOpen(false);
  };

  if (!hasHydrated || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f5f7]">
        <div className="w-8 h-8 border-2 border-[#ff385c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f4f5f7]">
      {/* ── Header ── */}
      <header className="h-[64px] shrink-0 bg-white border-b border-[#e2e5ea] flex items-center px-5 gap-4 z-30">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <Image
            src="/logo/SmartRental_02.png"
            alt="SmartRental"
            width={80}
            height={12}
            className="h-auto w-auto object-contain"
          />
        </Link>

        {/* Collapsible toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#f4f5f7] transition-colors text-[#6a6a6a] shrink-0"
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          <motion.div
            key={collapsed ? 'right' : 'left'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />}
          </motion.div>
        </button>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className={cn(
            'flex items-center h-9 rounded-[20px] border border-[#e2e5ea] bg-[#f4f5f7] transition-all duration-200 overflow-hidden',
            searchOpen ? 'w-72 px-4' : 'w-9',
          )}
        >
          <button
            type={searchOpen ? 'submit' : 'button'}
            onClick={() => !searchOpen && setSearchOpen(true)}
            className="flex items-center justify-center w-9 h-9 -ml-2 shrink-0"
          >
            <Search className="w-4 h-4 text-[#9ca3af]" />
          </button>
          {searchOpen && (
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm người dùng, tin đăng…"
              className="flex-1 bg-transparent text-sm text-[#222] placeholder:text-[#9ca3af] outline-none"
              onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
            />
          )}
        </form>

        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Home */}
          <Link
            href="/"
            className="flex items-center justify-center w-9 h-9 rounded-[20px] hover:bg-[#f4f5f7] transition-colors text-[#6a6a6a] shrink-0"
            title="Về trang chủ"
          >
            <Home className="w-4 h-4" />
          </Link>

          {/* Notifications */}
          <button
            className="flex items-center justify-center w-9 h-9 rounded-[20px] hover:bg-[#f4f5f7] transition-colors text-[#6a6a6a] relative shrink-0"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff385c] rounded-full" />
          </button>

          {/* Support */}
          <button
            className="flex items-center justify-center w-9 h-9 rounded-[20px] hover:bg-[#f4f5f7] transition-colors text-[#6a6a6a] shrink-0"
            title="Hỗ trợ"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-[#e2e5ea] mx-1" />

          {/* Admin badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full border border-[#e2e5ea] text-[#6a6a6a] text-xs font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff385c]" />
            Quản trị viên
          </div>

          {/* Avatar / User dropdown */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 h-9 rounded-[20px] px-2 hover:bg-[#f4f5f7] transition-colors ml-1"
            >
              <div className="w-7 h-7 rounded-full bg-[#222] text-white text-xs font-bold flex items-center justify-center">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
              </div>
              <ChevronDown className={cn('w-3.5 h-3.5 text-[#6a6a6a] transition-transform', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#e2e5ea] rounded-xl shadow-lg py-1 z-50">
                <div className="px-4 py-3 border-b border-[#e2e5ea]">
                  <p className="text-sm font-semibold text-[#222] truncate">{user?.name}</p>
                  <p className="text-xs text-[#9ca3af] truncate mt-0.5">{user?.email}</p>
                </div>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#6a6a6a] hover:bg-[#f4f5f7] transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Về trang chủ
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); logout(); router.push('/'); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#c13515] hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — dark theme, animated slide-in/out */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.aside
              key="sidebar-full"
              initial={{ x: -SIDEBAR_MOTION_W, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -SIDEBAR_MOTION_W, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="hidden lg:flex flex-col shrink-0 bg-[#1a1a2e] overflow-hidden"
              style={{ width: SIDEBAR_FULL_W }}
            >
              {/* Section label */}
              <div className="flex items-center h-11 px-4 border-b border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Quản trị hệ thống
                </span>
              </div>

              {/* Nav items */}
              <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
                {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
                  const isActive = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl transition-all duration-150 group relative',
                        'h-11 px-3',
                        isActive
                          ? 'bg-[#ff385c] text-white shadow-[0_2px_8px_rgba(255,56,92,0.3)]'
                          : 'text-white/50 hover:bg-white/10 hover:text-white/90',
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white rounded-r-full" />
                      )}
                      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-white/50 group-hover:text-white/90')} />
                      <span className={cn('text-sm font-medium', isActive ? 'font-bold' : '')}>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom hint */}
              <div className="px-4 py-3 border-t border-white/10">
                <p className="text-[10px] text-white/30 leading-relaxed">
                  SmartRental Admin<br />
                  <span className="text-white/20">v1.0.0</span>
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Collapsed sidebar — always visible but narrower */}
        <AnimatePresence initial={false}>
          {collapsed && (
            <motion.aside
              key="sidebar-collapsed"
              initial={{ x: -SIDEBAR_COLLAPSED_W, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -SIDEBAR_COLLAPSED_W, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="hidden lg:flex flex-col shrink-0 bg-[#1a1a2e] overflow-hidden"
              style={{ width: SIDEBAR_COLLAPSED_W }}
            >
              {/* Spacer for label row height */}
              <div className="h-11 border-b border-white/10" />

              {/* Nav items */}
              <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
                {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
                  const isActive = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      title={label}
                      className={cn(
                        'flex items-center justify-center rounded-xl transition-all duration-150 group relative',
                        'h-10',
                        isActive
                          ? 'bg-[#ff385c] text-white shadow-[0_2px_8px_rgba(255,56,92,0.3)]'
                          : 'text-white/50 hover:bg-white/10 hover:text-white/90',
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white rounded-r-full" />
                      )}
                      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-white/50 group-hover:text-white/90')} />
                      {/* Tooltip */}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-[#222] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {label}
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Admin Footer */}
      <footer className="shrink-0 bg-white border-t border-[#e2e5ea] px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs text-[#9ca3af]">
            © 2026 SmartRental — Hệ thống quản trị
          </p>
          <span className="w-1 h-1 rounded-full bg-[#e2e5ea]" />
          <p className="text-xs text-[#d1d5db]">
            v1.0.0
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xs text-[#9ca3af] hover:text-[#ff385c] transition-colors">Trang chủ</Link>
          <span className="text-[#e2e5ea]">·</span>
          <Link href="/guide" className="text-xs text-[#9ca3af] hover:text-[#ff385c] transition-colors">Hướng dẫn</Link>
          <span className="text-[#e2e5ea]">·</span>
          <Link href="/about" className="text-xs text-[#9ca3af] hover:text-[#ff385c] transition-colors">Về chúng tôi</Link>
        </div>
      </footer>
    </div>
  );
}
