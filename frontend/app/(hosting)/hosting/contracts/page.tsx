'use client';

import { FileText } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const TABS = ['Chờ ký', 'Đang hiệu lực', 'Đã kết thúc'];

export default function HostingContractsPage() {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#222222]">Hợp đồng</h1>

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
        <FileText className="w-12 h-12 text-[#dddddd] mb-4" />
        <h2 className="text-lg font-semibold text-[#222222] mb-2">Chưa có hợp đồng nào</h2>
        <p className="text-sm text-[#6a6a6a] max-w-sm">
          Hợp đồng điện tử được tạo tự động sau khi booking được xác nhận và thanh toán.
        </p>
      </div>
    </div>
  );
}
