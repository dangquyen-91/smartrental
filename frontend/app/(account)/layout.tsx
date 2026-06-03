'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Heart, CalendarCheck, FileText, Users, Wrench, Compass, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Yêu thích',          href: '/wishlist',  Icon: Heart },
  { label: 'Đơn thuê',           href: '/trips',     Icon: CalendarCheck },
  { label: 'Hợp đồng',           href: '/contracts', Icon: FileText },
  { label: 'Tìm bạn cùng phòng', href: '/roommate',  Icon: Users },
  { label: 'Dịch vụ',            href: '/services',  Icon: Wrench },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, hasHydrated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.replace('/login');
  }, [hasHydrated, isAuthenticated, router]);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#2683EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white min-h-screen">
      {/* ── Header ── */}
      <div
        className="bg-cover bg-center py-[22px] px-20"
        style={{
          backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/eb609fa3-9a4b-4bf7-8291-56c045573ba8)',
        }}
      >
        <div className="flex justify-between items-center self-stretch">
          <Link href="/">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/cc012ec2-2e37-440b-a5a8-14c2ae1bf1b0"
              alt="SmartRental"
              className="w-[182px] h-[26px] object-fill cursor-pointer"
            />
          </Link>

          <div className="flex shrink-0 items-center">
            {/* Avatar dropdown */}
            <div className="relative" ref={menuRef}>
              <div className="flex shrink-0 items-center py-[5px] px-[13px] mx-2 gap-[9px] rounded-[20px] border border-solid border-black">
                <img
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/66c8ca5a-7553-49d9-be3c-ab10680e0f66"
                  className="w-4 h-3 rounded-[20px] object-fill"
                  alt=""
                />
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex flex-col shrink-0 items-center bg-[#222222] text-left py-1.5 px-[11px] rounded-[26843500px] border-0"
                >
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() ?? 'N'}
                  </span>
                </button>
              </div>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#DDDDDD] rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#DDDDDD]">
                    <p className="text-sm font-semibold text-[#222222] truncate">{user?.name}</p>
                    <p className="text-xs text-[#6A6A6A] truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setMenuOpen(false); logout(); router.push('/'); }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-[#c13515] hover:bg-red-50 transition-colors gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1 self-stretch">
        {/* Sidebar */}
        <aside className="w-[223px] shrink-0 flex flex-col items-start bg-white border-r border-[#DDDDDD]">
          {/* Explore */}
          <div className="flex items-center py-[21px] pl-[15px] pr-[118px] gap-2 border-b border-solid border-b-[#DDDDDD]">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/0d8421f1-fd5e-40b4-8d7c-757a4e29614d"
              className="w-4 h-4 object-fill"
              alt=""
            />
            <span className="text-[#222222] text-[15px] font-bold">Khám phá</span>
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
      <footer className="flex flex-col self-stretch bg-[#FFF546] py-10 px-20 gap-8 border-t border-solid border-t-[#FFF546]">
        <div className="flex items-center self-stretch gap-8">
          <div className="flex flex-1 flex-col items-start pb-[90px] gap-3">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/22dc7a32-fc83-4861-94b5-8fe718f89037"
              alt="SmartRental"
              className="w-[182px] h-[25px] object-fill"
            />
            <span className="text-black text-sm">Nền tảng thuê nhà thông minh cho thị trường Việt Nam.</span>
          </div>

          <div className="flex flex-1 flex-col gap-[11px]">
            <span className="text-black text-sm font-bold">Hỗ trợ</span>
            <div className="flex flex-col gap-2">
              <span className="text-[#6A6A6A] text-sm">Trung tâm trợ giúp</span>
              <span className="text-[#6A6A6A] text-sm">Liên hệ</span>
              <span className="text-[#6A6A6A] text-sm">Chính sách bảo mật</span>
              <span className="text-[#6A6A6A] text-sm">Điều khoản sử dụng</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-[11px]">
            <span className="text-black text-sm font-bold">Dành cho chủ nhà</span>
            <div className="flex flex-col gap-2">
              <span className="text-[#6A6A6A] text-sm">Đăng tin cho thuê</span>
              <span className="text-[#6A6A6A] text-sm">Quản lý đặt phòng</span>
              <span className="text-[#6A6A6A] text-sm">Hợp đồng điện tử</span>
              <span className="text-[#6A6A6A] text-sm">Gói dịch vụ</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-start self-stretch pt-[25px] border-t border-solid border-t-[#6C6C6C]">
          <span className="text-[#6C6C6C] text-xs">© 2026 Smart Rental. Nền tảng thuê nhà thông minh.</span>
        </div>
      </footer>
    </div>
  );
}
