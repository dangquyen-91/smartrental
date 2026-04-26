'use client';

import { Check } from 'lucide-react';

const PLANS = [
  {
    slug: 'free',
    name: 'Miễn phí',
    price: 0,
    features: ['3 tin đăng', 'Không có tin nổi bật', 'Không có hợp đồng điện tử'],
    cta: 'Gói hiện tại',
    current: true,
    highlighted: false,
  },
  {
    slug: 'basic',
    name: 'Basic',
    price: 2000,
    features: ['10 tin đăng', '2 tin nổi bật', 'Hợp đồng điện tử', 'Hỗ trợ ưu tiên'],
    cta: 'Nâng cấp Basic',
    current: false,
    highlighted: false,
  },
  {
    slug: 'premium',
    name: 'Premium',
    price: 499000,
    features: ['Không giới hạn tin đăng', '5 tin nổi bật', 'Hợp đồng điện tử', 'Hỗ trợ 24/7', 'Phân tích doanh thu'],
    cta: 'Nâng cấp Premium',
    current: false,
    highlighted: true,
  },
];

export default function HostingPlansPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">Gói đăng ký</h1>
        <p className="text-sm text-[#6a6a6a] mt-1">Chọn gói phù hợp để mở khoá thêm tính năng.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.slug}
            className={`relative bg-white rounded-[16px] border-2 p-6 flex flex-col ${
              plan.highlighted ? 'border-[#ff385c]' : 'border-[#dddddd]'
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#ff385c] text-white text-xs font-semibold rounded-full">
                Phổ biến nhất
              </span>
            )}

            <div className="mb-6">
              <p className="text-sm font-semibold text-[#6a6a6a]">{plan.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#222222]">
                  {plan.price === 0 ? 'Miễn phí' : `${plan.price.toLocaleString('vi-VN')}₫`}
                </span>
                {plan.price > 0 && <span className="text-sm text-[#6a6a6a]">/tháng</span>}
              </div>
            </div>

            <ul className="space-y-3 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#16a34a] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#222222]">{f}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={plan.current}
              className={`w-full py-3 text-sm font-semibold rounded-[8px] transition-all active:scale-95 ${
                plan.current
                  ? 'bg-[#f7f7f7] text-[#929292] cursor-default'
                  : plan.highlighted
                  ? 'bg-[#ff385c] hover:bg-[#e00b41] text-white'
                  : 'bg-[#222222] hover:bg-[#3a3a3a] text-white'
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
