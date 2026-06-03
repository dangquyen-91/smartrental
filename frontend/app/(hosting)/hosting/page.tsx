'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  MapPin, Pencil, Check, X, Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMyProperties } from '@/hooks/use-properties';
import { useLandlordBookings, useConfirmBooking, useRejectBooking } from '@/hooks/use-bookings';
import { useMyContracts } from '@/hooks/use-contracts';
import type { Booking, Property } from '@/types';

function formatVnd(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'tr₫';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k₫';
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

function formatVndFull(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

const STATUS_CONFIG: Record<Property['status'], { label: string; cls: string }> = {
  available:   { label: 'Còn trống',     cls: 'bg-[#FFF546] text-black' },
  rented:      { label: 'Đang cho thuê', cls: 'bg-blue-50 text-blue-700' },
  maintenance: { label: 'Bảo trì',       cls: 'bg-amber-50 text-amber-700' },
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

  const { data: propertiesData, isLoading: loadingProps } = useMyProperties();
  const { data: bookingsData, isLoading: loadingBookings } = useLandlordBookings();
  const { data: contractsData, isLoading: loadingContracts } = useMyContracts();

  const confirmBooking = useConfirmBooking();
  const rejectBooking = useRejectBooking();

  const properties = useMemo(() => propertiesData?.data ?? [], [propertiesData]);
  const bookings   = useMemo(() => bookingsData?.data   ?? [], [bookingsData]);
  const contracts  = useMemo(() => contractsData?.data  ?? [], [contractsData]);

  const activeListings  = properties.filter((p) => p.status === 'available' || p.status === 'rented').length;
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeContracts = contracts.filter((c) => c.status === 'signed').length;

  const monthRevenue = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => {
        if (b.paymentStatus !== 'paid') return false;
        const d = new Date(b.paidDate ?? b.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((sum, b) => sum + (b.landlordPayout ?? b.totalPrice * 0.9), 0);
  }, [bookings]);

  const isLoading = loadingProps || loadingBookings || loadingContracts;

  const topPendingBookings = pendingBookings.slice(0, 3);
  const recentListings = useMemo(
    () => [...properties].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3),
    [properties],
  );

  return (
    <>
      {/* Welcome section */}
      <div className="flex justify-between items-start self-stretch mb-4 w-full">
        <div className="flex flex-col shrink-0 items-center pb-[23px]">
          <span className="text-[#222222] text-[25px] font-bold">
            Xin chào, {user?.name}!
          </span>
        </div>
        <Link
          href="/hosting/listings/new"
          className="flex shrink-0 items-center bg-[#2683EB] text-left py-2.5 px-4 gap-2 rounded-lg border-0"
        >
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/76cd3957-c0df-44d3-87a2-4e397b09f0d7"
            className="w-4 h-4 rounded-lg object-fill"
          />
          <span className="text-white text-sm font-bold">Đăng tin</span>
        </Link>
      </div>

      <span className="text-black text-xl mb-6">
        Dưới đây là tổng quan hoạt động cho thuê của bạn.
      </span>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
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
            {isLoading ? '—' : formatVnd(monthRevenue)}
          </span>
          <span className="text-black text-[15px]">Doanh thu</span>
          <span className="text-[#929292] text-[13px]">tháng này</span>
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
                onReject={() => rejectBooking.mutate({ id: b.id })}
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
            <Link href="/hosting/listings" className="flex items-center gap-1.5">
              <span className="text-[#2683EB] text-xs font-bold">Quản lý</span>
              <img
                src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/dab1d7c7-395b-40e0-be15-7e92fcc9ce3a"
                className="w-3 h-3 object-fill"
              />
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
            <Link href="/hosting/listings/new" className="text-[#2683EB] text-sm font-semibold hover:underline mt-2 inline-block">
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

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/hosting/listings/new" className="flex items-center bg-white py-5 px-5 rounded-[14px] border border-solid border-[#DDDDDD] hover:border-[#2683EB] transition-colors">
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

        <Link href="/hosting/reservations" className="flex items-center bg-white py-5 px-5 rounded-[14px] border border-solid border-[#DDDDDD] hover:border-[#2683EB] transition-colors">
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
    </>
  );
}

// ─── ListingRow ───────────────────────────────────────────────────────────────

function ListingRow({ property: p }: { property: Property }) {
  const thumb = propertyThumb(p);
  const sc = STATUS_CONFIG[p.status];

  return (
    <div className="flex items-center self-stretch bg-white py-[17px] px-4 mb-[13px] gap-4 rounded-[14px] border border-solid border-[#DDDDDD]">
      {/* Thumbnail */}
      <div className="flex flex-col shrink-0 items-center bg-[#F0F0F0] rounded-[10px]">
        {thumb ? (
          <img src={thumb} alt={p.title} className="w-24 h-[72px] rounded-[10px] object-fill" />
        ) : (
          <div className="w-24 h-[72px]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 pb-0.5">
        <div className="flex justify-between items-center self-stretch mb-[1px]">
          <span className="text-[#222222] text-sm font-bold">
            {p.title}
          </span>
          <div className="flex flex-col shrink-0 items-start bg-[#FFF546] py-[1px] px-2 rounded-[26843500px]">
            <span className="text-black text-xs">{sc.label}</span>
          </div>
        </div>
        <div className="flex items-center self-stretch gap-1">
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/605a3c1c-1b1a-4f94-9d58-9c972afe58cd"
            className="w-3 h-3 object-fill"
          />
          <span className="text-[#6A6A6A] text-xs">
            {[p.address.district, p.address.city].filter(Boolean).join(', ')}
          </span>
        </div>
        <div className="flex justify-between items-center self-stretch py-[7px]">
          <div className="flex shrink-0 items-center py-0.5">
            <span className="text-[#222222] text-sm font-bold mr-[3px]">
              {formatVndFull(p.price)}
            </span>
            <span className="text-[#929292] text-xs mr-[11px]">/tháng</span>
            <span className="text-[#929292] text-xs mr-[11px]">{TYPE_LABEL[p.type]}</span>
          </div>
          <Link
            href={`/hosting/listings/${p.id}/edit`}
            className="flex shrink-0 items-center gap-1.5"
          >
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a72a3ecd-3607-495d-80cc-8e59dd8e6f78"
              className="w-3.5 h-3.5 object-fill"
            />
            <span className="text-[#6A6A6A] text-xs font-bold hover:text-[#222222] transition-colors">
              Chỉnh sửa
            </span>
          </Link>
        </div>
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
  onReject: () => void;
  confirming: boolean;
  rejecting: boolean;
}) {
  const busy = confirming || rejecting;

  return (
    <div className="flex items-start self-stretch bg-white p-4 gap-[1px] rounded-[14px] border border-solid border-[#DDDDDD]">
      <div className="flex-1">
        <div className="flex flex-col items-start self-stretch mb-[1px]">
          <span className="text-[#222222] text-sm font-bold">
            {tenantName(b)}
          </span>
        </div>
        <div className="flex flex-col items-start self-stretch">
          <span className="text-[#6A6A6A] text-xs">
            {propertyTitle(b)}
          </span>
        </div>
        <div className="flex items-center self-stretch mb-[1px] gap-1">
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/e83ddeae-4471-4cc3-998a-49fb38ee3bb4"
            className="w-3 h-3 object-fill"
          />
          <span className="text-[#929292] text-xs">
            {propertyDistrict(b)}
          </span>
        </div>
        <div className="flex flex-col items-start self-stretch pt-0.5">
          <span className="text-[#929292] text-xs">
            {formatDate(b.startDate)} · {b.duration} tháng · {formatVnd(b.totalPrice)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-[9px]">
        <button
          onClick={onReject}
          disabled={busy}
          className="flex shrink-0 items-center bg-white text-left py-[7px] px-[13px] gap-1.5 rounded-lg border border-solid border-[#FF5E00] hover:bg-orange-50 transition-colors disabled:opacity-50"
        >
          {rejecting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF5E00]" />
          ) : (
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/6e5e0b5b-a94d-4cf0-aa87-0ed7d9200465"
              className="w-3.5 h-3.5 rounded-lg object-fill"
            />
          )}
          <span className="text-[#FF5E00] text-[13px] font-bold">
            {rejecting ? 'Đang xử lý...' : 'Từ chối'}
          </span>
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="flex shrink-0 items-center bg-[#2683EB] text-left py-[7px] px-3 gap-1.5 rounded-lg border-0 hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {confirming ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/41826c94-9585-444c-ac7c-90717780594b"
              className="w-3.5 h-3.5 rounded-lg object-fill"
            />
          )}
          <span className="text-white text-[13px] font-bold">
            {confirming ? 'Đang xử lý...' : 'Xác nhận'}
          </span>
        </button>
      </div>
    </div>
  );
}
