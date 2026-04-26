'use client';

import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = ['Đang xử lý', 'Hoàn thành', 'Đã huỷ'];

const SERVICE_TYPES = [
  { key: 'cleaning', label: 'Vệ sinh', emoji: '🧹' },
  { key: 'repair', label: 'Sửa chữa', emoji: '🔧' },
  { key: 'wifi', label: 'Wifi', emoji: '📶' },
  { key: 'moving', label: 'Chuyển nhà', emoji: '📦' },
  { key: 'painting', label: 'Sơn nhà', emoji: '🎨' },
  { key: 'registration', label: 'Đăng ký tạm trú', emoji: '📋' },
];

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#222222]">Dịch vụ của tôi</h1>
        <button className="px-5 py-2.5 text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-[8px] transition-all active:scale-95">
          + Yêu cầu dịch vụ
        </button>
      </div>

      {/* Service type grid */}
      <div>
        <p className="text-sm font-semibold text-[#6a6a6a] mb-3">Loại dịch vụ</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {SERVICE_TYPES.map((s) => (
            <button
              key={s.key}
              className="flex flex-col items-center gap-1.5 p-3 border border-[#dddddd] rounded-[12px] hover:border-[#222222] transition-colors group"
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-xs font-medium text-[#6a6a6a] group-hover:text-[#222222]">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#dddddd]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={cn(
              'pb-3 text-sm font-semibold transition-colors whitespace-nowrap',
              activeTab === i
                ? 'text-[#222222] border-b-2 border-[#222222] -mb-px'
                : 'text-[#6a6a6a] hover:text-[#222222]',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center py-16 text-center">
        <Wrench className="w-12 h-12 text-[#dddddd] mb-4" />
        <h2 className="text-lg font-semibold text-[#222222] mb-2">Chưa có yêu cầu dịch vụ</h2>
        <p className="text-sm text-[#6a6a6a] max-w-sm">
          Chọn loại dịch vụ ở trên để tạo yêu cầu mới.
        </p>
      </div>
    </div>
  );
}
