'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown, Home, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth.store';
import { logoutApi } from '@/lib/api/auth.api';
import { cn } from '@/lib/utils';

interface AppNavbarProps {
  /** Slot giữa navbar — dùng cho search bar ở trang chủ */
  center?: React.ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
  tenant: 'Người thuê',
  landlord: 'Chủ nhà',
  admin: 'Quản trị viên',
  provider: 'Nhà cung cấp',
};

export default function AppNavbar({ center }: AppNavbarProps) {
  const { user, isAuthenticated, isLandlord, isAdmin, isProvider } = useAuth();
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logoutApi();
    } catch {
      // logout API lỗi vẫn clear local auth
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const hostHref = isLandlord ? '/hosting' : isAdmin ? '/admin' : isProvider ? '/provider' : null;
  const hostLabel = isLandlord
    ? 'Quản lý cho thuê'
    : isAdmin
    ? 'Trang quản trị'
    : isProvider
    ? 'Dịch vụ của tôi'
    : null;

  return (
    <header className="bg-white border-b border-[#dddddd] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-xl tracking-tight">
            <span className="text-[#222222]">Smart</span>
            <span className="text-[#ff385c]">Rental</span>
          </span>
        </Link>

        {/* Center slot */}
        {center && <div className="flex-1 flex justify-center">{center}</div>}
        {!center && <div className="flex-1" />}

        {/* Right section */}
        <div className="flex items-center gap-1 shrink-0">
          {isAuthenticated && hostHref && (
            <Link
              href={hostHref}
              className="hidden md:block px-4 py-2 text-sm font-semibold text-[#222222] hover:bg-[#f7f7f7] rounded-[20px] transition-colors"
            >
              {hostLabel}
            </Link>
          )}

          {isAuthenticated && user ? (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-[20px] border border-[#dddddd] hover:shadow-md transition-shadow ml-2"
              >
                {/* Hamburger lines */}
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <rect y="0" width="16" height="1.5" rx="0.75" fill="#222222" />
                  <rect y="5.25" width="16" height="1.5" rx="0.75" fill="#222222" />
                  <rect y="10.5" width="16" height="1.5" rx="0.75" fill="#222222" />
                </svg>
                <div className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {open && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-[#dddddd] rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] py-2 z-50">
                  {/* Role badge */}
                  <div className="px-4 py-3 border-b border-[#dddddd]">
                    <p className="text-sm font-semibold text-[#222222] truncate">{user.name}</p>
                    <p className="text-xs text-[#6a6a6a] mt-0.5 truncate">{user.email}</p>
                  </div>

                  {/* Tenant links */}
                  <div className="py-1.5">
                    <MenuLink href="/trips" icon={Home} label="Đơn thuê của tôi" onClick={() => setOpen(false)} />
                    <MenuLink href="/contracts" icon={Settings} label="Hợp đồng" onClick={() => setOpen(false)} />
                    <MenuLink href="/profile" icon={User} label="Hồ sơ cá nhân" onClick={() => setOpen(false)} />
                  </div>

                  {/* Host/Admin link */}
                  {hostHref && (
                    <>
                      <div className="border-t border-[#dddddd] py-1.5">
                        <MenuLink
                          href={hostHref}
                          icon={Building2}
                          label={hostLabel!}
                          onClick={() => setOpen(false)}
                          bold
                        />
                      </div>
                    </>
                  )}

                  <div className="border-t border-[#dddddd] py-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#222222] hover:bg-[#f7f7f7] transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-[#6a6a6a]" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-[#222222] hover:bg-[#f7f7f7] rounded-[20px] transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#222222] hover:bg-[#3a3a3a] rounded-[20px] transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
  bold,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  bold?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#222222] hover:bg-[#f7f7f7] transition-colors"
    >
      <Icon className="w-4 h-4 text-[#6a6a6a]" />
      <span className={cn(bold && 'font-semibold')}>{label}</span>
    </Link>
  );
}
