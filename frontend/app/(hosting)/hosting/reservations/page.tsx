'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  CalendarDays,
  Clock,
  User,
  Phone,
  Home,
  ClipboardList,
  X,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
  Timer,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useLandlordBookings,
  useConfirmBooking,
  useRejectBooking,
  useActivateBooking,
  useCompleteBooking,
  useCancelBooking,
} from '@/hooks/use-bookings';
import type { Booking, Property, User as UserType } from '@/types';

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
    label: 'Đã từ chối',
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

type TabId = 'pending' | 'confirmed' | 'active' | 'completed' | 'closed';

const TABS: { id: TabId; label: string; statuses: Booking['status'][] }[] = [
  { id: 'pending', label: 'Chờ xác nhận', statuses: ['pending'] },
  { id: 'confirmed', label: 'Đã xác nhận', statuses: ['confirmed'] },
  { id: 'active', label: 'Đang thuê', statuses: ['active'] },
  { id: 'completed', label: 'Hoàn thành', statuses: ['completed'] },
  { id: 'closed', label: 'Đã đóng', statuses: ['cancelled', 'rejected'] },
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

function PaymentDeadlineCountdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(deadline));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft(deadline)), 30_000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-[#c13515]">
        <Timer className="size-3.5 shrink-0" />
        Đã hết hạn — chưa thanh toán
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
      <Timer className="size-3.5 shrink-0" />
      Người thuê còn {timeLeft} để thanh toán
    </span>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function ReservationCardSkeleton() {
  return (
    <div className="animate-pulse border border-hairline-gray rounded-card p-5 bg-white">
      <div className="flex gap-4">
        <div className="size-30 rounded-[10px] bg-[#ebebeb] shrink-0" />
        <div className="flex-1 space-y-2.5">
          <div className="flex justify-between items-start gap-2">
            <div className="h-4 bg-[#ebebeb] rounded w-2/3" />
            <div className="h-5 w-20 bg-[#ebebeb] rounded-full shrink-0" />
          </div>
          <div className="h-3.5 bg-[#ebebeb] rounded w-1/3" />
          <div className="h-3.5 bg-[#ebebeb] rounded w-1/2" />
          <div className="h-3.5 bg-[#ebebeb] rounded w-3/4" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-4 mt-4 border-t border-[#ebebeb]">
        <div className="h-4 bg-[#ebebeb] rounded w-1/4" />
        <div className="flex gap-2">
          <div className="h-8 bg-[#ebebeb] rounded-lg w-24" />
          <div className="h-8 bg-[#ebebeb] rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

// ─── reservation card ─────────────────────────────────────────────────────────

function ReservationCard({
  booking,
  onConfirm,
  onReject,
  onActivate,
  onComplete,
  onReclaim,
  isConfirming,
  isActivating,
  isCompleting,
  isReclaiming,
}: {
  booking: Booking;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onActivate: (id: string) => void;
  onComplete: (id: string) => void;
  onReclaim: (id: string) => void;
  isConfirming: boolean;
  isActivating: boolean;
  isCompleting: boolean;
  isReclaiming: boolean;
}) {
  const property =
    typeof booking.property === 'object' ? booking.property : null;
  const tenant =
    typeof booking.tenant === 'object' ? (booking.tenant as UserType) : null;
  const imgUrl = property ? getPrimaryImage(property) : null;
  const address = property
    ? [property.address?.district, property.address?.city]
        .filter(Boolean)
        .join(', ')
    : '';

  const statusCfg = STATUS_CONFIG[booking.status];
  const paymentCfg = PAYMENT_CONFIG[booking.paymentStatus];

  const isPending = booking.status === 'pending';
  const isConfirmedUnpaid =
    booking.status === 'confirmed' && booking.paymentStatus === 'unpaid';
  const isConfirmedPaid =
    booking.status === 'confirmed' && booking.paymentStatus === 'paid';
  const isActive = booking.status === 'active';

  return (
    <article className="border border-hairline-gray rounded-card p-4 sm:p-5 bg-white hover:shadow-[rgba(0,0,0,0.06)_0_2px_12px] transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Property image */}
        <Link
          href={property ? `/properties/${property.id}` : '#'}
          className="block size-25 sm:size-30 rounded-[10px] overflow-hidden shrink-0 bg-soft-cloud"
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
        <div className="flex-1 min-w-0 space-y-2">
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

          {/* Tenant info */}
          {tenant && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5 text-sm text-charcoal">
                <User className="size-3.5 text-ash-gray shrink-0" />
                {tenant.name}
              </span>
              {tenant.phone && (
                <a
                  href={`tel:${tenant.phone}`}
                  className="flex items-center gap-1.5 text-sm text-ash-gray hover:text-ink-black transition-colors"
                >
                  <Phone className="size-3.5 shrink-0" />
                  {tenant.phone}
                </a>
              )}
            </div>
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
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-hairline-gray">
        {/* Price + payment */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold text-ink-black">
            {formatVnd(booking.totalPrice)}
          </span>
          <span className={cn('text-xs font-medium', paymentCfg.className)}>
            · {paymentCfg.label}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Pending: confirm + reject */}
          {isPending && (
            <>
              <button
                onClick={() => onReject(booking.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ash-gray border border-hairline-gray hover:border-[#c13515] hover:text-[#c13515] rounded-lg transition-colors"
              >
                <X className="size-3.5" />
                Từ chối
              </button>
              <button
                onClick={() => onConfirm(booking.id)}
                disabled={isConfirming}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rausch hover:bg-deep-rausch disabled:opacity-60 rounded-lg transition-all active:scale-95"
              >
                {isConfirming ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Xác nhận
              </button>
            </>
          )}

          {/* Confirmed + unpaid: countdown + reclaim */}
          {isConfirmedUnpaid && (
            <div className="flex items-center gap-2 flex-wrap">
              {booking.paymentDeadline ? (
                <PaymentDeadlineCountdown deadline={booking.paymentDeadline} />
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  <AlertCircle className="size-3.5 shrink-0" />
                  Chờ người thuê thanh toán
                </span>
              )}
              <button
                onClick={() => onReclaim(booking.id)}
                disabled={isReclaiming}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ash-gray border border-hairline-gray hover:border-[#c13515] hover:text-[#c13515] rounded-lg transition-colors disabled:opacity-60"
              >
                {isReclaiming ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                Thu hồi
              </button>
            </div>
          )}

          {/* Confirmed + paid: check-in */}
          {isConfirmedPaid && (
            <button
              onClick={() => onActivate(booking.id)}
              disabled={isActivating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-all active:scale-95"
            >
              {isActivating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Check-in
            </button>
          )}

          {/* Active: complete */}
          {isActive && (
            <>
              <Link
                href="/hosting/contracts"
                className="flex items-center gap-0.5 text-xs font-semibold text-ink-black hover:text-rausch transition-colors"
              >
                Hợp đồng
                <ChevronRight className="size-3.5" />
              </Link>
              <button
                onClick={() => onComplete(booking.id)}
                disabled={isCompleting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-ink-black hover:bg-charcoal disabled:opacity-60 rounded-lg transition-all active:scale-95"
              >
                {isCompleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : null}
                Hoàn thành
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── reject modal ─────────────────────────────────────────────────────────────

function RejectModal({
  onConfirm,
  onClose,
  isPending,
}: {
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-panel p-6 w-full max-w-sm shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_8px_32px_0]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-soft-cloud hover:bg-hairline-gray transition-colors"
        >
          <X className="size-4 text-ink-black" />
        </button>

        <div className="size-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <X className="size-6 text-[#c13515]" />
        </div>
        <h3 className="text-[17px] font-semibold text-ink-black text-center mb-2">
          Từ chối yêu cầu thuê?
        </h3>
        <p className="text-sm text-ash-gray text-center mb-4">
          Người thuê sẽ được thông báo về quyết định này.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do từ chối (tuỳ chọn)..."
          rows={3}
          className="w-full mb-4 px-3 py-2.5 text-sm text-ink-black border border-hairline-gray rounded-lg outline-none focus:border-ink-black resize-none placeholder:text-stone-gray"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-ink-black border border-hairline-gray rounded-lg hover:bg-soft-cloud transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#c13515] hover:bg-[#b32505] disabled:opacity-60 rounded-lg transition-colors"
          >
            {isPending ? 'Đang xử lý...' : 'Từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── reclaim modal ────────────────────────────────────────────────────────────

function ReclaimModal({
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
      <div className="relative bg-white rounded-panel p-6 w-full max-w-sm shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_8px_32px_0]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-soft-cloud hover:bg-hairline-gray transition-colors"
        >
          <X className="size-4 text-ink-black" />
        </button>

        <div className="size-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <RotateCcw className="size-6 text-amber-600" />
        </div>
        <h3 className="text-[17px] font-semibold text-ink-black text-center mb-2">
          Thu hồi phòng?
        </h3>
        <p className="text-sm text-ash-gray text-center mb-6">
          Booking sẽ bị huỷ và phòng sẽ được mở lại để cho thuê.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-ink-black border border-hairline-gray rounded-lg hover:bg-soft-cloud transition-colors"
          >
            Không
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-60 rounded-lg transition-colors"
          >
            {isPending ? 'Đang xử lý...' : 'Thu hồi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

const EMPTY_CONFIG: Record<TabId, { message: string; sub: string }> = {
  pending: {
    message: 'Chưa có yêu cầu chờ xác nhận',
    sub: 'Khi người thuê gửi yêu cầu đặt phòng, chúng sẽ xuất hiện ở đây.',
  },
  confirmed: {
    message: 'Chưa có yêu cầu đã xác nhận',
    sub: 'Các booking đã xác nhận và đang chờ thanh toán sẽ hiển thị ở đây.',
  },
  active: {
    message: 'Chưa có phòng đang cho thuê',
    sub: 'Các hợp đồng đang trong thời hạn thuê sẽ hiển thị ở đây.',
  },
  completed: {
    message: 'Chưa có hợp đồng hoàn thành',
    sub: 'Lịch sử cho thuê thành công của bạn sẽ được lưu ở đây.',
  },
  closed: {
    message: 'Không có yêu cầu đã đóng',
    sub: 'Các yêu cầu bị từ chối hoặc huỷ sẽ xuất hiện ở đây.',
  },
};

function EmptyState({ tabId }: { tabId: TabId }) {
  const { message, sub } = EMPTY_CONFIG[tabId];
  return (
    <div className="flex flex-col items-center py-20 text-center bg-white rounded-card border border-hairline-gray">
      <div className="size-16 bg-soft-cloud rounded-full flex items-center justify-center mb-4">
        <ClipboardList className="size-8 text-hairline-gray" />
      </div>
      <h2 className="text-lg font-semibold text-ink-black mb-2">{message}</h2>
      <p className="text-sm text-ash-gray max-w-xs leading-relaxed">{sub}</p>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function HostingReservationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reclaimId, setReclaimId] = useState<string | null>(null);

  const { data, isLoading } = useLandlordBookings();
  const { mutate: confirmBooking, isPending: isConfirming, variables: confirmingId } =
    useConfirmBooking();
  const { mutate: rejectBooking, isPending: isRejecting } = useRejectBooking();
  const { mutate: activateBooking, isPending: isActivating, variables: activatingId } =
    useActivateBooking();
  const { mutate: completeBooking, isPending: isCompleting, variables: completingId } =
    useCompleteBooking();
  const { mutate: cancelBooking, isPending: isReclaiming } = useCancelBooking();

  const allBookings = useMemo<Booking[]>(
    () => data?.data ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.data],
  );

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

  const handleReject = (reason: string) => {
    if (!rejectId) return;
    rejectBooking(
      { id: rejectId, reason },
      { onSuccess: () => setRejectId(null) },
    );
  };

  const handleReclaim = () => {
    if (!reclaimId) return;
    cancelBooking(reclaimId, { onSuccess: () => setReclaimId(null) });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-black">Yêu cầu thuê phòng</h1>

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
                    : tab.id === 'pending'
                      ? 'bg-amber-500 text-white'
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
          <ReservationCardSkeleton />
          <ReservationCardSkeleton />
          <ReservationCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tabId={activeTab} />
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <ReservationCard
              key={booking.id}
              booking={booking}
              onConfirm={(id) => confirmBooking(id)}
              onReject={setRejectId}
              onActivate={(id) => activateBooking(id)}
              onComplete={(id) => completeBooking(id)}
              onReclaim={setReclaimId}
              isConfirming={isConfirming && confirmingId === booking.id}
              isActivating={isActivating && activatingId === booking.id}
              isCompleting={isCompleting && completingId === booking.id}
              isReclaiming={isReclaiming && reclaimId === booking.id}
            />
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectId && (
        <RejectModal
          onConfirm={handleReject}
          onClose={() => setRejectId(null)}
          isPending={isRejecting}
        />
      )}

      {/* Reclaim modal */}
      {reclaimId && (
        <ReclaimModal
          onConfirm={handleReclaim}
          onClose={() => setReclaimId(null)}
          isPending={isReclaiming}
        />
      )}
    </div>
  );
}
