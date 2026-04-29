'use client';

import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';

const TABS = ['Sắp tới', 'Đang thuê', 'Đã hoàn thành', 'Đã huỷ'];

export default function TripsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#222222]">Chuyến đi của tôi</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#dddddd]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${
              i === 0
                ? 'text-[#222222] border-b-2 border-[#222222] -mb-px'
                : 'text-[#6a6a6a] hover:text-[#222222]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center py-20 text-center">
        <CalendarCheck className="w-12 h-12 text-[#dddddd] mb-4" />
        <h2 className="text-lg font-semibold text-[#222222] mb-2">Chưa có chuyến đi nào</h2>
        <p className="text-sm text-[#6a6a6a] mb-6 max-w-sm">
          Khi bạn đặt phòng, chuyến đi sẽ xuất hiện ở đây.
        </p>
        <Link
          href="/properties"
          className="px-6 py-3 text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-[8px] transition-all active:scale-95"
        >
          Tìm phòng ngay
        </Link>
      </div>
    </div>
  );
}
