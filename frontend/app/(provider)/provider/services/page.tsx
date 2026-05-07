'use client';

import { useState, useMemo } from 'react';
import {
  Wrench,
  CalendarDays,
  MapPin,
  User as UserIcon,
  Phone,
  Home,
  Play,
  CheckCircle2,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useProviderServiceOrders, useUpdateServiceStatus } from '@/hooks/use-services';
import { ServiceOrderCardSkeleton } from '@/components/ui/skeleton';
import type { ServiceOrder, Property, User } from '@/types';

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
  confirmed:   { label: 'Chờ bắt đầu',    className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  in_progress: { label: 'Đang thực hiện', className: 'bg-violet-50 text-violet-700 border border-violet-200' },
  done:        { label: 'Hoàn thành',     className: 'bg-stone-100 text-stone-500 border border-stone-200' },
  cancelled:   { label: 'Đã huỷ',         className: 'bg-red-50 text-[#c13515] border border-red-100' },
};

type TabId = 'todo' | 'in_progress' | 'done';

const TABS: { id: TabId; label: string; statuses: ServiceOrder['status'][] }[] = [
  { id: 'todo',        label: 'Cần thực hiện',  statuses: ['confirmed'] },
  { id: 'in_progress', label: 'Đang thực hiện', statuses: ['in_progress'] },
  { id: 'done',        label: 'Đã hoàn thành',  statuses: ['done'] },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function isSoon(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 24 * 60 * 60 * 1000; // trong 24h
}

// ─── confirm modal ────────────────────────────────────────────────────────────

function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  confirmClass,
  onConfirm,
  onClose,
  isPending,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] p-6 w-full max-w-sm shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_8px_32px_0]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-[#f7f7f7] hover:bg-[#dddddd] transition-colors"
        >
          <X className="size-4 text-[#222222]" />
        </button>
        <h3 className="text-[17px] font-semibold text-[#222222] text-center mb-2">{title}</h3>
        <p className="text-sm text-[#6a6a6a] text-center mb-6 leading-relaxed">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f7f7] transition-colors"
          >
            Huỷ bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={cn('flex-1 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-2', confirmClass)}
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── order card ───────────────────────────────────────────────────────────────

