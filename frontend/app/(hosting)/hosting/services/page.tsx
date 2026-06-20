'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useLandlordServiceOrders,
  useUpdateServiceStatus,
  useCreateServicePayment,
  useServiceCatalog,
} from '@/hooks/use-services';
import { getServicePaymentStatusApi } from '@/lib/api/payment.api';
import type { ServiceOrder, ServiceCatalogEntry } from '@/types';

type ServiceStatus = ServiceOrder['status'];

const SERVICE_META: Record<ServiceOrder['type'], { emoji: string; label: string }> = {
  cleaning:     { emoji: '🧹', label: 'Dọn dẹp vệ sinh' },
  repair:       { emoji: '🔧', label: 'Sửa chữa' },
  wifi:         { emoji: '📶', label: 'Lắp đặt WiFi' },
  moving:       { emoji: '📦', label: 'Chuyển đồ' },
  painting:     { emoji: '🎨', label: 'Sơn nhà' },
  registration: { emoji: '📋', label: 'Đăng ký tạm trú' },
};

function fmtPrice(n: number) {
  return n.toLocaleString('vi-VN') + '₫';
}

const STATUS_CONFIG: Record<ServiceOrder['status'], { label: string; className: string }> = {
  pending:     { label: 'Chờ xác nhận',  className: 'bg-[#FF5E00] border-[#FF5E00] text-white' },
  confirmed:   { label: 'Đã xác nhận',  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'Đang xử lý',   className: 'bg-violet-50 text-violet-700 border-violet-200' },
  done:        { label: 'Hoàn thành',    className: 'bg-stone-100 text-stone-500 border-stone-200' },
  cancelled:   { label: 'Đã huỷ',       className: 'bg-red-50 text-[#c13515] border-red-100' },
};

const PAYMENT_CONFIG: Record<ServiceOrder['paymentStatus'], { label: string; className: string }> = {
  unpaid:   { label: 'Chưa thanh toán', className: 'text-amber-600' },
  paid:     { label: 'Đã thanh toán',   className: 'text-emerald-600' },
  refunded: { label: 'Đã hoàn tiền',    className: 'text-blue-600' },
};

const TABS: { id: TabId; label: string; statuses: ServiceStatus[] }[] = [
  { id: 'active',    label: 'Đang xử lý', statuses: ['pending', 'confirmed', 'in_progress'] as ServiceStatus[] },
  { id: 'done',      label: 'Hoàn thành', statuses: ['done'] as ServiceStatus[] },
  { id: 'cancelled', label: 'Đã huỷ',    statuses: ['cancelled'] as ServiceStatus[] },
];

type TabId = 'active' | 'done' | 'cancelled';

