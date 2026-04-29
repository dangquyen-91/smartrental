'use client';

import Link from 'next/link';
import { Users, Building2, CreditCard, ArrowRight } from 'lucide-react';

const STATS = [
  { label: 'Người dùng', value: '0', sub: 'tổng tài khoản', icon: Users, color: 'text-[#ff385c]', bg: 'bg-[#fff0f3]', href: '/admin/users' },
  { label: 'Tin đăng', value: '0', sub: 'tổng property', icon: Building2, color: 'text-[#2563eb]', bg: 'bg-[#eff6ff]', href: '/admin/properties' },
  { label: 'Doanh thu', value: '0₫', sub: 'phí nền tảng', icon: CreditCard, color: 'text-[#16a34a]', bg: 'bg-[#f0fdf4]', href: '/admin/transactions' },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#222222]">Tổng quan hệ thống</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map(({ label, value, sub, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="bg-white rounded-[14px] border border-[#dddddd] p-5 hover:border-[#ff385c] transition-colors group">
            <div className={`w-10 h-10 rounded-[10px] ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-[#222222]">{value}</p>
            <p className="text-xs font-medium text-[#6a6a6a] mt-0.5">{label}</p>
            <p className="text-xs text-[#929292]">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Quản lý người dùng', desc: 'Kích hoạt / vô hiệu hoá tài khoản', href: '/admin/users', icon: Users },
          { label: 'Quản lý tin đăng', desc: 'Duyệt và kiểm soát property listings', href: '/admin/properties', icon: Building2 },
          { label: 'Lịch sử giao dịch', desc: 'Xem toàn bộ thanh toán PayOS', href: '/admin/transactions', icon: CreditCard },
        ].map(({ label, desc, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-[14px] border border-[#dddddd] p-5 hover:border-[#ff385c] hover:shadow-[0_2px_12px_rgba(255,56,92,0.08)] transition-all group"
          >
            <div className="w-10 h-10 rounded-[10px] bg-[#f7f7f7] flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[#929292] group-hover:text-[#ff385c] transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#222222]">{label}</p>
              <p className="text-xs text-[#6a6a6a] mt-0.5">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#929292] group-hover:text-[#ff385c] transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
