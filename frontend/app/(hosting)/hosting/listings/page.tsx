'use client';

import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';

export default function HostingListingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#222222]">Tin đăng của tôi</h1>
        <Link
          href="/hosting/listings/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-[8px] transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Đăng tin mới
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['Tất cả', 'Đang cho thuê', 'Còn trống', 'Bảo trì'].map((t, i) => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium rounded-[20px] border transition-colors ${
              i === 0
                ? 'bg-[#222222] text-white border-[#222222]'
                : 'bg-white text-[#6a6a6a] border-[#dddddd] hover:border-[#222222] hover:text-[#222222]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center py-20 text-center bg-white rounded-[14px] border border-[#dddddd]">
        <Building2 className="w-12 h-12 text-[#dddddd] mb-4" />
        <h2 className="text-lg font-semibold text-[#222222] mb-2">Chưa có tin đăng nào</h2>
        <p className="text-sm text-[#6a6a6a] mb-6 max-w-sm">
          Bắt đầu đăng tin để tiếp cận hàng nghìn người thuê.
        </p>
        <Link
          href="/hosting/listings/new"
          className="px-6 py-3 text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-[8px] transition-all active:scale-95"
        >
          Đăng tin đầu tiên
        </Link>
      </div>
    </div>
  );
}
