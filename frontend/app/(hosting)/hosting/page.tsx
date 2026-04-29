'use client';

import Link from 'next/link';
import { Building2, ClipboardList, FileText, CreditCard, Plus, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const STATS = [
  { label: 'Tin đăng', value: '0', sub: 'đang hoạt động', icon: Building2, color: 'text-[#ff385c]', bg: 'bg-[#fff0f3]' },
  { label: 'Yêu cầu mới', value: '0', sub: 'chờ xác nhận', icon: ClipboardList, color: 'text-[#2563eb]', bg: 'bg-[#eff6ff]' },
  { label: 'Hợp đồng', value: '0', sub: 'đang hiệu lực', icon: FileText, color: 'text-[#16a34a]', bg: 'bg-[#f0fdf4]' },
  { label: 'Doanh thu', value: '0₫', sub: 'tháng này', icon: CreditCard, color: 'text-[#d97706]', bg: 'bg-[#fffbeb]' },
];

export default function HostingPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#222222]">
            Chào, {user?.name?.split(' ').at(-1)}!
          </h1>
          <p className="text-sm text-[#6a6a6a] mt-1">Đây là tổng quan hoạt động cho thuê của bạn.</p>
        </div>
        <Link
          href="/hosting/listings/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-[8px] transition-all active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Đăng tin
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-[14px] border border-[#dddddd] p-5">
            <div className={`w-10 h-10 rounded-[10px] ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-[#222222]">{value}</p>
            <p className="text-xs font-medium text-[#6a6a6a] mt-0.5">{label}</p>
            <p className="text-xs text-[#929292]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Đăng tin mới', desc: 'Thêm phòng trọ, căn hộ vào danh sách', href: '/hosting/listings/new', icon: Plus },
          { label: 'Xem yêu cầu thuê', desc: 'Xử lý booking requests từ người thuê', href: '/hosting/reservations', icon: ClipboardList },
        ].map(({ label, desc, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-[14px] border border-[#dddddd] p-5 hover:border-[#ff385c] hover:shadow-[0_2px_12px_rgba(255,56,92,0.08)] transition-all group"
          >
            <div className="w-10 h-10 rounded-[10px] bg-[#f7f7f7] flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[#6a6a6a] group-hover:text-[#ff385c] transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#222222]">{label}</p>
              <p className="text-xs text-[#6a6a6a] mt-0.5">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#929292] group-hover:text-[#ff385c] transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Empty listings */}
      <div className="bg-white rounded-[14px] border border-[#dddddd] p-10 text-center">
        <Building2 className="w-10 h-10 text-[#dddddd] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#222222]">Chưa có tin đăng nào</p>
        <p className="text-xs text-[#6a6a6a] mt-1 mb-5">
          Đăng tin để tiếp cận hàng nghìn người thuê trên SmartRental.
        </p>
        <Link
          href="/hosting/listings/new"
          className="inline-block px-5 py-2.5 text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-[8px] transition-all active:scale-95"
        >
          Đăng tin ngay
        </Link>
      </div>
    </div>
  );
}
