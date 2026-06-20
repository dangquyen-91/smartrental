'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Star,
  MapPin, Pencil, Check, X, Loader2, Plus, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useMyProperties } from '@/hooks/use-properties';
import { useLandlordBookings, useConfirmBooking, useRejectBooking, useLandlordRevenueStats } from '@/hooks/use-bookings';
import { useMyPropertiesReviews } from '@/hooks/use-reviews';
import { useMyContracts } from '@/hooks/use-contracts';
import type { Booking, Property } from '@/types';
import type { RevenuePeriod } from '@/lib/api/bookings.api';

function formatVnd(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'tr₫';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k₫';
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

function formatVndFull(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

const REVENUE_PERIOD_OPTIONS: { value: RevenuePeriod; label: string }[] = [
  { value: '3m', label: '3 tháng' },
  { value: '6m', label: '6 tháng' },
  { value: '1y', label: '1 năm' },
];

const STATUS_CONFIG: Record<Property['status'], { label: string; cls: string }> = {
  available:   { label: 'Còn trống',     cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  rented:      { label: 'Đang cho thuê', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  maintenance: { label: 'Bảo trì',       cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
};

const TYPE_LABEL: Record<Property['type'], string> = {
  room:      'Phòng trọ',
  apartment: 'Căn hộ',
  house:     'Nhà nguyên căn',
  studio:    'Studio',
};

function propertyThumb(p: Property) {
  return p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null;
}

function tenantName(b: Booking) {
  return typeof b.tenant === 'object' ? b.tenant.name : 'Người thuê';
}

function propertyTitle(b: Booking) {
  return typeof b.property === 'object' ? (b.property as Property).title : 'Phòng';
}

function propertyDistrict(b: Booking) {
  if (typeof b.property !== 'object') return '';
  const p = b.property as Property;
  return [p.address.district, p.address.city].filter(Boolean).join(', ');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function HostingPage() {
  const { user } = useAuth();
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('3m');

  const { data: propertiesData, isLoading: loadingProps } = useMyProperties();
  const { data: bookingsData, isLoading: loadingBookings } = useLandlordBookings();
  const { data: contractsData, isLoading: loadingContracts } = useMyContracts();
  const { data: revenueData, isLoading: loadingRevenue } = useLandlordRevenueStats(revenuePeriod);
  const { data: reviewsData, isLoading: loadingReviews } = useMyPropertiesReviews(1, 5);

  const confirmBooking = useConfirmBooking();
  const rejectBooking = useRejectBooking();

  const properties = useMemo(() => propertiesData?.data ?? [], [propertiesData]);
  const bookings   = useMemo(() => bookingsData?.data   ?? [], [bookingsData]);
  const contracts  = useMemo(() => contractsData?.data  ?? [], [contractsData]);

  const activeListings  = properties.filter((p) => p.status === 'available' || p.status === 'rented').length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeContracts = contracts.filter((c) => c.status === 'signed').length;

  const revenueTotals = revenueData?.data?.totals;

  const isLoading = loadingProps || loadingBookings || loadingContracts;

  const topPendingBookings = pendingBookings.slice(0, 3);
  const recentListings = useMemo(
    () => [...properties].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3),
    [properties],
  );

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-ink-black">
          Xin chào, {user?.name}!
        </h1>
        <Link
          href="/hosting/listings/new"
          className="flex shrink-0 items-center bg-[#ffef3d] hover:shadow-lg transition-all text-left py-2.5 px-4 gap-2 rounded-lg border-0"
        >
          <Plus className="size-4 text-[#1f1c00]" />
          <span className="text-[#1f1c00] text-sm font-bold">Đăng tin</span>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {/* Tin đăng */}
        <div className="flex flex-col items-start bg-white py-5 px-5 rounded-[14px] border border-solid border-[#DDDDDD]">
          <div className="flex items-center justify-center bg-[#FFF546] w-10 h-10 rounded-[10px] mb-3">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/6604c1e7-2829-4a5a-b8aa-0a38bfaa2f2b"
              className="w-5 h-5"
            />
          </div>
          <span className="text-[#222222] text-[25px] font-bold">
            {isLoading ? '—' : activeListings}
          </span>
          <span className="text-black text-[15px]">Tin đăng</span>
          <span className="text-[#929292] text-xs">đang hoạt động</span>
        </div>

        {/* Yêu cầu mới */}
        <div className="flex flex-col items-start bg-white py-5 px-5 rounded-[14px] border border-solid border-[#DDDDDD]">
          <div className="flex items-center justify-center bg-[#FFF546] w-10 h-10 rounded-[10px] mb-3">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/eb80edd1-27d8-43e8-99b2-24f6d1134620"
              className="w-5 h-5"
            />
          </div>
          <span className="text-[#222222] text-[25px] font-bold">
            {isLoading ? '—' : pendingBookings.length}
          </span>
          <span className="text-black text-[15px]">Yêu cầu mới</span>
          <span className="text-[#929292] text-xs">chờ xác nhận</span>
        </div>

        {/* Hợp đồng */}
        <div className="flex flex-col items-start bg-white py-5 px-5 rounded-[14px] border border-solid border-[#DDDDDD]">
          <div className="flex items-center justify-center bg-[#FFF546] w-10 h-10 rounded-[10px] mb-3">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/35719e8d-aac5-4d3f-9092-b50f3ecbabf2"
              className="w-5 h-5"
            />
          </div>
          <span className="text-[#222222] text-[25px] font-bold">
            {isLoading ? '—' : activeContracts}
          </span>
          <span className="text-black text-[15px]">Hợp đồng</span>
          <span className="text-[#929292] text-xs">đang hiệu lực</span>
        </div>

        {/* Doanh thu */}
        <div className="flex flex-col items-start bg-white py-5 px-5 rounded-[14px] border border-solid border-[#DDDDDD]">
          <div className="flex items-center justify-center bg-[#FFF546] w-10 h-10 rounded-[10px] mb-3">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a16acdd7-8ee3-4af2-89e1-4df5c8aa0248"
              className="w-4 h-4"
            />
          </div>
          <span className="text-[#222222] text-[25px] font-bold">
            {loadingRevenue
              ? '—'
              : formatVnd(
                  revenueTotals?.landlordPayout ??
                    revenueTotals?.grossRevenue ??
                    0,
                )}
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-black text-[15px]">Doanh thu</span>
            <select
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(e.target.value as RevenuePeriod)}
              className="text-[11px] text-[#6A6A6A] bg-transparent border border-solid border-[#DDDDDD] rounded-md px-1.5 py-0.5 cursor-pointer hover:border-[#ffef3d] focus:outline-none focus:border-[#ffef3d] w-fit"
            >
              {REVENUE_PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <span className="text-[#929292] text-[13px]">
            {loadingRevenue ? 'đang tải…' : `${revenueTotals?.bookingCount ?? 0} đơn đã thanh toán`}
          </span>
        </div>

        {/* Đánh giá */}
        <div className="col-span-2 md:col-span-1 flex flex-col items-start bg-white py-5 px-5 rounded-[14px] border border-solid border-[#DDDDDD]">
          <div className="flex items-center justify-center bg-[#FFF546] w-10 h-10 rounded-[10px] mb-3">
            <Star className="w-5 h-5 text-[#222222]" />
          </div>
          <span className="text-[#222222] text-[25px] font-bold">
            {loadingReviews
              ? '—'
              : reviewsData?.averageRating != null
              ? reviewsData.averageRating.toFixed(1)
              : '—'}
            <span className="text-[#929292] text-[15px] font-semibold ml-1">/5</span>
          </span>
          <span className="text-black text-[15px]">Đánh giá</span>
          <span className="text-[#929292] text-xs">
            {loadingReviews ? 'đang tải…' : `${reviewsData?.totalReviews ?? 0} lượt từ người thuê`}
          </span>
        </div>
      </div>

      {/* Pending bookings section */}
      {pendingBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#222222] mb-4">
            Yêu cầu thuê mới
          </h2>
          <div className="space-y-3">
            {topPendingBookings.map((b) => (
              <PendingBookingRow
                key={b.id}
                booking={b}
                onConfirm={() => confirmBooking.mutate(b.id)}
                onReject={(reason) => rejectBooking.mutate({ id: b.id, reason })}
                confirming={confirmBooking.isPending && confirmBooking.variables === b.id}
                rejecting={rejectBooking.isPending && (rejectBooking.variables as { id: string }).id === b.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Listings section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#222222]">
            Tin đăng của bạn
          </h2>
          {properties.length > 0 && (
            <Link href="/hosting/listings" className="flex items-center gap-1 text-xs font-semibold text-[#222222] hover:text-[#676000] transition-colors">
              Quản lý
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white py-4 px-4 rounded-[14px] border border-solid border-[#DDDDDD] animate-pulse flex gap-4">
                <div className="w-24 h-[72px] bg-[#F0F0F0] rounded-[10px]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#f0f0f0] rounded w-1/2" />
                  <div className="h-3 bg-[#f0f0f0] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : recentListings.length === 0 ? (
          <div className="bg-white py-8 px-4 rounded-[14px] border border-solid border-[#DDDDDD] text-center">
            <p className="text-[#6A6A6A] text-sm">Chưa có tin đăng nào</p>
            <Link href="/hosting/listings/new" className="text-[#222222] text-sm font-semibold hover:underline mt-2 inline-block">
              Đăng tin ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentListings.map((p) => (
              <ListingRow key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>

      {/* Latest reviews section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#222222]">
            Đánh giá mới nhất
          </h2>
          {reviewsData && reviewsData.totalReviews > 0 && (
            <Link href="/hosting/reviews" className="flex items-center gap-1 text-xs font-semibold text-[#222222] hover:text-[#676000] transition-colors">
              Xem tất cả
              <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
        {loadingReviews ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white py-4 px-4 rounded-[14px] border border-solid border-[#DDDDDD] animate-pulse flex gap-4">
                <div className="w-10 h-10 bg-[#F0F0F0] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#f0f0f0] rounded w-1/3" />
                  <div className="h-3 bg-[#f0f0f0] rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : !reviewsData || reviewsData.reviews.length === 0 ? (
          <div className="bg-white py-8 px-4 rounded-[14px] border border-solid border-[#DDDDDD] text-center">
            <p className="text-[#6A6A6A] text-sm">Chưa có đánh giá nào cho các tin đăng của bạn</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewsData.reviews.map((r, idx) => (
              <ReviewRow key={r._id ?? `review-${idx}`} review={r} />
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/hosting/listings/new" className="flex items-center bg-white py-5 px-5 rounded-[14px] border border-solid border-[#DDDDDD] hover:border-[#ffef3d] transition-colors">
          <div className="flex items-center justify-center bg-black w-10 h-10 rounded-[10px] mr-4">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/6f2ef548-2935-44f3-bebe-1d685810286d"
              className="w-5 h-5"
            />
          </div>
          <div className="flex-1">
            <p className="text-[#222222] text-[15px] font-bold">Đăng tin mới</p>
            <p className="text-[#6A6A6A] text-[13px]">Thêm phòng trọ, căn hộ vào danh sách</p>
          </div>
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b777aef4-890d-4c59-b792-b10152d003c5"
            className="w-4 h-4"
          />
        </Link>

        <Link href="/hosting/reservations" className="flex items-center bg-white py-5 px-5 rounded-[14px] border border-solid border-[#DDDDDD] hover:border-[#ffef3d] transition-colors">
          <div className="flex items-center justify-center bg-black w-10 h-10 rounded-[10px] mr-4">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/495abffe-7056-4f67-8362-507572babe5e"
              className="w-5 h-5"
            />
          </div>
          <div className="flex-1">
            <p className="text-[#222222] text-[15px] font-bold">Xem yêu cầu thuê</p>
            <p className="text-[#6A6A6A] text-[13px]">Xử lý yêu cầu thuê phòng từ người thuê</p>
          </div>
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/93adfafb-b831-4e03-bd60-fb8d8d020369"
            className="w-4 h-4"
          />
        </Link>
      </div>
    </div>
  );
}

// ─── ListingRow ───────────────────────────────────────────────────────────────

function ListingRow({ property: p }: { property: Property }) {
  const thumb = propertyThumb(p);
  const sc = STATUS_CONFIG[p.status];

  return (
    <div className="flex items-center bg-white py-4 px-4 gap-3 rounded-[14px] border border-solid border-[#DDDDDD]">
      {/* Thumbnail */}
      <div className="shrink-0 w-20 h-[60px] sm:w-24 sm:h-[72px] rounded-[10px] overflow-hidden bg-[#F0F0F0]">
        {thumb ? (
          <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[#222222] text-sm font-bold line-clamp-1 flex-1 min-w-0">
            {p.title}
          </span>
          <div className={cn('shrink-0 flex items-center py-0.5 px-2 rounded-full text-[11px] font-semibold', sc.cls)}>
            {sc.label}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#929292] shrink-0" />
          <span className="text-[#6A6A6A] text-xs truncate">
            {[p.address.district, p.address.city].filter(Boolean).join(', ')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-[#222222] text-sm font-bold truncate">
              {formatVndFull(p.price)}
            </span>
            <span className="text-[#929292] text-xs shrink-0">/tháng</span>
          </div>
          <Link
            href={`/hosting/listings/${p.id}/edit`}
            className="shrink-0 flex items-center gap-1 text-[#6A6A6A] text-xs font-bold hover:text-[#222222] transition-colors"
          >
            <Pencil className="w-3 h-3" />
            Sửa
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── ReviewRow ────────────────────────────────────────────────────────────────

import type { LandlordReview } from '@/lib/api/reviews.api';

function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= Math.round(value) ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#DDDDDD]'}
        />
      ))}
    </div>
  );
}

function ReviewRow({ review }: { review: LandlordReview }) {
  const reviewerInitial = review.reviewer?.name?.charAt(0).toUpperCase() ?? '?';
  const propertyTitle = review.target?.title ?? 'Phòng';
  const date = new Date(review.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="flex items-start self-stretch bg-white p-4 gap-3 rounded-[14px] border border-solid border-[#DDDDDD]">
      {/* Avatar */}
      <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-full bg-[#2683EB] text-white text-sm font-bold">
        {reviewerInitial}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[#222222] text-sm font-bold truncate">
            {review.reviewer?.name ?? 'Người dùng'}
          </span>
          <span className="text-[#929292] text-xs shrink-0">{date}</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <StarRating value={review.rating} />
          <span className="text-[#6A6A6A] text-xs">·</span>
          <span className="text-[#6A6A6A] text-xs truncate">{propertyTitle}</span>
        </div>
        {review.comment && (
          <p className="text-[#222222] text-sm leading-snug line-clamp-2">{review.comment}</p>
        )}
      </div>
    </div>
  );
}

// ─── PendingBookingRow ────────────────────────────────────────────────────────

function PendingBookingRow({
  booking: b,
  onConfirm, onReject,
  confirming, rejecting,
}: {
  booking: Booking;
  onConfirm: () => void;
  onReject: (reason: string) => void;
  confirming: boolean;
  rejecting: boolean;
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const busy = confirming || rejecting;

  const handleRejectConfirm = () => {
    onReject(rejectReason.trim());
    setShowRejectInput(false);
    setRejectReason('');
  };

  return (
    <div className="bg-white rounded-[14px] border border-solid border-[#DDDDDD]">
      <div className="flex flex-col p-4 gap-3">
        {/* Info */}
        <div className="flex-1 space-y-0.5">
          <span className="block text-[#222222] text-sm font-bold">{tenantName(b)}</span>
          <span className="block text-[#6A6A6A] text-xs line-clamp-1">{propertyTitle(b)}</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#929292] shrink-0" />
            <span className="text-[#929292] text-xs truncate">{propertyDistrict(b)}</span>
          </div>
          <span className="block text-[#929292] text-xs">
            {formatDate(b.startDate)} · {b.duration} tháng · {formatVnd(b.totalPrice)}
          </span>
        </div>

        {/* Actions */}
        {!showRejectInput && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={busy}
              className="flex items-center gap-1.5 py-2 px-3 rounded-lg border border-[#FF5E00] text-[#FF5E00] text-[13px] font-bold hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Từ chối
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="flex items-center gap-1.5 bg-[#ffef3d] py-2 px-3 rounded-lg text-[#1f1c00] text-[13px] font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {confirming
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Check className="w-3.5 h-3.5" />
              }
              {confirming ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        )}
        {showRejectInput && (
          <button
            onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
            className="self-start text-xs text-[#929292] hover:text-[#222222] transition-colors"
          >
            Hủy
          </button>
        )}
      </div>
      {showRejectInput && (
        <div className="px-4 pb-4 border-t border-[#F0F0F0] pt-3">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Lý do từ chối (không bắt buộc)..."
            rows={2}
            className="w-full text-sm border border-[#E5E5E5] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#FF5E00] transition-colors"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleRejectConfirm}
              disabled={rejecting}
              className="flex items-center gap-1.5 bg-[#FF5E00] text-white text-[13px] font-bold py-[7px] px-4 rounded-lg hover:bg-[#e05500] transition-colors disabled:opacity-50"
            >
              {rejecting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              {rejecting ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
