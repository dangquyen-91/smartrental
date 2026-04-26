'use client';

import Link from 'next/link';
import { Wrench, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const STATS = [
  { label: 'Chờ xử lý', value: '0', icon: Clock, color: 'text-[#d97706]', bg: 'bg-[#fffbeb]' },
  { label: 'Đang thực hiện', value: '0', icon: Wrench, color: 'text-[#2563eb]', bg: 'bg-[#eff6ff]' },
  { label: 'Hoàn thành tháng này', value: '0', icon: CheckCircle2, color: 'text-[#16a34a]', bg: 'bg-[#f0fdf4]' },
];

export default function ProviderPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">Xin chào, {user?.name?.split(' ').at(-1)}!</h1>
        <p className="text-sm text-[#6a6a6a] mt-1">Quản lý các dịch vụ được giao cho bạn.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-[14px] border border-[#dddddd] p-5">
            <div className={`w-10 h-10 rounded-[10px] ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-[#222222]">{value}</p>
            <p className="text-xs font-medium text-[#6a6a6a] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/provider/services"
        className="flex items-center gap-4 bg-white rounded-[14px] border border-[#dddddd] p-5 hover:border-[#ff385c] transition-all group"
      >
        <div className="w-10 h-10 rounded-[10px] bg-[#f7f7f7] flex items-center justify-center flex-shrink-0">
          <Wrench className="w-5 h-5 text-[#929292] group-hover:text-[#ff385c] transition-colors" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#222222]">Xem dịch vụ được giao</p>
          <p className="text-xs text-[#6a6a6a] mt-0.5">Cập nhật tiến độ và hoàn thành dịch vụ</p>
        </div>
        <ArrowRight className="w-4 h-4 text-[#929292] group-hover:text-[#ff385c] transition-colors" />
      </Link>
    </div>
  );
}
