'use client';

import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const TABS = ['Chờ xác nhận', 'Đã xác nhận', 'Đang thuê', 'Đã từ chối'];

export default function HostingReservationsPage() {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#222222]">Yêu cầu thuê</h1>

      <div className="flex gap-6 border-b border-[#dddddd]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={cn(
              'pb-3 text-sm font-semibold transition-colors whitespace-nowrap',
              active === i
                ? 'text-[#222222] border-b-2 border-[#222222] -mb-px'
                : 'text-[#6a6a6a] hover:text-[#222222]',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center py-20 text-center bg-white rounded-[14px] border border-[#dddddd]">
        <ClipboardList className="w-12 h-12 text-[#dddddd] mb-4" />
        <h2 className="text-lg font-semibold text-[#222222] mb-2">Chưa có yêu cầu nào</h2>
        <p className="text-sm text-[#6a6a6a] max-w-sm">
          Khi người thuê gửi yêu cầu đặt phòng, chúng sẽ xuất hiện ở đây.
        </p>
      </div>
    </div>
  );
}
