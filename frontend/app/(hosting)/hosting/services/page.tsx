'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Wrench, CalendarDays, MapPin, User as UserIcon, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useLandlordServiceOrders,
  useUpdateServiceStatus,
} from '@/hooks/use-services';
import type { ServiceOrder, User, Property } from '@/types';

type ServiceStatus = ServiceOrder['status'];

const SERVICE_META: Record<ServiceOrder['type'], { emoji: string; label: string }> = {
  cleaning:     { emoji: '🧹', label: 'Dọn dẹp vệ sinh' },
  repair:       { emoji: '🔧', label: 'Sửa chữa' },
  wifi:         { emoji: '📶', label: 'Lắp đặt WiFi' },
  moving:       { emoji: '📦', label: 'Chuyển đồ' },
  painting:     { emoji: '🎨', label: 'Sơn nhà' },
  registration: { emoji: '📋', label: 'Đăng ký tạm trú' },
};

const STATUS_CONFIG: Record<ServiceOrder['status'], { label: string; className: string }> = {
  pending:     { label: 'Chờ xác nhận',  className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed:   { label: 'Đã xác nhận',   className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  in_progress: { label: 'Đang thực hiện', className: 'bg-violet-50 text-violet-700 border border-violet-200' },
  done:        { label: 'Hoàn thành',    className: 'bg-stone-100 text-stone-500 border border-stone-200' },
  cancelled:   { label: 'Đã huỷ',       className: 'bg-red-50 text-[#c13515] border border-red-100' },
};

const PAYMENT_CONFIG: Record<ServiceOrder['paymentStatus'], { label: string; className: string }> = {
  unpaid:   { label: 'Chưa thanh toán', className: 'text-amber-600' },
  paid:     { label: 'Đã thanh toán',   className: 'text-emerald-600' },
  refunded: { label: 'Đã hoàn tiền',    className: 'text-blue-600' },
};

const TABS: { id: TabId; label: string; statuses: ServiceStatus[] }[] = [
  { id: 'active',    label: 'Đang xử lý', statuses: ['pending', 'confirmed', 'in_progress'] },
  { id: 'done',      label: 'Hoàn thành', statuses: ['done'] },
  { id: 'cancelled', label: 'Đã huỷ',    statuses: ['cancelled'] },
];

type TabId = 'active' | 'done' | 'cancelled';

function fmtPrice(n: number) {
  return n.toLocaleString('vi-VN') + '₫';
}

function fmtDateTime(dt: string) {
  return new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ServiceOrderCard({
  order,
  onConfirm,
  onCancel,
  isActing,
}: {
  order: ServiceOrder;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  isActing: boolean;
}) {
  const meta      = SERVICE_META[order.type];
  const sc        = STATUS_CONFIG[order.status];
  const pc        = PAYMENT_CONFIG[order.paymentStatus];
  const prop      = typeof order.property === 'object' ? (order.property as Property) : null;
  const tenant    = typeof order.tenant === 'object' && order.tenant ? (order.tenant as User) : null;
  const provider  = order.assignedProvider && typeof order.assignedProvider === 'object'
    ? (order.assignedProvider as User)
    : null;

  return (
    <div className="bg-white rounded-[14px] border border-[#DDDDDD] overflow-hidden">
      {/* Top bar — status highlight for pending */}
      {order.status === 'pending' && (
        <div className="h-1 bg-amber-400" />
      )}

      <div className="p-4 sm:p-5 flex gap-3 sm:gap-4">
        {/* Emoji tile */}
        <div className="shrink-0 size-12 sm:size-14 bg-[#f7f7f7] rounded-[10px] flex items-center justify-center text-xl sm:text-2xl">
          {meta.emoji}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* Header: title + badge stacked on mobile */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="flex items-start justify-between gap-2 sm:block">
              <h3 className="text-[14px] sm:text-[15px] font-bold text-[#222222] leading-snug">{meta.label}</h3>
              {/* Badge inline with title on mobile */}
              <span className={cn('sm:hidden shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full', sc.className)}>
                {sc.label}
              </span>
            </div>
            {prop && (
              <p className="text-xs sm:text-sm text-[#6a6a6a] flex items-center gap-1 truncate sm:hidden">
                <MapPin className="size-3 shrink-0" />
                {prop.title}
              </p>
            )}
            {/* Badge on desktop */}
            <span className={cn('hidden sm:inline-flex shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full', sc.className)}>
              {sc.label}
            </span>
          </div>

          {/* Property — desktop only (already shown above on mobile) */}
          {prop && (
            <p className="hidden sm:flex text-sm text-[#6a6a6a] items-center gap-1 truncate">
              <MapPin className="size-3.5 shrink-0" />
              {prop.title}
              {prop.address ? ` — ${[prop.address.district, prop.address.city].filter(Boolean).join(', ')}` : ''}
            </p>
          )}

          {/* Tenant info */}
          {tenant && (
            <div className="flex items-center gap-2 sm:gap-3 py-2 px-3 bg-[#f7f7f7] rounded-[8px]">
              {tenant.avatar ? (
                <img src={tenant.avatar} alt={tenant.name} className="size-6 sm:size-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="size-6 sm:size-7 rounded-full bg-[#dddddd] flex items-center justify-center shrink-0">
                  <UserIcon className="size-3.5 sm:size-4 text-[#929292]" />
                </div>
              )}
              <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-3 gap-y-0">
                <p className="text-xs font-semibold text-[#222222] truncate">{tenant.name}</p>
                {tenant.phone && (
                  <p className="text-[11px] text-[#6a6a6a] flex items-center gap-1">
                    <Phone className="size-3 shrink-0" />
                    {tenant.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Scheduled time */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#3f3f3f]">
            <CalendarDays className="size-3.5 text-[#6a6a6a] shrink-0" />
            {fmtDateTime(order.scheduledAt)}
          </div>

          {/* Provider chip */}
          {provider && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100 w-fit">
              <UserIcon className="size-3.5 shrink-0" />
              Nhân viên: {provider.name}
            </div>
          )}

          {/* Note */}
          {order.note && (
            <p className="text-xs text-[#6a6a6a] italic">Ghi chú: {order.note}</p>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-[#dddddd]">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#222222]">{fmtPrice(order.price)}</span>
              <span className={cn('text-xs', pc.className)}>· {pc.label}</span>
            </div>
            {order.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => onConfirm(order.id)}
                  disabled={isActing}
                  className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 rounded-lg transition-colors"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => onCancel(order.id)}
                  disabled={isActing}
                  className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs font-bold text-[#6a6a6a] border border-[#dddddd] hover:border-[#222222] hover:text-[#222222] rounded-lg transition-colors"
                >
                  Từ chối
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cancel Modal ──────────────────────────────────────────────────────────────

function RejectModal({ onConfirm, onClose, isPending }: { onConfirm: () => void; onClose: () => void; isPending: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] p-6 w-full max-w-sm shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-[#f7f7f7] hover:bg-[#dddddd] transition-colors text-[#222222] text-lg font-bold"
        >
          ×
        </button>
        <div className="size-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wrench className="size-6 text-[#c13515]" />
        </div>
        <h3 className="text-[17px] font-semibold text-[#222222] text-center mb-2">Từ chối yêu cầu?</h3>
        <p className="text-sm text-[#6a6a6a] text-center mb-6">
          Yêu cầu này sẽ bị huỷ. Người thuê sẽ thấy trạng thái &ldquo;Đã huỷ&rdquo;.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f7f7] transition-colors"
          >
            Giữ lại
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#c13515] hover:bg-[#b32505] disabled:opacity-60 rounded-lg transition-colors"
          >
            {isPending ? 'Đang huỷ...' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[14px] border border-[#dddddd] p-5 flex gap-4 animate-pulse">
      <div className="size-14 bg-[#ebebeb] rounded-[10px] shrink-0" />
      <div className="flex-1 space-y-3 pt-1">
        <div className="h-4 bg-[#ebebeb] rounded w-1/3" />
        <div className="h-3 bg-[#ebebeb] rounded w-1/2" />
        <div className="h-8 bg-[#ebebeb] rounded w-full" />
        <div className="h-3 bg-[#ebebeb] rounded w-2/5" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HostingServicesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('active');
  const [rejectId, setRejectId]   = useState<string | null>(null);

  const { data, isLoading }                                   = useLandlordServiceOrders();
  const { mutate: updateStatus, isPending: isUpdating }       = useUpdateServiceStatus();

  const allOrders = useMemo(() => data?.data ?? [], [data]);

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab)!;
    return allOrders.filter((o) => tab.statuses.includes(o.status));
  }, [allOrders, activeTab]);

  const tabCounts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [
      t.id,
      allOrders.filter((o) => t.statuses.includes(o.status)).length,
    ])) as Record<TabId, number>,
    [allOrders],
  );

  const handleConfirm = (id: string) => {
    updateStatus(
      { id, status: 'confirmed' },
      { onSuccess: () => toast.success('Đã xác nhận yêu cầu dịch vụ.') },
    );
  };

  const handleReject = () => {
    if (!rejectId) return;
    updateStatus(
      { id: rejectId, status: 'cancelled' },
      { onSuccess: () => { setRejectId(null); toast.success('Đã từ chối yêu cầu dịch vụ.'); } },
    );
  };

  const pendingCount = tabCounts['active'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">Yêu cầu dịch vụ</h1>
        <p className="text-sm text-[#6a6a6a] mt-1">
          Quản lý các yêu cầu dịch vụ từ người thuê tại phòng của bạn.
        </p>
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-[10px]">
          <span className="text-amber-500 text-lg leading-none">⏳</span>
          <p className="text-sm text-amber-800 font-medium">
            Có <span className="font-bold">{pendingCount}</span> yêu cầu đang chờ bạn xác nhận.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#dddddd]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex shrink-0 items-center pb-3 px-2 gap-1.5 text-[15px] font-bold transition-colors',
              activeTab === tab.id
                ? 'text-[#222222] border-b-2 border-[#222222] -mb-px'
                : 'text-[#6a6a6a] hover:text-[#222222]',
            )}
          >
            {tab.label}
            {tabCounts[tab.id] > 0 && (
              <span className={cn(
                'text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-[#222222] text-white' : 'bg-[#ebebeb] text-[#6a6a6a]',
              )}>
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="size-16 bg-[#f7f7f7] rounded-full flex items-center justify-center mb-4">
            <Wrench className="size-8 text-[#dddddd]" />
          </div>
          <h3 className="text-base font-semibold text-[#222222] mb-1">
            {activeTab === 'active' ? 'Không có yêu cầu đang xử lý' : activeTab === 'done' ? 'Chưa có dịch vụ hoàn thành' : 'Không có yêu cầu bị từ chối'}
          </h3>
          <p className="text-sm text-[#6a6a6a]">
            {activeTab === 'active' ? 'Người thuê chưa có yêu cầu dịch vụ nào.' : 'Lịch sử sẽ xuất hiện ở đây.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((order) => (
            <ServiceOrderCard
              key={order.id}
              order={order}
              onConfirm={handleConfirm}
              onCancel={setRejectId}
              isActing={isUpdating}
            />
          ))}
        </div>
      )}

      {rejectId && (
        <RejectModal
          onConfirm={handleReject}
          onClose={() => setRejectId(null)}
          isPending={isUpdating}
        />
      )}
    </div>
  );
}
