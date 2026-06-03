'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Tổng quan', href: '/hosting', active: '/hosting' },
  { label: 'Tin đăng', href: '/hosting/listings', active: '/hosting/listings' },
  { label: 'Yêu cầu thuê', href: '/hosting/reservations', active: '/hosting/reservations' },
  { label: 'Hợp đồng', href: '/hosting/contracts', active: '/hosting/contracts' },
  { label: 'Dịch vụ', href: '/hosting/services', active: '/hosting/services' },
];

function isActive(pathname: string, item: typeof NAV_ITEMS[0]) {
  if (item.href === '/hosting') return pathname === '/hosting';
  return pathname.startsWith(item.active);
}

export default function HostingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <div className="flex flex-col bg-white">
      <div className="self-stretch bg-white pb-[1px]">
        {/* Header */}
        <div
          className="self-stretch bg-cover bg-center py-[22px] px-20"
          style={{
            backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a96b7d52-ece8-4b43-b061-36e6dd821f51)',
          }}
        >
          <div className="flex justify-between items-center self-stretch">
            <Link href="/">
              <img
                src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/967d7281-d8d4-4d5a-9c6f-a5aa9bd652cb"
                className="w-[182px] h-[26px] object-fill cursor-pointer"
              />
            </Link>
            <div className="flex shrink-0 items-center">
              <div className="flex flex-col shrink-0 items-center py-2 mr-1 rounded-[20px]">
                <span className="text-[#222222] text-sm font-bold">Quản lý cho thuê</span>
              </div>
              <div className="flex shrink-0 items-center py-[5px] px-[13px] mx-2 gap-[9px] rounded-[20px] border border-solid border-black">
                <img
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b5b3cd4d-f43c-48c2-83b2-c9748b667ce4"
                  className="w-4 h-3 rounded-[20px] object-fill"
                />
                <Link
                  href="/profile"
                  className="flex flex-col shrink-0 items-start bg-[#222222] text-left py-1.5 px-[11px] rounded-[26843500px] border-0"
                >
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() ?? 'N'}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main content with sidebar */}
        <div className="flex items-start self-stretch">
          {/* Sidebar */}
          <div className="flex flex-col shrink-0 items-center bg-white pb-[1px]">
            <Link
              href="/"
              className="flex items-center py-[21px] pl-4 pr-[117px] gap-2 border-b-[0.800000011920929px] border-solid border-b-[#DDDDDD] hover:opacity-80 transition-opacity"
            >
              <img
                src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5e74c0ee-f146-406a-8f00-27e4e04f80a7"
                className="w-4 h-4 object-fill"
              />
              <span className="text-[#222222] text-[15px] font-bold">Khám phá</span>
            </Link>
            <div className="flex flex-col items-start py-4 pl-4 pr-[81px] border-b-[0.800000011920929px] border-solid border-b-[#DDDDDD]">
              <span className="text-[#929292] text-[13px] font-bold">QUẢN LÝ CHO THUÊ</span>
            </div>
            <div className="flex flex-col items-center pt-3">
              <div className="flex flex-col items-start px-2 gap-0.5">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center py-2.5 rounded-lg w-full',
                      isActive(pathname, item) ? 'bg-[#F6F8FB]' : ''
                    )}
                  >
                    <img
                      src={
                        item.href === '/hosting' ? 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9302bd31-9df7-4ad9-ac85-c7362a7c1429' :
                        item.href === '/hosting/listings' ? 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/fd20a51c-09ce-46ab-867e-eaace5405f4d' :
                        item.href === '/hosting/reservations' ? 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/e6bccfb9-fe5b-46fa-851f-bbce964ac950' :
                        item.href === '/hosting/contracts' ? 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/568fb559-5f11-48b0-8430-c4aac2f043e6' :
                        'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/116d5d89-5e4f-400e-a1d0-6854978476b7'
                      }
                      className="w-4 h-4 mx-3 rounded-lg object-fill"
                    />
                    <span className={cn(
                      'text-[15px]',
                      isActive(pathname, item) ? 'font-bold text-[#222222]' : 'text-[#6A6A6A]'
                    )}>
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex flex-1 flex-col items-start bg-[#F6F8FB] p-8">
            <div className="max-w-[976px] w-full mx-auto">
              {children}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col self-stretch bg-[#FFF546] py-10 px-20 gap-8 border-t-[0.800000011920929px] border-solid border-t-[#FFF546]">
          <div className="flex items-center self-stretch gap-8">
            <div className="flex flex-1 flex-col items-start pb-[90px] gap-3">
              <img
                src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/64095eea-7684-418f-9cb3-74965741f6cc"
                className="w-[182px] h-[25px] object-fill"
              />
              <div className="flex flex-col items-start self-stretch">
                <span className="text-black text-sm">
                  Nền tảng thuê nhà thông minh cho thị trường Việt Nam.
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-[11px]">
              <div className="flex flex-col items-start self-stretch">
                <span className="text-black text-sm font-bold">Hỗ trợ</span>
              </div>
              <div className="flex flex-col self-stretch gap-2">
                <div className="flex flex-col items-start self-stretch pt-[3px]">
                  <span className="text-[#6A6A6A] text-sm">Trung tâm trợ giúp</span>
                </div>
                <div className="flex flex-col items-start self-stretch pt-[3px]">
                  <span className="text-[#6A6A6A] text-sm">Liên hệ</span>
                </div>
                <div className="flex flex-col items-start self-stretch pt-[3px]">
                  <span className="text-[#6A6A6A] text-sm">Chính sách bảo mật</span>
                </div>
                <div className="flex flex-col items-start self-stretch pt-[3px]">
                  <span className="text-[#6A6A6A] text-sm">Điều khoản sử dụng</span>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-[11px]">
              <div className="flex flex-col items-start self-stretch">
                <span className="text-black text-sm font-bold">Dành cho chủ nhà</span>
              </div>
              <div className="flex flex-col self-stretch gap-2">
                <div className="flex flex-col items-start self-stretch pt-[3px]">
                  <span className="text-[#6A6A6A] text-sm">Đăng tin cho thuê</span>
                </div>
                <div className="flex flex-col items-start self-stretch pt-[3px]">
                  <span className="text-[#6A6A6A] text-sm">Quản lý đặt phòng</span>
                </div>
                <div className="flex flex-col items-start self-stretch pt-[3px]">
                  <span className="text-[#6A6A6A] text-sm">Hợp đồng điện tử</span>
                </div>
                <div className="flex flex-col items-start self-stretch pt-[3px]">
                  <span className="text-[#6A6A6A] text-sm">Gói dịch vụ</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-start self-stretch pt-[25px] border-t-[0.800000011920929px] border-solid border-t-[#6C6C6C]">
            <span className="text-[#6C6C6C] text-xs">
              © 2026 Smart Rental. Nền tảng thuê nhà thông minh.
            </span>
            <div className="w-[202px] h-[15px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