function ProviderOrderCard({
  order,
  onAction,
  isActioning,
}: {
  order: ServiceOrder;
  onAction: (order: ServiceOrder) => void;
  isActioning: boolean;
}) {
  const property = typeof order.property === 'object' ? (order.property as Property) : null;
  const tenant   = typeof order.tenant   === 'object' ? (order.tenant   as User)     : null;
  const meta      = SERVICE_META[order.type];
  const statusCfg = STATUS_CONFIG[order.status];
  const today     = property && isToday(order.scheduledAt);
  const soon      = property && isSoon(order.scheduledAt);

  const canStart    = order.status === 'confirmed';
  const canComplete = order.status === 'in_progress';

  return (
    <article className="flex flex-col sm:flex-row gap-4 border border-[#dddddd] rounded-[14px] p-4 sm:p-5 bg-white hover:shadow-[rgba(0,0,0,0.06)_0_2px_12px] transition-shadow">
      {/* Icon tile */}
      <div className="size-20 rounded-[10px] bg-[#f7f7f7] flex items-center justify-center shrink-0 relative">
        <span className="text-3xl leading-none">{meta.emoji}</span>
        {today && (
          <span className="absolute -top-1.5 -right-1.5 text-[10px] font-bold text-white bg-[#ff385c] px-1.5 py-0.5 rounded-full leading-none">
            HÔM NAY
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-[#222222]">{meta.label}</h3>
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

        {/* Scheduled time */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className={cn(
            'flex items-center gap-1.5 text-sm font-medium',
            today ? 'text-[#ff385c]' : soon ? 'text-amber-600' : 'text-[#3f3f3f]',
          )}>
            <CalendarDays className="size-3.5 shrink-0" />
            {formatDateTime(order.scheduledAt)}
            {today && <span className="text-[11px] font-bold">(Hôm nay!)</span>}
            {!today && soon && <span className="text-[11px] font-semibold">(Sắp tới)</span>}
          </span>
          {property?.address && (
            <span className="flex items-center gap-1 text-sm text-[#6a6a6a]">
              <MapPin className="size-3.5 shrink-0" />
              {[property.address.street, property.address.district, property.address.city].filter(Boolean).join(', ')}
            </span>
          )}
        </div>

        {/* Tenant contact */}
        {tenant && (
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5 text-sm text-[#6a6a6a]">
              <UserIcon className="size-3.5 shrink-0" />
              {tenant.name}
            </span>
            {tenant.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="flex items-center gap-1.5 text-sm font-medium text-[#428bff] hover:underline"
              >
                <Phone className="size-3.5 shrink-0" />
                {tenant.phone}
              </a>
            )}
          </div>
        )}

        {/* Note */}
        {order.note && (
          <p className="text-xs text-[#6a6a6a] italic bg-[#f7f7f7] px-3 py-2 rounded-[8px]">
            &ldquo;{order.note}&rdquo;
          </p>
        )}

        {/* Done state */}
        {order.status === 'done' && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 w-fit">
            <CheckCircle2 className="size-3.5 shrink-0" />
            Đã hoàn thành — {formatVnd(order.providerPayout ?? order.price * 0.9)} sẽ được thanh toán
          </span>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-[#dddddd]">
          <span className="text-sm font-semibold text-[#222222]">{formatVnd(order.price)}</span>

          <div className="flex gap-2 shrink-0">
            {canStart && (
              <button
                onClick={() => onAction(order)}
                disabled={isActioning}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#222222] hover:bg-[#3f3f3f] disabled:opacity-60 rounded-lg transition-all active:scale-95"
              >
                {isActioning ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                Bắt đầu
              </button>
            )}
            {canComplete && (
              <button
                onClick={() => onAction(order)}
                disabled={isActioning}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] disabled:opacity-60 rounded-lg transition-all active:scale-95"
              >
                {isActioning ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Hoàn thành
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

const EMPTY_CONFIG: Record<TabId, { message: string; sub: string }> = {
  todo:        { message: 'Không có đơn cần thực hiện', sub: 'Các đơn đã được xác nhận và chờ bạn bắt đầu sẽ hiển thị ở đây.' },
  in_progress: { message: 'Không có đơn đang thực hiện', sub: 'Các đơn bạn đang xử lý sẽ hiển thị ở đây.' },
  done:        { message: 'Chưa có đơn hoàn thành', sub: 'Lịch sử dịch vụ đã hoàn thành sẽ xuất hiện ở đây.' },
};

function EmptyState({ tabId }: { tabId: TabId }) {
  const { message, sub } = EMPTY_CONFIG[tabId];
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="size-16 bg-[#f7f7f7] rounded-full flex items-center justify-center mb-4">
        {tabId === 'done'
          ? <CheckCircle2 className="size-8 text-[#dddddd]" />
          : tabId === 'in_progress'
            ? <Wrench className="size-8 text-[#dddddd]" />
            : <Clock className="size-8 text-[#dddddd]" />}
      </div>
      <h2 className="text-lg font-semibold text-[#222222] mb-2">{message}</h2>
      <p className="text-sm text-[#6a6a6a] max-w-xs leading-relaxed">{sub}</p>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

type PendingAction = { order: ServiceOrder; nextStatus: ServiceOrder['status'] };

export default function ProviderServicesPage() {
  const [activeTab, setActiveTab]       = useState<TabId>('todo');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const { data, isLoading } = useProviderServiceOrders();
  const { mutate: updateStatus, isPending: isUpdating, variables: updatingId } = useUpdateServiceStatus();

  const allOrders = data?.data ?? [];

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab)!;
    return allOrders
      .filter((o) => tab.statuses.includes(o.status))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
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

  const handleAction = (order: ServiceOrder) => {
    const nextStatus: ServiceOrder['status'] =
      order.status === 'confirmed' ? 'in_progress' : 'done';
    setPendingAction({ order, nextStatus });
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    updateStatus(
      { id: pendingAction.order.id, status: pendingAction.nextStatus },
      {
        onSuccess: () => {
          toast.success(
            pendingAction.nextStatus === 'in_progress'
              ? 'Đã bắt đầu thực hiện dịch vụ.'
              : 'Dịch vụ đã được đánh dấu hoàn thành!',
          );
          setPendingAction(null);
          if (pendingAction.nextStatus === 'in_progress') setActiveTab('in_progress');
          if (pendingAction.nextStatus === 'done')        setActiveTab('done');
        },
      },
    );
  };

  const modalConfig = pendingAction
    ? pendingAction.nextStatus === 'in_progress'
      ? {
          title: 'Bắt đầu thực hiện?',
          description: `Xác nhận bạn đã đến nơi và bắt đầu ${SERVICE_META[pendingAction.order.type].label.toLowerCase()}.`,
          confirmLabel: 'Bắt đầu',
          confirmClass: 'bg-[#222222] hover:bg-[#3f3f3f] disabled:opacity-60',
        }
      : {
          title: 'Đánh dấu hoàn thành?',
          description: 'Xác nhận bạn đã hoàn tất công việc và khách hàng đã nghiệm thu.',
          confirmLabel: 'Hoàn thành',
          confirmClass: 'bg-[#ff385c] hover:bg-[#e00b41] disabled:opacity-60',
        }
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#222222]">Dịch vụ được giao</h1>

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
            {!isLoading && tabCounts[tab.id] > 0 && (
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
      {isLoading ? (
        <div className="space-y-4">
          <ServiceOrderCardSkeleton />
          <ServiceOrderCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tabId={activeTab} />
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <ProviderOrderCard
              key={order.id}
              order={order}
              onAction={handleAction}
              isActioning={isUpdating && updatingId?.id === order.id}
            />
          ))}
        </div>
      )}

      {/* Confirm modal */}
      {pendingAction && modalConfig && (
        <ConfirmActionModal
          {...modalConfig}
          onConfirm={confirmAction}
          onClose={() => setPendingAction(null)}
          isPending={isUpdating}
        />
      )}
    </div>
  );
}
