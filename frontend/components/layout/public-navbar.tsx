'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

function UserMenu({
  user,
  onClose,
}: {
  user: { name?: string | null; email?: string | null; avatar?: string | null; role?: string } | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    onClose();
    logout();
    router.push('/');
  };

  return (
    <div className="py-1">
      <div className="px-4 py-3 border-b border-[#ccc7ac]">
        <p className="text-sm font-semibold text-[#191c1d] truncate">{user?.name}</p>
        <p className="text-xs text-[#4a4733] truncate mt-0.5">{user?.email}</p>
      </div>

      <div className="py-1">
        <Link
          href="/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#191c1d] hover:bg-[#f3f4f5] transition-colors"
        >
          <User className="w-4 h-4" />
          Tài khoản của tôi
        </Link>

        {user?.role === 'admin' && (
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#676000] hover:bg-[#f3f4f5] transition-colors font-semibold"
          >
            <LayoutDashboard className="w-4 h-4" />
            Trang quản trị
          </Link>
        )}

        {user?.role === 'landlord' && (
          <Link
            href="/hosting"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#191c1d] hover:bg-[#f3f4f5] transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Quản lý chỗ ở
          </Link>
        )}

        <Link
          href="/settings"
          onClick={onClose}
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
  );
}

interface PublicNavbarProps {
  activeLink?: 'search' | 'about' | 'guide' | 'news';
}

export function PublicNavbar({ activeLink }: PublicNavbarProps) {
  const { isAuthenticated, user } = useAuth();
  const navRef = useRef<HTMLElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 50) {
          navRef.current.classList.add('shadow-md');
        } else {
          navRef.current.classList.remove('shadow-md');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const linkCls = (isActive: boolean) =>
    cn(
      'text-sm font-semibold transition-all',
      isActive
        ? 'text-[#676000] border-b-2 border-[#676000] pb-1'
        : 'text-[#4a4733] hover:text-[#676000]',
    );

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 bg-[#f8f9fa]/80 backdrop-blur-md border-b border-[#ccc7ac]/30"
    >
      <div
        className="mx-auto flex justify-between items-center px-5 md:px-10 h-20"
        style={{ maxWidth: '1280px' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo/SmartRental_02.png"
            alt="SmartRental"
            width={80}
            height={12}
            className="h-auto object-contain"
            priority
          />
        </Link>

        <div className="hidden md:flex gap-6 items-center">
          <Link href="/" className={linkCls(activeLink === 'search')}>
            Tìm kiếm
          </Link>
          <Link href="/about" className={linkCls(activeLink === 'about')}>
            Về chúng tôi
          </Link>
          <Link href="/guide" className={linkCls(activeLink === 'guide')}>
            Hướng dẫn
          </Link>
          <Link href="/news" className={linkCls(activeLink === 'news')}>
            Tin tức
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user?.role === 'landlord' && (
            <Link
              href="/hosting/listings/new"
              className="hidden md:block px-6 py-2 rounded-full text-sm font-semibold text-[#191c1d] border border-[#7b7861] hover:bg-[#f3f4f5] transition-all active:scale-95"
            >
              Đăng tin
            </Link>
          )}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-[#f3f4f5] transition-colors"
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
                    'w-4 h-4 text-[#4a4733] transition-transform',
                    dropdownOpen && 'rotate-180',
                  )}
                />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-xl shadow-lg border border-[#ccc7ac] z-50 overflow-hidden">
                    <UserMenu user={user} onClose={() => setDropdownOpen(false)} />
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2 rounded-full text-sm font-semibold bg-[#ffef3d] text-[#1f1c00] hover:shadow-lg transition-all active:scale-95"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-[#FFED00] text-black py-12 px-4 md:px-8">
      <div className="mx-auto" style={{ maxWidth: '1280px' }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 text-left">
          <div className="col-span-1 md:col-span-6 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo/SmartRental_02.png"
                alt="SmartRental"
                width={80}
                height={15}
                className="h-auto object-contain"
              />
            </div>
            <p className="text-black/80 max-w-sm font-medium leading-relaxed">
              Nền tảng thuê nhà thông minh cho thị trường Việt Nam.
            </p>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Hỗ trợ</h4>
            <ul className="flex flex-col gap-3 font-medium text-black/80">
              <li><a href="#" className="hover:text-black hover:underline decoration-2 underline-offset-4 transition-all">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="hover:text-black hover:underline decoration-2 underline-offset-4 transition-all">Liên hệ</a></li>
              <li><a href="#" className="hover:text-black hover:underline decoration-2 underline-offset-4 transition-all">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-black hover:underline decoration-2 underline-offset-4 transition-all">Điều khoản sử dụng</a></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-3">
            <h4 className="font-bold uppercase tracking-wider mb-4 text-sm">Dành cho chủ nhà</h4>
            <ul className="flex flex-col gap-3 font-medium text-black/80">
              <li><a href="#" className="hover:text-black hover:underline decoration-2 underline-offset-4 transition-all">Đăng tin cho thuê</a></li>
              <li><a href="#" className="hover:text-black hover:underline decoration-2 underline-offset-4 transition-all">Quản lý đặt phòng</a></li>
              <li><a href="#" className="hover:text-black hover:underline decoration-2 underline-offset-4 transition-all">Hợp đồng điện tử</a></li>
              <li><a href="#" className="hover:text-black hover:underline decoration-2 underline-offset-4 transition-all">Gói dịch vụ</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-black/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium">
          <p className="text-black/80">
            © 2026 Smart Rental. Nền tảng thuê nhà thông minh.
          </p>

          <div className="flex items-center gap-6 text-black">
            <button aria-label="Language" className="hover:opacity-70 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </button>
            <button aria-label="Support" className="hover:opacity-70 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
