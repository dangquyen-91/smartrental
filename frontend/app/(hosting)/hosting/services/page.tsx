'use client';

import { useState, useMemo } from 'react';
import { Wrench, CalendarDays, MapPin, User, Phone, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLandlordServiceOrders, useUpdateServiceStatus } from '@/hooks/use-services';
import { ServiceOrderCardSkeleton } from '@/components/ui/skeleton';
import type { ServiceOrder } from '@/types';

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

type TabId = 'pending' | 'active' | 'done';

const TABS: { id: TabId; label: string; statuses: ServiceOrder['status'][] }[] = [
  { id: 'pending', label: 'Chờ xác nhận', statuses: ['pending'] },
  { id: 'active',  label: 'Đang xử lý',   statuses: ['confirmed', 'in_progress'] },
  { id: 'done',    label: 'Kết thúc',     statuses: ['done', 'cancelled'] },
];

type ConfirmModal = { orderId: string; action: 'confirm' | 'cancel'; label: string } | null;

export default function HostingServicesPage() {
  const [activeTab, setActiveTab]     = useState<TabId>('pending');
  const [modal, setModal]             = useState<ConfirmModal>(null);

  const { data, isLoading }                          = useLandlordServiceOrders();
  const { mutate: updateStatus, isPending: isUpdating, variables } = useUpdateServiceStatus();

  const allOrders = useMemo(() => data?.data ?? [], [data]);

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab)!;
    return allOrders.filter((o) => tab.statuses.includes(o.status));
  }, [allOrders, activeTab]);

  const tabCounts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.id, allOrders.filter((o) => t.statuses.includes(o.status)).length])) as Record<TabId, number>,
    [allOrders],
  );

  const handleConfirm = () => {
    if (!modal) return;
    const status: ServiceOrder['status'] = modal.action === 'confirm' ? 'confirmed' : 'cancelled';
    updateStatus({ id: modal.orderId, status }, { onSuccess: () => setModal(null) });
  };

  const fmt = (dt: string) =>
    new Date(dt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const fmtPrice = (n: number) => n.toLocaleString('vi-VN') + ' đ';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">Dịch vụ tại nhà cho thuê</h1>
        <p className="text-sm text-[#6a6a6a] mt-1">Xem và xác nhận yêu cầu dịch vụ của khách thuê.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#dddddd]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === tab.id
                ? 'text-[#222222] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#222222]'
                : 'text-[#6a6a6a] hover:text-[#222222]',
            )}
          >
            {tab.label}
            {tabCounts[tab.id] > 0 && (
              <span className={cn(
                'ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold',
                activeTab === tab.id ? 'bg-[#222222] text-white' : 'bg-[#f7f7f7] text-[#6a6a6a]',
              )}>
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <ServiceOrderCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Wrench className="w-10 h-10 text-[#dddddd] mx-auto mb-3" />
          <p className="text-sm text-[#6a6a6a]">Không có yêu cầu nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const meta = SERVICE_META[order.type];
            const sc   = STATUS_CONFIG[order.status];
            const isActing = isUpdating && variables?.id === order.id;

            return (
              <div key={order.id} className="bg-white rounded-card border border-[#dddddd] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#f7f7f7] flex items-center justify-center text-2xl shrink-0">
                    {meta.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#222222]">{meta.label}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sc.className)}>{sc.label}</span>
                    </div>

                    <div className="mt-2 space-y-1">
                      {order.property && typeof order.property === 'object' && (
                        <div className="flex items-center gap-1.5 text-xs text-[#6a6a6a]">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{order.property.title}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-[#6a6a6a]">
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                        <span>{fmt(order.scheduledAt)}</span>
                      </div>
                      {order.tenant && typeof order.tenant === 'object' && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-[#6a6a6a]">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span>{order.tenant.name}</span>
                          </div>
                          {order.tenant.phone && (
                            <a href={`tel:${order.tenant.phone}`} className="flex items-center gap-1.5 text-xs text-[#ff385c] hover:underline">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              {order.tenant.phone}
                            </a>
                          )}
                        </div>
                      )}
                      {order.note && (
                        <p className="text-xs text-[#6a6a6a] italic">&ldquo;{order.note}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-sm font-bold text-[#222222]">{fmtPrice(order.price)}</p>

                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal({ orderId: order.id, action: 'cancel', label: 'Từ chối' })}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#dddddd] text-[#6a6a6a] hover:border-[#c13515] hover:text-[#c13515] transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          Từ chối
                        </button>
                        <button
                          onClick={() => setModal({ orderId: order.id, action: 'confirm', label: 'Xác nhận' })}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#222222] text-white hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
                        >
                          {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Xác nhận
                        </button>
                      </div>
                    )}

                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => setModal({ orderId: order.id, action: 'cancel', label: 'Huỷ đơn' })}
                        disabled={isActing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#dddddd] text-[#6a6a6a] hover:border-[#c13515] hover:text-[#c13515] transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Huỷ đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-panel p-6 w-full max-w-sm mx-4 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                modal.action === 'confirm' ? 'bg-[#f0fdf4]' : 'bg-red-50',
              )}>
                {modal.action === 'confirm'
                  ? <Check className="w-5 h-5 text-[#16a34a]" />
                  : <X className="w-5 h-5 text-[#c13515]" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-[#222222]">{modal.label} yêu cầu?</p>
                <p className="text-xs text-[#6a6a6a] mt-0.5">
                  {modal.action === 'confirm'
                    ? 'Khách thuê sẽ được thông báo và có thể tiến hành thanh toán.'
                    : 'Yêu cầu sẽ bị huỷ và khách thuê sẽ được thông báo.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-[#dddddd] text-[#6a6a6a] hover:bg-[#f7f7f7] transition-colors"
              >
                Huỷ bỏ
              </button>
              <button
                onClick={handleConfirm}
                disabled={isUpdating}
                className={cn(
                  'flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2',
                  modal.action === 'confirm' ? 'bg-[#222222] hover:bg-[#3a3a3a]' : 'bg-[#c13515] hover:bg-[#a12e12]',
                )}
              >
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                {modal.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
