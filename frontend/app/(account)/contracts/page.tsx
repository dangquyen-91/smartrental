'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

const TABS = ['Đang hiệu lực', 'Chờ ký', 'Đã kết thúc'];

export default function ContractsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#222222]">Hợp đồng của tôi</h1>

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

      <div className="flex flex-col items-center py-20 text-center">
        <FileText className="w-12 h-12 text-[#dddddd] mb-4" />
        <h2 className="text-lg font-semibold text-[#222222] mb-2">Chưa có hợp đồng nào</h2>
        <p className="text-sm text-[#6a6a6a] mb-6 max-w-sm">
          Hợp đồng điện tử sẽ được tạo sau khi chủ nhà xác nhận đặt phòng của bạn.
        </p>
        <Link
          href="/trips"
          className="px-6 py-3 text-sm font-semibold text-[#222222] border border-[#dddddd] hover:bg-[#f7f7f7] rounded-[8px] transition-colors"
        >
          Xem chuyến đi
        </Link>
      </div>
    </div>
  );
}