function fmtDateTime(dt: string) {
  return new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ServiceOrderCard({
  order,
  onCancel,
  onPay,
  isActing,
  isPaying,
}: {
  order: ServiceOrder;
  onCancel: (id: string) => void;
  onPay: (id: string) => void;
  isActing: boolean;
  isPaying: boolean;
}) {
  const meta       = SERVICE_META[order.type];
  const sc         = STATUS_CONFIG[order.status];
  const pc         = PAYMENT_CONFIG[order.paymentStatus];
  const prop       = typeof order.property === 'object' ? order.property : null;

  return (
    <div className="flex items-start self-stretch bg-white py-[21px] px-5 gap-4 rounded-[14px] border border-solid border-[#DDDDDD]">
      {/* Emoji icon */}
      <div className="shrink-0 text-[#222222] bg-[#F7F7F7] text-3xl py-6 px-5 rounded-[10px] flex items-center justify-center">
        {meta.emoji}
      </div>

      <div className="flex flex-1 flex-col gap-[7px]">
        {/* Title row + status badge */}
        <div className="flex justify-between items-start self-stretch">
          <div className="flex flex-col gap-1">
            <span className="text-[#222222] text-[15px] font-bold">{meta.label}</span>
            {prop && (
              <div className="flex items-center gap-1">
                <img
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/86935612-dbeb-427d-a19c-1ff89277d7bc"
                  className="w-3.5 h-3.5 object-fill"
                  alt=""
                />
                <span className="text-[#6A6A6A] text-sm truncate">{prop.title}</span>
              </div>
            )}
          </div>
          <div className={cn(
            'flex shrink-0 items-start py-0.5 px-[11px] rounded-[26843550px] border text-[11px] font-bold',
            sc.className,
          )}>
            {sc.label}
          </div>
        </div>

        {/* Date + location */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center gap-1.5">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/f73179bb-5094-4445-9351-88f6802cd03e"
              className="w-3.5 h-3.5 object-fill shrink-0"
              alt=""
            />
            <span className="text-[#3F3F3F] text-sm">{fmtDateTime(order.scheduledAt)}</span>
          </div>
          {prop && (
            <div className="flex items-center gap-1">
              <img
                src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/802ffdb3-d50b-419b-8376-55de162eb412"
                className="w-3.5 h-3.5 object-fill shrink-0"
                alt=""
              />
              <span className="text-[#6A6A6A] text-sm truncate">
                {[prop.address?.district, prop.address?.city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Footer: price + actions */}
        <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-solid border-t-[#DDDDDD]">
          <div className="flex items-center gap-2">
            <span className="text-[#222222] text-sm font-bold">{fmtPrice(order.price)}</span>
            <span className={cn('text-xs', pc.className)}>· {pc.label}</span>
          </div>
          <div className="flex gap-2">
            {order.paymentStatus === 'unpaid' && order.status !== 'pending' && (
              <button
                onClick={() => onPay(order.id)}
                disabled={isPaying}
                className="flex shrink-0 items-center bg-[#ffef3d] hover:shadow-lg transition-all text-left py-1.5 px-3 gap-1.5 rounded-lg border-0 disabled:opacity-60"
              >
                <span className="text-[#1f1c00] text-xs font-bold">Thanh toán</span>
              </button>
            )}
            {order.status === 'pending' && (
              <button
                onClick={() => onCancel(order.id)}
                className="flex shrink-0 items-start bg-transparent text-left py-1.5 px-[13px] rounded-lg border border-solid border-[#DDDDDD]"
              >
                <span className="text-[#6A6A6A] text-xs font-bold">Huỷ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CancelModal({ onConfirm, onClose, isPending }: { onConfirm: () => void; onClose: () => void; isPending: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] p-6 w-full max-w-sm shadow-lg">
        <button onClick={onClose} className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-[#F6F8FB] hover:bg-[#ebebeb] transition-colors">
          <span className="text-[#222222] text-lg font-bold">×</span>
        </button>
        <div className="size-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🧹</span>
        </div>
        <h3 className="text-[17px] font-semibold text-[#222222] text-center mb-2">Huỷ yêu cầu dịch vụ?</h3>
        <p className="text-sm text-[#6A6A6A] text-center mb-6">Yêu cầu này sẽ bị huỷ và không thể khôi phục.</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-[#222222] border border-[#DDDDDD] rounded-lg hover:bg-[#F6F8FB] transition-colors">
            Giữ lại
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#c13515] hover:bg-[#b32505] disabled:opacity-60 rounded-lg transition-colors">
            {isPending ? 'Đang huỷ...' : 'Xác nhận huỷ'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex items-start self-stretch bg-white py-[21px] px-5 gap-4 rounded-[14px] border border-solid border-[#DDDDDD] animate-pulse">
      <div className="shrink-0 w-[90px] h-[90px] bg-[#ebebeb] rounded-[10px]" />
      <div className="flex-1 space-y-3 pt-2">
        <div className="h-5 bg-[#ebebeb] rounded w-1/3" />
        <div className="h-4 bg-[#ebebeb] rounded w-1/2" />
        <div className="h-4 bg-[#ebebeb] rounded w-2/3" />
        <div className="h-8 bg-[#ebebeb] rounded w-1/4 mt-4" />
      </div>
    </div>
  );
}

// ─── payment result toast ───────────────────────────────────────────────────────

function PaymentToast() {
  const params  = useSearchParams();
  const router  = useRouter();
  const qc      = useQueryClient();
  const handled = useRef(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollCountRef = useRef(0);
  const MAX_POLLS = 20;
  const POLL_INTERVAL = 2000;

  const pollPaymentStatus = async (orderId: string) => {
    if (pollCountRef.current >= MAX_POLLS) {
      setIsPolling(false);
      toast.error('Không thể xác nhận trạng thái thanh toán. Vui lòng kiểm tra lại.');
      router.replace('/hosting/services');
      return;
    }
    pollCountRef.current++;
    try {
      const data = await getServicePaymentStatusApi(orderId);
      if (data.data?.status === 'PAID' || data.data?.paymentStatus === 'paid') {
        setIsPolling(false);
        toast.success('Thanh toán dịch vụ thành công!');
        qc.invalidateQueries({ queryKey: ['services', 'landlord'] });
        sessionStorage.removeItem('pendingPayment');
        router.replace('/hosting/services');
        return;
      }
    } catch {
      // ignore single poll errors
    }
    setTimeout(() => pollPaymentStatus(orderId), POLL_INTERVAL);
  };

  useEffect(() => {
    if (handled.current) return;
    const result = params.get('payment');
    const payosStatus = params.get('status');

    if (result === 'success' || payosStatus === 'PAID') {
      handled.current = true;

      if (payosStatus === 'PAID') {
        toast.success('Thanh toán dịch vụ thành công!');
        qc.invalidateQueries({ queryKey: ['services', 'landlord'] });
        sessionStorage.removeItem('pendingPayment');
        router.replace('/hosting/services');
        return;
      }

      const pending = sessionStorage.getItem('pendingPayment');
      if (pending) {
        const { type, id } = JSON.parse(pending);
        if (type === 'service') {
          setIsPolling(true);
          pollCountRef.current = 0;
          pollPaymentStatus(id);
        }
      }
      setTimeout(() => qc.invalidateQueries({ queryKey: ['services', 'landlord'] }), 300);
      router.replace('/hosting/services');
    } else if (result === 'cancel') {
      handled.current = true;
      sessionStorage.removeItem('pendingPayment');
      toast.info('Bạn đã huỷ thanh toán. Yêu cầu dịch vụ vẫn còn hiệu lực.');
      router.replace('/hosting/services');
    }
  }, [params, router, qc]);

  return null;
}

export default function HostingServicesPage() {
  const router     = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('active');
  const [cancelId, setCancelId]   = useState<string | null>(null);

  const { data, isLoading }             = useLandlordServiceOrders();
  const { data: catalogData, isLoading: isCatalogLoading } = useServiceCatalog();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateServiceStatus();
  const { mutate: createPayment, isPending: isCreatingPayment } = useCreateServicePayment();

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

  const handleCancel = () => {
    if (!cancelId) return;
    updateStatus(
      { id: cancelId, status: 'cancelled' },
      { onSuccess: () => { setCancelId(null); toast.success('Đã huỷ yêu cầu dịch vụ.'); } },
    );
  };

  return (
    <div className="space-y-6">
      <Suspense><PaymentToast /></Suspense>

      {/* Title row */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-ink-black">Dịch vụ của tôi</h1>
        <Link
          href="/hosting/services/request"
          className="flex flex-col shrink-0 items-start bg-[#ffef3d] hover:shadow-lg transition-all text-left py-2.5 px-5 rounded-lg border-0"
        >
          <span className="text-[#1f1c00] text-sm font-bold">+ Yêu cầu dịch vụ</span>
        </Link>
      </div>

      {/* Service type cards */}
      {isCatalogLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[105px] bg-[#ebebeb] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(catalogData ?? []).map((entry: ServiceCatalogEntry) => (
            <button
              key={entry.type}
              type="button"
              onClick={() => router.push(`/hosting/services/request?type=${entry.type}`)}
              className="flex flex-col items-center text-center py-4 px-1 gap-1.5 rounded-xl border border-solid border-[#DDDDDD] hover:border-[#ffef3d] hover:shadow-[0_0_0_1px_#ffef3d] transition-all cursor-pointer"
            >
              <span className="text-[#222222] text-2xl">{SERVICE_META[entry.type].emoji}</span>
              <span className="text-[#6A6A6A] text-[11px] font-bold leading-tight">{SERVICE_META[entry.type].label}</span>
              <span className="text-[#929292] text-[10px]">{fmtPrice(entry.price)}/{entry.unit}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center self-stretch gap-1 border-b border-solid border-b-[#DDDDDD]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex shrink-0 items-center pb-3 px-2 gap-[7px] transition-colors',
              activeTab === tab.id ? 'pb-[11px] border-b-2 border-[#222222] -mb-px' : '',
            )}
          >
            {tabCounts[tab.id] > 0 && activeTab !== tab.id ? (
              <div className="flex shrink-0 items-center gap-[7px]">
                <span className="text-[15px] font-bold">{tab.label}</span>
                <div className="flex flex-col shrink-0 items-start bg-[#222222] py-0.5 px-1.5 rounded-[26843550px]">
                  <span className="text-white text-[11px] font-bold">{tabCounts[tab.id]}</span>
                </div>
              </div>
            ) : (
              <span className={cn(
                'text-[15px] font-bold',
                activeTab === tab.id ? 'text-[#222222]' : 'text-[#6A6A6A]',
              )}>
                {tab.label}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order list */}
      {isLoading ? (
        <div className="flex flex-col gap-4 self-stretch">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 self-stretch">
          <div className="size-16 bg-white rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🔧</span>
          </div>
          <h3 className="text-base font-semibold text-[#222222] mb-1">Chưa có yêu cầu nào</h3>
          <p className="text-sm text-[#6A6A6A]">Nhấn &ldquo;+ Yêu cầu dịch vụ&rdquo; để tạo mới.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 self-stretch">
          {filtered.map((order) => (
            <ServiceOrderCard
              key={order.id}
              order={order}
              onCancel={setCancelId}
              onPay={(id) => createPayment(id)}
              isActing={isUpdating}
              isPaying={isCreatingPayment}
            />
          ))}
        </div>
      )}

      {/* Cancel modal */}
      {cancelId && (
        <CancelModal
          onConfirm={handleCancel}
          onClose={() => setCancelId(null)}
          isPending={isUpdating}
        />
      )}
    </div>
  );
}
