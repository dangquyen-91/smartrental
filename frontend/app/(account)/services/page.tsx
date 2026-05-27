'use client';

import { useState, useMemo, useEffect, useRef, Suspense, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Wrench,
  CalendarDays,
  MapPin,
  User as UserIcon,
  CreditCard,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import {
  useServiceCatalog,
  useMyServiceOrders,
  useCreateServiceOrder,
  useCancelServiceOrder,
  useCreateServicePayment,
} from '@/hooks/use-services';
import { ServiceOrderCardSkeleton } from '@/components/ui/skeleton';
import type { ServiceOrder, ServiceCatalogEntry, Booking, Property, PaginatedResponse } from '@/types';

// ─── constants ────────────────────────────────────────────────────────────────

const SERVICE_META: Record<ServiceOrder['type'], { emoji: string; label: string }> = {
  cleaning:     { emoji: '🧹', label: 'Dọn dẹp vệ sinh' },
  repair:       { emoji: '🔧', label: 'Sửa chữa' },
  wifi:         { emoji: '📶', label: 'Lắp đặt WiFi' },
  moving:       { emoji: '📦', label: 'Chuyển đồ' },
  painting:     { emoji: '🎨', label: 'Sơn nhà' },
  registration: { emoji: '📋', label: 'Đăng ký tạm trú' },
};

const STATUS_CONFIG: Record<ServiceOrder['status'], { label: string; className: string }> = {
  pending:     { label: 'Chờ xác nhận',   className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed:   { label: 'Đã xác nhận',    className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  in_progress: { label: 'Đang thực hiện', className: 'bg-violet-50 text-violet-700 border border-violet-200' },
  done:        { label: 'Hoàn thành',     className: 'bg-stone-100 text-stone-500 border border-stone-200' },
  cancelled:   { label: 'Đã huỷ',         className: 'bg-red-50 text-[#c13515] border border-red-100' },
};

const PAYMENT_CONFIG: Record<ServiceOrder['paymentStatus'], { label: string; className: string }> = {
  unpaid:   { label: 'Chưa thanh toán', className: 'text-amber-600' },
  paid:     { label: 'Đã thanh toán',   className: 'text-emerald-600' },
  refunded: { label: 'Đã hoàn tiền',    className: 'text-blue-600' },
};

type TabId = 'processing' | 'done' | 'cancelled';

const TABS: { id: TabId; label: string; statuses: ServiceOrder['status'][] }[] = [
  { id: 'processing', label: 'Đang xử lý', statuses: ['pending', 'confirmed', 'in_progress'] },
  { id: 'done',       label: 'Hoàn thành',  statuses: ['done'] },
  { id: 'cancelled',  label: 'Đã huỷ',      statuses: ['cancelled'] },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getMinScheduledAt() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

// ─── catalog card ─────────────────────────────────────────────────────────────

function CatalogCard({ entry, onClick }: { entry: ServiceCatalogEntry; onClick: () => void }) {
  const meta = SERVICE_META[entry.type];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-3 border border-[#dddddd] rounded-[12px] hover:border-[#222222] hover:shadow-[rgba(0,0,0,0.06)_0_2px_8px] transition-all group text-center"
    >
      <span className="text-3xl leading-none">{meta.emoji}</span>
      <span className="text-xs font-semibold text-[#6a6a6a] group-hover:text-[#222222] leading-tight">
        {meta.label}
      </span>
      <span className="text-[11px] font-medium text-[#929292]">
        {formatVnd(entry.price)}/{entry.unit}
      </span>
    </button>
  );
}

// ─── service order card ───────────────────────────────────────────────────────

function ServiceOrderCard({
  order,
  onCancel,
  onPay,
  isPayingThis,
}: {
  order: ServiceOrder;
  onCancel: (id: string) => void;
  onPay: (id: string) => void;
  isPayingThis: boolean;
}) {
  const property   = typeof order.property === 'object' ? (order.property as Property) : null;
  const provider   = order.assignedProvider && typeof order.assignedProvider === 'object'
    ? (order.assignedProvider as { name: string })
    : null;
  const meta       = SERVICE_META[order.type];
  const statusCfg  = STATUS_CONFIG[order.status];
  const paymentCfg = PAYMENT_CONFIG[order.paymentStatus];
  const canPay     = order.paymentStatus === 'unpaid' && order.status === 'confirmed';
  const canCancel  = order.status === 'pending';

  return (
    <article className="flex flex-col sm:flex-row gap-4 border border-[#dddddd] rounded-[14px] p-4 sm:p-5 bg-white hover:shadow-[rgba(0,0,0,0.06)_0_2px_12px] transition-shadow">
      {/* Icon tile */}
      <div className="size-20 rounded-[10px] bg-[#f7f8f0] flex items-center justify-center shrink-0">
        <span className="text-3xl leading-none">{meta.emoji}</span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-[#222222] leading-snug">{meta.label}</h3>
            {property && (
              <p className="text-sm text-[#6a6a6a] flex items-center gap-1 mt-0.5 truncate">
                <Home className="size-3.5 shrink-0" />
                {property.title}
              </p>
            )}
          </div>
          <span className={cn('shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full', statusCfg.className)}>
            {statusCfg.label}
          </span>
        </div>

        {/* Details row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 text-sm text-[#3f3f3f]">
            <CalendarDays className="size-3.5 text-[#6a6a6a] shrink-0" />
            {formatDateTime(order.scheduledAt)}
          </span>
          {property?.address && (
            <span className="flex items-center gap-1 text-sm text-[#6a6a6a]">
              <MapPin className="size-3.5 shrink-0" />
              {[property.address.district, property.address.city].filter(Boolean).join(', ')}
            </span>
          )}
        </div>

        {/* Status chips */}
        {provider && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100 w-fit">
            <UserIcon className="size-3.5 shrink-0" />
            Nhân viên: {provider.name}
          </span>
        )}
        {order.status === 'done' && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 w-fit">
            <CheckCircle2 className="size-3.5 shrink-0" />
            Dịch vụ đã hoàn thành
          </span>
        )}
        {order.status === 'confirmed' && !provider && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 w-fit">
            <Clock className="size-3.5 shrink-0" />
            Chờ phân công nhân viên
          </span>
        )}
        {order.note && (
          <p className="text-xs text-[#6a6a6a] italic">Ghi chú: {order.note}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-[#dddddd]">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-sm font-semibold text-[#222222]">{formatVnd(order.price)}</span>
            <span className={cn('text-xs font-medium shrink-0', paymentCfg.className)}>
              · {paymentCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canPay && (
              <button
                onClick={() => onPay(order.id)}
                disabled={isPayingThis}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#933a12] hover:bg-[#7a2f0e] disabled:opacity-60 rounded-lg transition-all active:scale-95"
              >
                {isPayingThis ? <Loader2 className="size-3.5 animate-spin" /> : <CreditCard className="size-3.5" />}
                Thanh toán
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(order.id)}
                className="px-3 py-1.5 text-xs font-semibold text-[#6a6a6a] border border-[#dddddd] hover:border-[#222222] hover:text-[#222222] rounded-lg transition-colors"
              >
                Huỷ
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── create order modal ───────────────────────────────────────────────────────

function CreateOrderModal({
  initialType,
  catalog,
  onClose,
}: {
  initialType: ServiceOrder['type'] | null;
  catalog: ServiceCatalogEntry[];
  onClose: () => void;
}) {
  const [type, setType]               = useState<ServiceOrder['type'] | ''>(initialType ?? '');
  const [propertyId, setPropertyId]   = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [note, setNote]               = useState('');

  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', 'active-for-service'],
    queryFn: () =>
      api.get<PaginatedResponse<Booking>>('/bookings/my?status=active&limit=20').then((r) => r.data),
  });

  const activeBookings  = bookingsData?.data ?? [];
  const selectedCatalog = catalog.find((c) => c.type === type);
  const { mutate: createOrder, isPending } = useCreateServiceOrder();
  const minDate = getMinScheduledAt();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!type || !propertyId || !scheduledAt) return;
    createOrder(
      { property: propertyId, type: type as ServiceOrder['type'], scheduledAt, note: note.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] w-full max-w-md shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_8px_32px_0] max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="sticky top-0 bg-white rounded-t-[20px] flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#dddddd] z-10">
          <h2 className="text-[17px] font-semibold text-[#222222]">Yêu cầu dịch vụ</h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full bg-[#f7f8f0] hover:bg-[#dddddd] transition-colors"
          >
            <X className="size-4 text-[#222222]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Service type */}
          <div>
            <p className="text-sm font-semibold text-[#222222] mb-3">
              Loại dịch vụ <span className="text-[#c13515]">*</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {catalog.map((entry) => {
                const meta = SERVICE_META[entry.type];
                return (
                  <button
                    key={entry.type}
                    type="button"
                    onClick={() => setType(entry.type)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-[10px] border text-center transition-all',
                      type === entry.type
                        ? 'border-[#222222] bg-[#f7f8f0] shadow-[0_0_0_2px_#222222]'
                        : 'border-[#dddddd] hover:border-[#222222]',
                    )}
                  >
                    <span className="text-2xl leading-none">{meta.emoji}</span>
                    <span className="text-[11px] font-semibold text-[#222222] leading-tight">{meta.label}</span>
                    <span className="text-[10px] text-[#929292]">{formatVnd(entry.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Property */}
          <div>
            <label className="block text-sm font-semibold text-[#222222] mb-2">
              Căn phòng <span className="text-[#c13515]">*</span>
            </label>
            {isLoadingBookings ? (
              <div className="h-11 bg-[#f7f8f0] rounded-[8px] animate-pulse" />
            ) : activeBookings.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-2.5">
                Bạn chưa có phòng đang thuê. Cần có booking đang hoạt động để đặt dịch vụ.
              </p>
            ) : (
              <select
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full h-11 px-3 border border-[#dddddd] rounded-[8px] text-sm text-[#222222] bg-white focus:outline-none focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/20"
              >
                <option value="">Chọn căn phòng...</option>
                {activeBookings.map((b) => {
                  const prop = typeof b.property === 'object' ? (b.property as Property) : null;
                  return (
                    <option key={b.id} value={prop?.id ?? ''}>
                      {prop?.title ?? b.id}
                      {prop?.address ? ` — ${prop.address.district}, ${prop.address.city}` : ''}
                    </option>
                  );
                })}
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
          {selectedCatalog && (
            <div className="flex items-center justify-between px-4 py-3 bg-[#f7f8f0] rounded-[10px]">
              <span className="text-sm text-[#6a6a6a]">Tạm tính</span>
              <span className="text-[15px] font-semibold text-[#222222]">
                {formatVnd(selectedCatalog.price)}
                <span className="text-sm font-normal text-[#6a6a6a]">/{selectedCatalog.unit}</span>
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-[8px] hover:bg-[#f7f8f0] transition-colors"
            >
              Huỷ bỏ
            </button>
            <button
              type="submit"
              disabled={!type || !propertyId || !scheduledAt || isPending || activeBookings.length === 0}
              className="flex-1 py-3 text-sm font-semibold text-white bg-[#933a12] hover:bg-[#7a2f0e] disabled:opacity-50 disabled:cursor-not-allowed rounded-[8px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? 'Đang tạo...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── cancel modal ─────────────────────────────────────────────────────────────

function CancelModal({ onConfirm, onClose, isPending }: { onConfirm: () => void; onClose: () => void; isPending: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] p-6 w-full max-w-sm shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_8px_32px_0]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-[#f7f8f0] hover:bg-[#dddddd] transition-colors"
        >
          <X className="size-4 text-[#222222]" />
        </button>
        <div className="size-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wrench className="size-6 text-[#c13515]" />
        </div>
        <h3 className="text-[17px] font-semibold text-[#222222] text-center mb-2">Huỷ yêu cầu dịch vụ?</h3>
        <p className="text-sm text-[#6a6a6a] text-center mb-6">Yêu cầu này sẽ bị huỷ và không thể khôi phục.</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f8f0] transition-colors"
          >
            Giữ lại
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#c13515] hover:bg-[#b32505] disabled:opacity-60 rounded-lg transition-colors"
          >
            {isPending ? 'Đang huỷ...' : 'Xác nhận huỷ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

const EMPTY_CONFIG: Record<TabId, { message: string; sub: string }> = {
  processing: { message: 'Chưa có yêu cầu đang xử lý', sub: 'Chọn dịch vụ ở trên để tạo yêu cầu mới.' },
  done:       { message: 'Chưa có dịch vụ hoàn thành', sub: 'Lịch sử dịch vụ đã hoàn thành sẽ hiển thị ở đây.' },
  cancelled:  { message: 'Không có yêu cầu bị huỷ',    sub: 'Các yêu cầu bị huỷ sẽ xuất hiện ở đây.' },
};

function EmptyState({ tabId, onRequest }: { tabId: TabId; onRequest: () => void }) {
  const { message, sub } = EMPTY_CONFIG[tabId];
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="size-16 bg-[#f7f8f0] rounded-full flex items-center justify-center mb-4">
        <Wrench className="size-8 text-[#dddddd]" />
      </div>
      <h2 className="text-lg font-semibold text-[#222222] mb-2">{message}</h2>
      <p className="text-sm text-[#6a6a6a] mb-6 max-w-xs leading-relaxed">{sub}</p>
      {tabId === 'processing' && (
        <button
          onClick={onRequest}
          className="px-6 py-3 text-sm font-semibold text-white bg-[#933a12] hover:bg-[#7a2f0e] rounded-[8px] transition-all active:scale-95"
        >
          Yêu cầu dịch vụ
        </button>
      )}
    </div>
  );
}

// ─── payment toast ────────────────────────────────────────────────────────────

function PaymentToast() {
  const params  = useSearchParams();
  const router  = useRouter();
  const qc      = useQueryClient();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const result = params.get('payment');
    if (result === 'success') {
      handled.current = true;
      toast.success('Thanh toán thành công! Chờ nhân viên được phân công và thực hiện dịch vụ.');
      setTimeout(() => qc.invalidateQueries({ queryKey: ['services'] }), 1500);
      router.replace('/services');
    } else if (result === 'cancel') {
      handled.current = true;
      toast.info('Bạn đã huỷ thanh toán. Yêu cầu dịch vụ vẫn còn hiệu lực.');
      router.replace('/services');
    }
  }, [params, router, qc]);

  return null;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ServicesPage() {
  const [activeTab, setActiveTab]     = useState<TabId>('processing');
  const [cancelId, setCancelId]       = useState<string | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [initialType, setInitialType] = useState<ServiceOrder['type'] | null>(null);

  const { data: catalogData, isLoading: isCatalogLoading } = useServiceCatalog();
  const { data: ordersData,  isLoading: isOrdersLoading  } = useMyServiceOrders();
  const { mutate: cancelOrder, isPending: isCancelling }   = useCancelServiceOrder();
  const {
    mutate:    createPayment,
    isPending: isCreatingPayment,
    variables: payingOrderId,
  } = useCreateServicePayment();

  const catalog   = Array.isArray(catalogData) ? catalogData : [];
  const allOrders = ordersData?.data  ?? [];

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab)!;
    return allOrders.filter((o) => tab.statuses.includes(o.status));
  }, [allOrders, activeTab]);

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [
          tab.id,
          allOrders.filter((o) => tab.statuses.includes(o.status)).length,
        ]),
      ) as Record<TabId, number>,
    [allOrders],
  );

  const openModal = (type?: ServiceOrder['type']) => {
    setInitialType(type ?? null);
    setShowModal(true);
  };

  const handleCancel = () => {
    if (!cancelId) return;
    cancelOrder(cancelId, { onSuccess: () => setCancelId(null) });
  };

  return (
    <div className="space-y-6">
      <Suspense><PaymentToast /></Suspense>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#222222]">Dịch vụ của tôi</h1>
        <button
          onClick={() => openModal()}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-[#933a12] hover:bg-[#7a2f0e] rounded-[8px] transition-all active:scale-95"
        >
          + Yêu cầu dịch vụ
        </button>
      </div>

      {/* Catalog grid */}
      <div>
        <p className="text-sm font-semibold text-[#6a6a6a] mb-3">Chọn loại dịch vụ</p>
        {isCatalogLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse h-[90px] border border-[#dddddd] rounded-[12px] bg-[#f7f8f0]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {catalog.map((entry) => (
              <CatalogCard key={entry.type} entry={entry} onClick={() => openModal(entry.type)} />
            ))}
          </div>
        )}
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 border-b border-[#dddddd] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'pb-3 px-2 text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 shrink-0',
              activeTab === tab.id
                ? 'text-[#222222] border-b-2 border-[#222222] -mb-px'
                : 'text-[#6a6a6a] hover:text-[#222222]',
            )}
          >
            {tab.label}
            {!isOrdersLoading && tabCounts[tab.id] > 0 && (
              <span
                className={cn(
                  'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                  activeTab === tab.id ? 'bg-[#222222] text-white' : 'bg-[#ebebeb] text-[#6a6a6a]',
                )}
              >
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      {isOrdersLoading ? (
        <div className="space-y-4">
          <ServiceOrderCardSkeleton />
          <ServiceOrderCardSkeleton />
          <ServiceOrderCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tabId={activeTab} onRequest={() => openModal()} />
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <ServiceOrderCard
              key={order.id}
              order={order}
              onCancel={setCancelId}
              onPay={(id) => createPayment(id)}
              isPayingThis={isCreatingPayment && payingOrderId === order.id}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <CreateOrderModal
          initialType={initialType}
          catalog={catalog}
          onClose={() => setShowModal(false)}
        />
      )}
      {cancelId && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setCancelId(null)}
          isPending={isCancelling}
        />
      )}
    </div>
  );
}
