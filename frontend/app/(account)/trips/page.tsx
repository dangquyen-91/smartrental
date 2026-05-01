'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  MapPin,
  Clock,
  CreditCard,
  X,
  ChevronRight,
  Home,
  CalendarCheck,
  Loader2,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyBookings, useCancelBooking } from '@/hooks/use-bookings';
import { useCreateBookingPayment } from '@/hooks/use-payment';
import type { Booking, Property } from '@/types';

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Booking['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'Chờ xác nhận',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  active: {
    label: 'Đang thuê',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  completed: {
    label: 'Hoàn thành',
    className: 'bg-stone-100 text-stone-500 border border-stone-200',
  },
  cancelled: {
    label: 'Đã huỷ',
    className: 'bg-red-50 text-[#c13515] border border-red-100',
  },
  rejected: {
    label: 'Bị từ chối',
    className: 'bg-red-50 text-[#c13515] border border-red-100',
  },
};

const PAYMENT_CONFIG: Record<
  Booking['paymentStatus'],
  { label: string; className: string }
> = {
  unpaid: { label: 'Chưa thanh toán', className: 'text-amber-600' },
  paid: { label: 'Đã thanh toán', className: 'text-emerald-600' },
  refunded: { label: 'Đã hoàn tiền', className: 'text-blue-600' },
};

type TabId = 'upcoming' | 'active' | 'completed' | 'cancelled';

