'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyProperties } from '@/hooks/use-properties';
import { useServiceCatalog, useCreateServiceOrder } from '@/hooks/use-services';
import type { Property, ServiceCatalogEntry, ServiceOrder } from '@/types';

// ─── constants ────────────────────────────────────────────────────────────────

const SERVICE_META: Record<ServiceOrder['type'], { emoji: string; label: string }> = {
  cleaning:     { emoji: '🧹', label: 'Dọn dẹp vệ sinh' },
  repair:       { emoji: '🔧', label: 'Sửa chữa' },
  wifi:         { emoji: '📶', label: 'Lắp đặt WiFi' },
  moving:       { emoji: '📦', label: 'Chuyển đồ' },
  painting:     { emoji: '🎨', label: 'Sơn nhà' },
  registration: { emoji: '📋', label: 'Đăng ký tạm trú' },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
}

function getMinScheduledAt() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

// ─── service type card ────────────────────────────────────────────────────────

function ServiceTypeCard({
  entry,
  selected,
  onClick,
}: {
  entry: ServiceCatalogEntry;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = SERVICE_META[entry.type];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-[12px] border text-center transition-all',
        selected
          ? 'border-[#222222] bg-[#f7f7f7] shadow-[0_0_0_2px_#222222]'
          : 'border-[#dddddd] hover:border-[#222222] hover:shadow-[rgba(0,0,0,0.06)_0_2px_8px]',
      )}
    >
      <span className="text-3xl leading-none">{meta.emoji}</span>
      <span className="text-xs font-semibold text-[#222222] leading-tight">
        {meta.label}
      </span>
      <span className="text-[11px] font-medium text-[#929292]">
        {formatVnd(entry.price)}/{entry.unit}
      </span>
    </button>
  );
}

// ─── catalog grid with URL param support ──────────────────────────────────────

function CatalogGrid({
  selectedType,
  onTypeChange,
}: {
  selectedType: string;
  onTypeChange: (t: string) => void;
}) {
  const { data: catalogData, isLoading } = useServiceCatalog();
  const catalog = Array.isArray(catalogData) ? catalogData : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[90px] bg-[#ebebeb] rounded-[12px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {catalog.map((entry) => (
        <ServiceTypeCard
          key={entry.type}
          entry={entry}
          selected={selectedType === entry.type}
          onClick={() => onTypeChange(entry.type)}
        />
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function HostingServiceRequestPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [type, setType]               = useState('');
  const [propertyId, setPropertyId]   = useState('');
  const [scheduledAt, setScheduledAt]  = useState('');
  const [note, setNote]               = useState('');

  const { data: catalogData }          = useServiceCatalog();
  const { data: propertiesData, isLoading: isPropertiesLoading } = useMyProperties();
  const { mutate: createOrder, isPending } = useCreateServiceOrder();

  const catalog      = Array.isArray(catalogData) ? catalogData : [];
  const properties   = propertiesData?.data ?? [];
  const selectedEntry = catalog.find((c) => c.type === type);
  const minDate      = getMinScheduledAt();
  const canSubmit    = !!type && !!propertyId && !!scheduledAt && !isPending && properties.length > 0;

  useEffect(() => {
    const urlType = params.get('type');
    if (urlType && catalog.some((c) => c.type === urlType)) {
      setType(urlType);
    }
  }, [params, catalog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    createOrder(
      {
        property: propertyId,
        type: type as ServiceOrder['type'],
        scheduledAt,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Yêu cầu dịch vụ đã được tạo thành công!');
          router.push('/hosting/services');
        },
        onError: () => {
          toast.error('Không thể tạo yêu cầu dịch vụ.');
        },
      },
    );
  };

  return (
    <div className="flex flex-col self-stretch gap-[25px]">
      {/* Header */}
      <div className="flex items-center gap-[21px]">
        <Link
          href="/hosting/services"
          className="flex items-center justify-center size-10 rounded-lg hover:bg-[#ebebeb] transition-colors shrink-0"
        >
          <ArrowLeft className="size-5 text-[#222222]" />
        </Link>
        <span className="text-[#222222] text-[25px] font-bold">Yêu cầu dịch vụ</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-[700px]">
        {/* Service type */}
        <div>
          <p className="text-sm font-semibold text-[#222222] mb-3">
            Loại dịch vụ <span className="text-[#c13515]">*</span>
          </p>
          <CatalogGrid selectedType={type} onTypeChange={setType} />
        </div>

        {/* Property */}
        <div>
          <label className="block text-sm font-semibold text-[#222222] mb-2">
            Căn phòng <span className="text-[#c13515]">*</span>
          </label>
          {isPropertiesLoading ? (
            <div className="h-11 bg-[#ebebeb] rounded-[8px] animate-pulse" />
          ) : properties.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-2.5">
              Bạn chưa có căn phòng nào. Hãy đăng tin trước để đặt dịch vụ.
            </p>
          ) : (
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full h-11 px-3 border border-[#dddddd] rounded-[8px] text-sm text-[#222222] bg-white focus:outline-none focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/20"
            >
              <option value="">Chọn căn phòng...</option>
              {properties.map((prop: Property) => (
                <option key={prop.id} value={prop.id}>
                  {prop.title}
                  {prop.address
                    ? ` — ${[prop.address.district, prop.address.city].filter(Boolean).join(', ')}`
                    : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Scheduled date */}
        <div>
          <label className="block text-sm font-semibold text-[#222222] mb-2">
            Thời gian thực hiện <span className="text-[#c13515]">*</span>
          </label>
          <input
            type="datetime-local"
            required
            min={minDate}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full h-11 px-3 border border-[#dddddd] rounded-[8px] text-sm text-[#222222] bg-white focus:outline-none focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/20"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-semibold text-[#222222] mb-2">Ghi chú</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mô tả chi tiết yêu cầu của bạn..."
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2.5 border border-[#dddddd] rounded-[8px] text-sm text-[#222222] placeholder:text-[#929292] resize-none focus:outline-none focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/20"
          />
          <p className="text-xs text-[#929292] text-right mt-1">{note.length}/500</p>
        </div>

        {/* Price summary */}
        {selectedEntry && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#f7f7f7] rounded-[10px]">
            <span className="text-sm text-[#6a6a6a]">Tạm tính</span>
            <span className="text-[15px] font-semibold text-[#222222]">
              {formatVnd(selectedEntry.price)}
              <span className="text-sm font-normal text-[#6a6a6a]">
                /{selectedEntry.unit}
              </span>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/hosting/services"
            className="flex-1 py-3 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-[8px] hover:bg-[#f7f7f7] transition-colors text-center"
          >
            Huỷ bỏ
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 py-3 text-sm font-semibold text-[#1f1c00] bg-[#ffef3d] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-[8px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? 'Đang tạo...' : 'Xác nhận'}
          </button>
        </div>
      </form>
    </div>
  );
}
