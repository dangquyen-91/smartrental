'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  MapPin,
  Clock,
  X,
  ChevronRight,
  Home,
  CalendarCheck,
  Loader2,
  Star,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyBookings, useCancelBooking } from '@/hooks/use-bookings';
import { useCreateBookingPayment } from '@/hooks/use-payment';
import { getBookingPaymentStatusApi } from '@/lib/api/payment.api';
import { ReviewFormModal } from '@/components/shared/review-form-modal';
import { useAuth } from '@/hooks/use-auth';
import type { Booking, Property } from '@/types';

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<Booking['status'], { label: string; className: string }> = {
  pending:   { label: 'Chờ xác nhận', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed: { label: 'Đã xác nhận',  className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  active:    { label: 'Đang thuê',     className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  completed:  { label: 'Hoàn thành',    className: 'bg-stone-100 text-stone-500 border border-stone-200' },
  cancelled: { label: 'Đã huỷ',        className: 'bg-red-50 text-[#c13515] border border-red-100' },
  rejected:  { label: 'Bị từ chối',    className: 'bg-red-50 text-[#c13515] border border-red-100' },
};

const PAYMENT_CONFIG: Record<Booking['paymentStatus'], { label: string; className: string }> = {
  unpaid:    { label: 'Chưa thanh toán', className: 'text-amber-600' },
  paid:      { label: 'Đã thanh toán',  className: 'text-emerald-600' },
  refunded:  { label: 'Đã hoàn tiền',    className: 'text-blue-600' },
};

type TabId = 'upcoming' | 'active' | 'completed' | 'cancelled';

const TABS: { id: TabId; label: string; statuses: Booking['status'][] }[] = [
  { id: 'upcoming',   label: 'Sắp tới',         statuses: ['pending', 'confirmed'] },
  { id: 'active',     label: 'Đang thuê',        statuses: ['active'] },
  { id: 'completed',  label: 'Đã hoàn thành',    statuses: ['completed'] },
  { id: 'cancelled', label: 'Đã huỷ',            statuses: ['cancelled', 'rejected'] },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function getPrimaryImage(property: Property): string | null {
  if (!property.images?.length) return null;
  return property.images.find((i) => i.isPrimary)?.url ?? property.images[0]?.url ?? null;
}

function getTimeLeft(deadline: string): string | null {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours} giờ ${mins} phút` : `${mins} phút`;
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function BookingCardSkeleton() {
  return (
    <div className="animate-pulse flex gap-4 border border-[#DDDDDD] rounded-[14px] p-5 bg-white">
      <div className="size-[120px] rounded-[10px] bg-[#ebebeb] shrink-0" />
      <div className="flex-1 space-y-3 pt-2">
        <div className="h-5 bg-[#ebebeb] rounded w-3/4" />
        <div className="h-4 bg-[#ebebeb] rounded w-1/2" />
        <div className="h-4 bg-[#ebebeb] rounded w-2/3" />
        <div className="h-8 bg-[#ebebeb] rounded w-1/3 mt-4" />
      </div>
    </div>
  );
}

// ─── booking card ─────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onCancel,
  onPay,
  onReview,
  isPayingThis,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  onPay: (id: string) => void;
  onReview: (id: string) => void;
  isPayingThis: boolean;
}) {
  const property =
    typeof booking.property === 'object' ? booking.property : null;
  const imgUrl = property ? getPrimaryImage(property) : null;
  const address = property
    ? [property.address?.ward, property.address?.district, property.address?.city]
        .filter(Boolean).join(', ')
    : '';

  const statusCfg  = STATUS_CONFIG[booking.status];
  const paymentCfg = PAYMENT_CONFIG[booking.paymentStatus];

  const isActiveUnpaid = booking.status === 'active' && booking.paymentStatus === 'unpaid';
  const isAwaiting     = booking.status === 'confirmed';
  const canPay         = isActiveUnpaid;
  const canCancel      = booking.status === 'pending' || booking.status === 'confirmed';
  const canReview      = booking.status === 'completed';
  const showContract   = ['active', 'completed'].includes(booking.status);

  return (
    <div className="flex items-start bg-white py-[21px] px-5 gap-4 rounded-[14px] border border-solid border-[#DDDDDD]">
      <div className="flex flex-col shrink-0 items-center bg-[#F7F7F7] rounded-[10px] overflow-hidden">
        {imgUrl ? (
          <Image src={imgUrl} alt={property?.title ?? ''} width={120} height={120}
            className="w-16 h-16 sm:w-[120px] sm:h-[120px] object-cover" />
        ) : (
          <div className="w-16 h-16 sm:w-[120px] sm:h-[120px] flex items-center justify-center">
            <Home className="size-8 text-[#929292]" />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 items-center min-w-0">
        <div className="flex items-center w-full mb-2 gap-2">
          <span className="text-[#222222] text-[15px] font-bold flex-1 truncate">
            {property?.title ?? 'Bất động sản'}
          </span>
          <span className={cn(
            'shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full',
            statusCfg.className,
          )}>
            {statusCfg.label}
          </span>
        </div>

        {address && (
          <div className="flex items-center mb-1.5 w-full">
            <MapPin className="size-3.5 mr-1 text-[#929292] shrink-0" />
            <span className="text-[#6A6A6A] text-sm truncate">{address}</span>
          </div>
        )}

        {/* Lý do chủ nhà hủy / từ chối */}
        {booking.status === 'rejected' && booking.rejectionReason && (
          <div className="flex flex-col w-full mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-[11px] font-semibold text-[#c13515] mb-0.5">
              Lý do chủ nhà từ chối
            </span>
            <span className="text-xs text-[#3F3F3F] break-words">{booking.rejectionReason}</span>
          </div>
        )}
        {booking.status === 'cancelled' &&
          booking.cancelledBy === 'landlord' &&
          booking.cancelReason && (
            <div className="flex flex-col w-full mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-[11px] font-semibold text-[#c13515] mb-0.5">
                Lý do chủ nhà huỷ
              </span>
              <span className="text-xs text-[#3F3F3F] break-words">{booking.cancelReason}</span>
            </div>
          )}

        <div className="flex flex-wrap items-center mb-[7px] w-full gap-x-4 gap-y-1">
          <div className="flex shrink-0 items-center gap-1.5">
            <CalendarDays className="size-3.5 text-[#929292] shrink-0" />
            <span className="text-[#3F3F3F] text-sm">
              {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Clock className="size-3.5 text-[#929292] shrink-0" />
            <span className="text-[#6A6A6A] text-sm">{booking.duration} tháng</span>
          </div>
        </div>

        {isActiveUnpaid && booking.paymentDeadline && (
          <div className="flex items-center mb-[7px] w-full">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/cec79b00-4c3c-4f41-a518-a61aeca37613"
              className="w-3.5 h-3.5 mr-1 object-fill"
              alt=""
            />
            <span className="text-[#E17100] text-xs">Còn {getTimeLeft(booking.paymentDeadline)} để thanh toán</span>
          </div>
        )}

        {booking.status === 'active' && booking.paymentStatus === 'unpaid' && !booking.paymentDeadline && (
          <div className="flex items-center mb-[7px] w-full">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/cec79b00-4c3c-4f41-a518-a61aeca37613"
              className="w-3.5 h-3.5 mr-1 object-fill"
              alt=""
            />
            <span className="text-amber-600 text-xs">Đang chờ thanh toán...</span>
          </div>
        )}

        <div className="pt-3 border-t border-solid border-t-[#DDDDDD] w-full space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="flex items-center gap-[7px] min-w-0">
              <span className="text-[#222222] text-sm font-bold shrink-0">{formatVnd(booking.totalPrice)}</span>
              <span className={cn('text-xs shrink-0', paymentCfg.className)}>· {paymentCfg.label}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canPay && (
                <button
                  onClick={() => onPay(booking.id)}
                  disabled={isPayingThis}
                  className="flex shrink-0 items-center bg-[#ffef3d] text-left py-1.5 px-3 gap-1.5 rounded-lg border-0 disabled:opacity-60 hover:shadow-lg transition-all"
                >
                  {isPayingThis
                    ? <Loader2 className="size-3.5 animate-spin text-black" />
                    : <CreditCard className="size-3.5 text-black" />}
                  <span className="text-black text-xs font-bold">Thanh toán</span>
                </button>
              )}
              {canReview && (
                <button
                  onClick={() => onReview(booking.id)}
                  className="flex shrink-0 items-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  Đánh giá
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => onCancel(booking.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#6A6A6A] border border-[#DDDDDD] hover:border-[#222222] hover:text-[#222222] rounded-lg transition-colors"
                >
                  Huỷ
                </button>
              )}
              {showContract && (
                <Link
                  href="/contracts"
                  className="flex shrink-0 items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#222222] border border-[#DDDDDD] rounded-lg hover:bg-[#f7f7f7] transition-colors"
                >
                  Hợp đồng
                  <ChevronRight className="size-3.5 text-[#6A6A6A]" />
                </Link>
              )}
            </div>
          </div>
          {isAwaiting && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 w-full">
              <CalendarCheck className="size-3.5 shrink-0" />
              Đã xác nhận — chờ chủ nhà check-in
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── cancel modal ─────────────────────────────────────────────────────────────

function CancelModal({ onConfirm, onClose, isPending }: { onConfirm: () => void; onClose: () => void; isPending: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] p-6 w-full max-w-sm shadow-lg">
        <button onClick={onClose} className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-[#F6F8FB] hover:bg-[#ebebeb] transition-colors">
          <X className="size-4 text-[#222222]" />
        </button>
        <div className="size-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CalendarDays className="size-6 text-[#c13515]" />
        </div>
        <h3 className="text-[17px] font-semibold text-[#222222] text-center mb-2">Huỷ yêu cầu đặt phòng?</h3>
        <p className="text-sm text-[#6A6A6A] text-center mb-6">Yêu cầu này sẽ bị huỷ và không thể khôi phục.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-[#222222] border border-[#DDDDDD] rounded-lg hover:bg-[#F6F8FB] transition-colors">
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

// ─── empty state ──────────────────────────────────────────────────────────────

const EMPTY_CONFIG: Record<TabId, { message: string; sub: string; showCTA: boolean }> = {
  upcoming:   { message: 'Chưa có chuyến đi nào sắp tới',   sub: 'Khi bạn đặt phòng thành công, chuyến đi sẽ xuất hiện ở đây.',    showCTA: true },
  active:     { message: 'Chưa có chuyến đi đang thuê',      sub: 'Các booking trong thời hạn thuê sẽ hiển thị ở đây.',                showCTA: false },
  completed:  { message: 'Chưa có chuyến đi hoàn thành',    sub: 'Lịch sử thuê phòng của bạn sẽ được lưu ở đây.',                  showCTA: false },
  cancelled:  { message: 'Không có yêu cầu bị huỷ',        sub: 'Các yêu cầu bị huỷ hoặc từ chối sẽ xuất hiện ở đây.',           showCTA: false },
};

function EmptyState({ tabId }: { tabId: TabId }) {
  const { message, sub, showCTA } = EMPTY_CONFIG[tabId];
  return (
    <div className="flex flex-col items-center py-16 w-full">
      <div className="size-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-4">
        <CalendarCheck className="size-8 text-[#929292]" />
      </div>
      <h3 className="text-base font-semibold text-[#222222] mb-1">{message}</h3>
      <p className="text-sm text-[#6A6A6A] mb-6">{sub}</p>
      {showCTA && (
        <Link href="/" className="px-5 py-2.5 bg-[#ffef3d] text-[#1f1c00] font-semibold rounded-lg text-sm hover:shadow-lg transition-all">
          Tìm phòng ngay
        </Link>
      )}
    </div>
  );
}

// ─── payment result toast ─────────────────────────────────────────────────────

function PaymentToast() {
  const { hasHydrated } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const handled = useRef(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollCountRef = useRef(0);
  const MAX_POLLS = 20;
  const POLL_INTERVAL = 2000;

  const pollPaymentStatus = async (bookingId: string) => {
    if (pollCountRef.current >= MAX_POLLS) {
      setIsPolling(false);
      toast.error('Không thể xác nhận trạng thái thanh toán. Vui lòng kiểm tra lại.');
      router.replace('/trips');
      return;
    }
    pollCountRef.current++;
    try {
      const data = await getBookingPaymentStatusApi(bookingId);
      // Chỉ tin vào DB (paymentStatus: 'paid') — webhook phải cập nhật trước
      if (data.data?.paymentStatus === 'paid') {
        setIsPolling(false);
        toast.success('Thanh toán thành công! Chờ chủ nhà xác nhận check-in.');
        qc.invalidateQueries({ queryKey: ['bookings'] });
        sessionStorage.removeItem('pendingPayment');
        router.replace('/trips');
        return;
      }
    } catch {
      // ignore single poll errors
    }
    setTimeout(() => pollPaymentStatus(bookingId), POLL_INTERVAL);
  };

  useEffect(() => {
    // Đợi Zustand hydrate xong mới poll — tránh gọi API khi chưa có token
    // dẫn đến clearAuth() trong interceptor và bị kick về /login
    if (!hasHydrated) return;
    if (handled.current) return;
    const result = params.get('payment');
    const payosStatus = params.get('status'); // PAID, CANCELLED, etc.

    if (result === 'success' || payosStatus === 'PAID') {
      handled.current = true;

      // Dù PayOS redirect với status=PAID, vẫn phải poll đợi webhook cập nhật DB
      const pending = sessionStorage.getItem('pendingPayment');
      if (pending) {
        const { type, id } = JSON.parse(pending);
        if (type === 'booking') {
          setIsPolling(true);
          pollCountRef.current = 0;
          pollPaymentStatus(id);
          return;
        }
      }
      // Không có pendingPayment → chỉ refresh
      qc.invalidateQueries({ queryKey: ['bookings'] });
      router.replace('/trips');
    } else if (result === 'cancel') {
      handled.current = true;
      sessionStorage.removeItem('pendingPayment');
      toast.info('Bạn đã huỷ thanh toán. Đơn đặt phòng vẫn còn hiệu lực.');
      router.replace('/trips');
    }
  }, [params, router, qc, hasHydrated]);

  return null;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('upcoming');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);

  const { data, isLoading } = useMyBookings();
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const { mutate: createPayment, isPending: isCreatingPayment, variables: payingBookingId } = useCreateBookingPayment();

  const allBookings = useMemo<Booking[]>(() => data?.data ?? [], [data?.data]);

  const filtered = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab)!;
    return allBookings.filter((b) => tab.statuses.includes(b.status));
  }, [allBookings, activeTab]);

  const tabCounts = useMemo(
    () => Object.fromEntries(TABS.map((tab) => [
      tab.id,
      allBookings.filter((b) => tab.statuses.includes(b.status)).length,
    ])) as Record<TabId, number>,
    [allBookings],
  );

  const reviewPropertyTitle = useMemo(() => {
    const booking = allBookings.find((b) => b.id === reviewBookingId);
    if (!booking) return '';
    const property = typeof booking.property === 'object' ? booking.property : null;
    return property?.title ?? 'Căn phòng';
  }, [allBookings, reviewBookingId]);

  const handleCancel = () => {
    if (!cancelId) return;
    cancelBooking(cancelId, { onSuccess: () => setCancelId(null) });
  };

  return (
    <div className="flex flex-col self-stretch gap-6">
      <Suspense><PaymentToast /></Suspense>

      {/* Page title */}
      <div className="flex flex-col self-stretch gap-0.75">
        <span className="text-[#222222] text-2xl font-bold">Đơn thuê của tôi</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center self-stretch mb-[5px] border-b border-solid border-b-[#DDDDDD]">
        {TABS.map((tab) => {
          const count = tabCounts[tab.id];
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex shrink-0 items-center py-[5px] px-2 mr-1 gap-[7px]',
                isActive ? 'pb-[11px] border-b-2 border-[#222222] -mb-px' : ''
              )}
            >
              <span className={cn('text-sm font-bold', isActive ? 'text-[#222222]' : 'text-[#6A6A6A]')}>
                {tab.label}
              </span>
              {count > 0 && (
                <div className={cn(
                  'flex shrink-0 items-center py-[1px] px-1.5 rounded-[26843500px]',
                  isActive ? 'bg-[#222222]' : 'bg-[#EBEBEB]'
                )}>
                  <span className={cn(
                    'text-[11px] font-bold',
                    isActive ? 'text-white' : 'text-[#6A6A6A]'
                  )}>
                    {count}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Booking list */}
      {isLoading ? (
        <div className="flex flex-col gap-4 w-full">
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tabId={activeTab} />
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onCancel={setCancelId}
              onPay={(id) => createPayment(id)}
              onReview={(id) => setReviewBookingId(id)}
              isPayingThis={isCreatingPayment && payingBookingId === booking.id}
            />
          ))}
        </div>
      )}

      {/* Cancel modal */}
      {cancelId && (
        <CancelModal onConfirm={handleCancel} onClose={() => setCancelId(null)} isPending={isCancelling} />
      )}

      {/* Review modal */}
      {reviewBookingId && (
        <ReviewFormModal
          bookingId={reviewBookingId}
          propertyTitle={reviewPropertyTitle}
          onClose={() => setReviewBookingId(null)}
        />
      )}
    </div>
  );
}
