'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Check } from 'lucide-react';
import { usePredictPrice } from '@/hooks/use-properties';
import { cn } from '@/lib/utils';

const FURNITURE_OPTIONS: { value: 'unknown' | 'basic' | 'full'; label: string }[] = [
  { value: 'unknown', label: 'Không / chưa rõ' },
  { value: 'basic', label: 'Cơ bản' },
  { value: 'full', label: 'Đầy đủ' },
];

const CONDITION_OPTIONS: { value: 'unknown' | 'newly_built'; label: string }[] = [
  { value: 'unknown', label: 'Bình thường' },
  { value: 'newly_built', label: 'Mới xây' },
];

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

interface PricePredictionPanelProps {
  area?: number;
  city?: string;
  district?: string;
  bedrooms?: number;
  amenities: string[];
  onApply: (price: number) => void;
}

export function PricePredictionPanel({ area, city, district, bedrooms, amenities, onApply }: PricePredictionPanelProps) {
  const [furniture, setFurniture] = useState<'unknown' | 'basic' | 'full'>('unknown');
  const [condition, setCondition] = useState<'unknown' | 'newly_built'>('unknown');
  const { mutate: predict, data, isPending, reset } = usePredictPrice();

  const canPredict = !!area && area > 0 && !!city && !!district;

  const handlePredict = () => {
    if (!canPredict) return;
    reset();
    predict({
      area: area!,
      bedrooms: Number.isFinite(bedrooms) ? bedrooms : undefined,
      furniture,
      condition,
      amenities,
      address: { city: city!, district: district! },
    });
  };

  const result = data?.data;

  return (
    <div className="rounded-[12px] border border-dashed border-[#2683EB]/40 bg-[#2683EB]/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[#2683EB]" />
        <span className="text-sm font-semibold text-ink-black">Gợi ý giá thuê AI</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ash-gray mb-1">Nội thất</label>
          <div className="flex flex-wrap gap-1.5">
            {FURNITURE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFurniture(opt.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-full border transition-all',
                  furniture === opt.value
                    ? 'bg-ink-black text-white border-ink-black'
                    : 'bg-white text-ash-gray border-hairline-gray hover:border-ash-gray',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-ash-gray mb-1">Tình trạng phòng</label>
          <div className="flex flex-wrap gap-1.5">
            {CONDITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCondition(opt.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-full border transition-all',
                  condition === opt.value
                    ? 'bg-ink-black text-white border-ink-black'
                    : 'bg-white text-ash-gray border-hairline-gray hover:border-ash-gray',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePredict}
        disabled={!canPredict || isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2683EB] hover:bg-[#2683EB]/90 disabled:opacity-40 rounded-lg transition-all"
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        {isPending ? 'Đang phân tích...' : 'Xem giá đề xuất'}
      </button>
      {!canPredict && (
        <p className="text-xs text-ash-gray">Điền diện tích, thành phố và quận/huyện để dùng gợi ý giá.</p>
      )}

      {result && (
        <div className="rounded-lg bg-white border border-hairline-gray p-3 space-y-2">
          <p className="text-lg font-bold text-[#1a2e4a]">{formatVnd(result.predictedPrice)}</p>
          <p className="text-xs text-ash-gray">
            Khoảng giá tham khảo: {formatVnd(result.priceRange.min)} – {formatVnd(result.priceRange.max)}
          </p>
          <p className="text-[11px] text-ash-gray">
            Mô hình: {result.model} · R² {result.modelMetrics.r2.toFixed(2)}
          </p>
          <button
            type="button"
            onClick={() => onApply(result.predictedPrice)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-black bg-[#ffef3d] hover:shadow-md rounded-lg transition-all active:scale-95"
          >
            <Check className="size-3.5" />
            Áp dụng giá này
          </button>
        </div>
      )}
    </div>
  );
}