const TABS: { id: TabId; label: string; statuses: Booking['status'][] }[] = [
  { id: 'upcoming', label: 'Sắp tới', statuses: ['pending', 'confirmed'] },
  { id: 'active', label: 'Đang thuê', statuses: ['active'] },
  { id: 'completed', label: 'Đã hoàn thành', statuses: ['completed'] },
  { id: 'cancelled', label: 'Đã huỷ', statuses: ['cancelled', 'rejected'] },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getPrimaryImage(property: Property): string | null {
  if (!property.images?.length) return null;
  return (
    property.images.find((i) => i.isPrimary)?.url ??
    property.images[0]?.url ??
    null
  );
}

// ─── payment deadline countdown ───────────────────────────────────────────────

function getTimeLeft(deadline: string): string | null {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours} giờ ${mins} phút` : `${mins} phút`;
}

function PaymentDeadlineCountdown({
  deadline,
  onExpired,
}: {
  deadline: string;
  onExpired?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = getTimeLeft(deadline);
      setTimeLeft(left);
      if (!left) onExpired?.();
    }, 30_000);
    return () => clearInterval(interval);
  }, [deadline, onExpired]);

  if (!timeLeft) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-[#c13515]">
        <Timer className="size-3.5 shrink-0" />
        Đã hết hạn thanh toán
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
      <Timer className="size-3.5 shrink-0" />
      Còn {timeLeft} để thanh toán
    </span>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function BookingCardSkeleton() {
  return (
    <div className="animate-pulse flex gap-4 border border-hairline-gray rounded-[14px] p-4 sm:p-5 bg-white">
      <div className="size-[100px] sm:size-[120px] rounded-[10px] bg-[#ebebeb] shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="flex justify-between items-start gap-2">
          <div className="h-4 bg-[#ebebeb] rounded w-2/3" />
          <div className="h-5 w-20 bg-[#ebebeb] rounded-full shrink-0" />
        </div>
        <div className="h-3.5 bg-[#ebebeb] rounded w-1/2" />
        <div className="h-3.5 bg-[#ebebeb] rounded w-3/4" />
        <div className="flex justify-between items-center pt-2 mt-auto border-t border-[#ebebeb]">
          <div className="h-4 bg-[#ebebeb] rounded w-1/3" />
          <div className="h-8 bg-[#ebebeb] rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

// ─── booking card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onCancel,
  onPay,
  isPayingThis,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  onPay: (id: string) => void;
  isPayingThis: boolean;
}) {
  const property =
    typeof booking.property === 'object' ? booking.property : null;
  const imgUrl = property ? getPrimaryImage(property) : null;
  const address = property
    ? [property.address?.district, property.address?.city]
        .filter(Boolean)
        .join(', ')
    : '';

  const statusCfg = STATUS_CONFIG[booking.status];
  const paymentCfg = PAYMENT_CONFIG[booking.paymentStatus];

  const canCancel =
    booking.status === 'pending' ||
    (booking.status === 'confirmed' && booking.paymentStatus === 'unpaid');
  const canPay =
    booking.status === 'confirmed' && booking.paymentStatus === 'unpaid';
  const awaitingCheckin =
    booking.status === 'confirmed' && booking.paymentStatus === 'paid';
  const showContract = ['active', 'completed'].includes(booking.status);

  return (
    <article className="flex flex-col sm:flex-row gap-4 border border-hairline-gray rounded-[14px] p-4 sm:p-5 bg-white hover:shadow-[rgba(0,0,0,0.06)_0_2px_12px] transition-shadow">
      {/* Property image */}
      <Link
        href={property ? `/properties/${property.id}` : '#'}
        className="block size-[100px] sm:size-[120px] rounded-[10px] overflow-hidden shrink-0 bg-soft-cloud"
      >
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt={property?.title ?? ''}
            className="size-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="size-full flex items-center justify-center">
            <Home className="size-8 text-hairline-gray" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-3">
          <Link
            href={property ? `/properties/${property.id}` : '#'}
            className="min-w-0"
          >
            <h3 className="text-[15px] font-semibold text-ink-black leading-snug line-clamp-2 hover:text-rausch transition-colors">
              {property?.title ?? 'Bất động sản'}
            </h3>
          </Link>
          <span
            className={cn(
              'shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
              statusCfg.className,
            )}
          >
            {statusCfg.label}
          </span>
        </div>

        {/* Location */}
        {address && (
          <p className="flex items-center gap-1 text-sm text-ash-gray">
            <MapPin className="size-3.5 shrink-0" />
            {address}
          </p>
        )}

        {/* Dates + duration */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 text-sm text-charcoal">
            <CalendarDays className="size-3.5 text-ash-gray shrink-0" />
            {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-ash-gray">
            <Clock className="size-3.5 shrink-0" />
            {booking.duration} tháng
          </span>
        </div>

        {/* Payment deadline countdown */}
        {canPay && booking.paymentDeadline && (
          <PaymentDeadlineCountdown deadline={booking.paymentDeadline} />
        )}

        {/* Awaiting landlord check-in */}
        {awaitingCheckin && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 w-fit">
            <CalendarCheck className="size-3.5 shrink-0" />
            Đã thanh toán — chờ chủ nhà xác nhận check-in
          </span>
        )}

        {/* Footer: price + actions */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-hairline-gray">
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-sm font-semibold text-ink-black">
              {formatVnd(booking.totalPrice)}
            </span>
            <span
              className={cn('text-xs font-medium shrink-0', paymentCfg.className)}
            >
              · {paymentCfg.label}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canPay && (
              <button
                onClick={() => onPay(booking.id)}
                disabled={isPayingThis}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rausch hover:bg-deep-rausch disabled:opacity-60 rounded-lg transition-all active:scale-95"
              >
                {isPayingThis ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <CreditCard className="size-3.5" />
                )}
                Thanh toán
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                className="px-3 py-1.5 text-xs font-semibold text-ash-gray border border-hairline-gray hover:border-ink-black hover:text-ink-black rounded-lg transition-colors"
              >
                Huỷ
              </button>
            )}
            {showContract && (
              <Link
                href="/contracts"
                className="flex items-center gap-0.5 text-xs font-semibold text-ink-black hover:text-rausch transition-colors"
              >
                Hợp đồng
                <ChevronRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── cancel modal ─────────────────────────────────────────────────────────────

function CancelModal({
  onConfirm,
  onClose,
  isPending,
}: {
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
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-soft-cloud hover:bg-hairline-gray transition-colors"
        >
          <X className="size-4 text-ink-black" />
        </button>

        <div className="size-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="size-6 text-[#c13515]" />
        </div>
        <h3 className="text-[17px] font-semibold text-ink-black text-center mb-2">
          Huỷ yêu cầu đặt phòng?
        </h3>
        <p className="text-sm text-ash-gray text-center mb-6">
          Yêu cầu này sẽ bị huỷ và không thể khôi phục.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-ink-black border border-hairline-gray rounded-lg hover:bg-soft-cloud transition-colors"
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

const EMPTY_CONFIG: Record<
  TabId,
  { message: string; sub: string; showCTA: boolean }
> = {
  upcoming: {
    message: 'Chưa có chuyến đi nào sắp tới',
    sub: 'Khi bạn đặt phòng thành công, chuyến đi sẽ xuất hiện ở đây.',
    showCTA: true,
  },
  active: {
    message: 'Chưa có chuyến đi đang thuê',
    sub: 'Các booking trong thời hạn thuê sẽ hiển thị ở đây.',
    showCTA: false,
  },
  completed: {
    message: 'Chưa có chuyến đi hoàn thành',
    sub: 'Lịch sử thuê phòng của bạn sẽ được lưu ở đây.',
    showCTA: false,
  },
  cancelled: {
    message: 'Không có yêu cầu bị huỷ',
    sub: 'Các yêu cầu bị huỷ hoặc từ chối sẽ xuất hiện ở đây.',
    showCTA: false,
  },
};

function EmptyState({ tabId }: { tabId: TabId }) {
  const { message, sub, showCTA } = EMPTY_CONFIG[tabId];
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="size-16 bg-soft-cloud rounded-full flex items-center justify-center mb-4">
        <CalendarCheck className="size-8 text-hairline-gray" />
      </div>
      <h2 className="text-lg font-semibold text-ink-black mb-2">{message}</h2>
      <p className="text-sm text-ash-gray mb-6 max-w-xs leading-relaxed">{sub}</p>
      {showCTA && (
        <Link
          href="/"
          className="px-6 py-3 text-sm font-semibold text-white bg-rausch hover:bg-deep-rausch rounded-[8px] transition-all active:scale-95"
        >
          Tìm phòng ngay
        </Link>
      )}
    </div>
  );
}

// ─── payment result toast ─────────────────────────────────────────────────────

function PaymentToast() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    const result = params.get('payment');
    if (result === 'success') {
      toast.success('Thanh toán thành công! Chờ chủ nhà xác nhận check-in.');
      // Delay 1.5s để webhook backend kịp cập nhật trước khi refetch
      const t = setTimeout(() => qc.invalidateQueries({ queryKey: ['bookings'] }), 1500);
      router.replace('/trips');
      return () => clearTimeout(t);
    } else if (result === 'cancel') {
      toast.info('Bạn đã huỷ thanh toán. Đơn đặt phòng vẫn còn hiệu lực.');
      router.replace('/trips');
    }
  }, [params, router, qc]);

  return null;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('upcoming');
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data, isLoading } = useMyBookings();
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const {
    mutate: createPayment,
    isPending: isCreatingPayment,
    variables: payingBookingId,
  } = useCreateBookingPayment();

  const allBookings = useMemo<Booking[]>(() => data?.data ?? [], [data?.data]);

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab)!;
    return allBookings.filter((b) => tab.statuses.includes(b.status));
  }, [allBookings, activeTab]);

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((tab) => [
          tab.id,
          allBookings.filter((b) => tab.statuses.includes(b.status)).length,
        ]),
      ) as Record<TabId, number>,
    [allBookings],
  );

  const handleCancel = () => {
    if (!cancelId) return;
    cancelBooking(cancelId, { onSuccess: () => setCancelId(null) });
  };

  return (
    <div className="space-y-6">
      <Suspense><PaymentToast /></Suspense>
      <h1 className="text-2xl font-bold text-ink-black">Đơn thuê của tôi</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-hairline-gray overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'pb-3 px-2 text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 shrink-0',
              activeTab === tab.id
                ? 'text-ink-black border-b-2 border-ink-black -mb-px'
                : 'text-ash-gray hover:text-ink-black',
            )}
          >
            {tab.label}
            {!isLoading && tabCounts[tab.id] > 0 && (
              <span
                className={cn(
                  'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                  activeTab === tab.id
                    ? 'bg-ink-black text-white'
                    : 'bg-[#ebebeb] text-ash-gray',
                )}
              >
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <BookingCardSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tabId={activeTab} />
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={setCancelId}
              onPay={(id) => createPayment(id)}
              isPayingThis={isCreatingPayment && payingBookingId === booking.id}
            />
          ))}
        </div>
      )}

      {/* Cancel modal */}
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
