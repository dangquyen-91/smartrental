'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth.store';
import { logoutApi } from '@/lib/api/auth.api';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  tenant: 'Người thuê',
  landlord: 'Chủ nhà',
  admin: 'Quản trị viên',
  provider: 'Nhà cung cấp',
};

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, isAuthenticated } = useAuth();
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logoutApi();
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#dddddd] flex items-center px-4 gap-4 flex-shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#f7f7f7] transition-colors lg:hidden"
        aria-label="Mở menu"
      >
        <Menu className="w-5 h-5 text-[#222222]" />
      </button>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell — placeholder */}
        <button className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#f7f7f7] transition-colors">
          <Bell className="w-5 h-5 text-[#6a6a6a]" />
        </button>

        {/* Avatar dropdown */}
        {isAuthenticated && user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[20px] border border-[#dddddd] hover:bg-[#f7f7f7] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#ff385c] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-[#222222] hidden sm:block max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-[#6a6a6a] transition-transform hidden sm:block',
                  dropdownOpen && 'rotate-180',
                )}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#dddddd] rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] py-1 z-50">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-[#dddddd]">
                  <p className="text-sm font-semibold text-[#222222] truncate">{user.name}</p>
                  <p className="text-xs text-[#6a6a6a] truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-xs font-medium text-[#ff385c] bg-[#ff385c]/10 px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#222222] hover:bg-[#f7f7f7] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#6a6a6a]" />
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    href="/profile/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[#222222] hover:bg-[#f7f7f7] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#6a6a6a]" />
                    Cài đặt
                  </Link>
                </div>

                <div className="border-t border-[#dddddd] py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#e00b41] hover:bg-[#fff0f3] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
