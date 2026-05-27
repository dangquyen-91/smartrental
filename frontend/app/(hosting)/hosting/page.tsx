'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Building2, ClipboardList, FileText, CreditCard,
  Plus, ArrowRight, MapPin, Pencil, Check, X, Loader2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMyProperties } from '@/hooks/use-properties';
import { useLandlordBookings, useConfirmBooking, useRejectBooking } from '@/hooks/use-bookings';
import { useMyContracts } from '@/hooks/use-contracts';
import { cn } from '@/lib/utils';
import type { Booking, Property } from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'tr₫';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k₫';
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

function formatVndFull(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

const STATUS_CONFIG: Record<Property['status'], { label: string; cls: string }> = {
  available:   { label: 'Còn trống',     cls: 'bg-emerald-50 text-emerald-700' },
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

// ─── stat skeleton ────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="bg-white rounded-[14px] border border-[#dddddd] p-5 animate-pulse">
      <div className="w-10 h-10 rounded-[10px] bg-[#f0f0f0] mb-3" />
      <div className="h-7 w-16 bg-[#f0f0f0] rounded mb-1.5" />
      <div className="h-3 w-20 bg-[#f0f0f0] rounded mb-1" />
      <div className="h-3 w-14 bg-[#f0f0f0] rounded" />
    </div>
  );
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

  // ── stats ────────────────────────────────────────────────────────────────────

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

  const STATS = [
    {
      label: 'Tin đăng', value: isLoading ? null : activeListings,
      sub: 'đang hoạt động', icon: Building2, color: 'text-[#933a12]', bg: 'bg-[#fff0f3]',
    },
    {
      label: 'Yêu cầu mới', value: isLoading ? null : pendingBookings.length,
      sub: 'chờ xác nhận', icon: ClipboardList, color: 'text-[#2563eb]', bg: 'bg-[#eff6ff]',
    },
    {
      label: 'Hợp đồng', value: isLoading ? null : activeContracts,
      sub: 'đang hiệu lực', icon: FileText, color: 'text-[#16a34a]', bg: 'bg-[#f0fdf4]',
    },
    {
      label: 'Doanh thu', value: isLoading ? null : formatVnd(monthRevenue),
      sub: 'tháng này', icon: CreditCard, color: 'text-[#d97706]', bg: 'bg-[#fffbeb]',
    },
  ];

  // ── derived lists ─────────────────────────────────────────────────────────────

  const recentListings = useMemo(
    () => [...properties].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [properties],
  );

  const topPendingBookings = pendingBookings.slice(0, 3);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#222222]">Chào, {user?.name}!</h1>
          <p className="text-sm text-[#6a6a6a] mt-1">Đây là tổng quan hoạt động cho thuê của bạn.</p>
        </div>
        <Link
          href="/hosting/listings/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#933a12] hover:bg-[#7a2f0e] rounded-[8px] transition-all active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Đăng tin
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? [1,2,3,4].map((i) => <StatSkeleton key={i} />)
          : STATS.map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-[14px] border border-[#dddddd] p-5">
              <div className={`w-10 h-10 rounded-[10px] ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-[#222222]">{value ?? '—'}</p>
              <p className="text-xs font-medium text-[#6a6a6a] mt-0.5">{label}</p>
              <p className="text-xs text-[#929292]">{sub}</p>
            </div>
          ))
        }
      </div>

      {/* Pending booking requests */}
      {(loadingBookings || pendingBookings.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#222222]">Yêu cầu thuê mới</h2>
            {pendingBookings.length > 3 && (
              <Link href="/hosting/reservations" className="text-xs font-semibold text-[#933a12] hover:underline flex items-center gap-1">
                Xem tất cả <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {loadingBookings ? (
            <div className="space-y-3">
              {[1,2].map((i) => (
                <div key={i} className="bg-white rounded-[14px] border border-[#dddddd] p-4 animate-pulse flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-1/3 bg-[#f0f0f0] rounded" />
                    <div className="h-3 w-1/2 bg-[#f0f0f0] rounded" />
                    <div className="h-3 w-1/4 bg-[#f0f0f0] rounded" />
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-20 h-8 bg-[#f0f0f0] rounded-lg" />
                    <div className="w-20 h-8 bg-[#f0f0f0] rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
              {pendingBookings.length > 3 && (
                <Link
                  href="/hosting/reservations"
                  className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#933a12] bg-white border border-[#dddddd] rounded-[14px] hover:border-[#933a12] transition-colors"
                >
                  Xem {pendingBookings.length - 3} yêu cầu còn lại <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </section>
      )}

      {/* Listings section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#222222]">Tin đăng của bạn</h2>
          {properties.length > 0 && (
            <Link href="/hosting/listings" className="text-xs font-semibold text-[#933a12] hover:underline flex items-center gap-1">
              Quản lý <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {loadingProps ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-[14px] border border-[#dddddd] p-4 flex gap-4 animate-pulse">
                <div className="w-24 h-18 rounded-[10px] bg-[#f0f0f0] shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 w-2/3 bg-[#f0f0f0] rounded" />
                  <div className="h-3 w-1/2 bg-[#f0f0f0] rounded" />
                  <div className="h-3 w-1/4 bg-[#f0f0f0] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : recentListings.length === 0 ? (
          <div className="bg-white rounded-[14px] border border-[#dddddd] p-10 text-center">
            <Building2 className="w-10 h-10 text-[#dddddd] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#222222]">Chưa có tin đăng nào</p>
            <p className="text-xs text-[#6a6a6a] mt-1 mb-5">
              Đăng tin để tiếp cận hàng nghìn người thuê trên SmartRental.
            </p>
            <Link
              href="/hosting/listings/new"
              className="inline-block px-5 py-2.5 text-sm font-semibold text-white bg-[#933a12] hover:bg-[#7a2f0e] rounded-[8px] transition-all active:scale-95"
            >
              Đăng tin ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentListings.map((p) => (
              <ListingRow key={p.id} property={p} />
            ))}
            {properties.length > 5 && (
              <Link
                href="/hosting/listings"
                className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[#222222] bg-white border border-[#dddddd] rounded-[14px] hover:border-[#222222] transition-colors"
              >
                Xem tất cả {properties.length} tin đăng <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Đăng tin mới', desc: 'Thêm phòng trọ, căn hộ vào danh sách', href: '/hosting/listings/new', icon: Plus },
          { label: 'Xem yêu cầu thuê', desc: 'Xử lý booking requests từ người thuê', href: '/hosting/reservations', icon: ClipboardList },
        ].map(({ label, desc, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-[14px] border border-[#dddddd] p-5 hover:border-[#933a12] hover:shadow-[0_2px_12px_rgba(255,56,92,0.08)] transition-all group"
          >
            <div className="w-10 h-10 rounded-[10px] bg-[#f7f8f0] flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[#6a6a6a] group-hover:text-[#933a12] transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#222222]">{label}</p>
              <p className="text-xs text-[#6a6a6a] mt-0.5">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#929292] group-hover:text-[#933a12] transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── ListingRow ───────────────────────────────────────────────────────────────

function ListingRow({ property: p }: { property: Property }) {
  const thumb = propertyThumb(p);
  const sc = STATUS_CONFIG[p.status];

  return (
    <div className="bg-white rounded-[14px] border border-[#dddddd] p-4 flex gap-4 hover:border-[#cccccc] transition-colors">
      {/* Thumbnail */}
      <div className="w-24 h-18 rounded-[10px] bg-[#f0f0f0] shrink-0 overflow-hidden">
        {thumb
          ? <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
          : <Building2 className="w-6 h-6 text-[#cccccc] m-auto mt-4" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[#222222] truncate">{p.title}</p>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', sc.cls)}>
            {sc.label}
          </span>
        </div>
        <p className="text-xs text-[#6a6a6a] mt-0.5 flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          {[p.address.district, p.address.city].filter(Boolean).join(', ')}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="text-sm font-bold text-[#222222]">{formatVndFull(p.price)}</span>
            <span className="text-xs text-[#929292]">/tháng</span>
            <span className="text-xs text-[#929292] ml-2">{TYPE_LABEL[p.type]}</span>
          </div>
          <Link
            href={`/hosting/listings/${p.id}/edit`}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6a6a6a] hover:text-[#222222] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Chỉnh sửa
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
    <div className="bg-white rounded-[14px] border border-[#dddddd] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#222222] truncate">{tenantName(b)}</p>
          <p className="text-xs text-[#6a6a6a] mt-0.5 truncate">{propertyTitle(b)}</p>
          {propertyDistrict(b) && (
            <p className="text-xs text-[#929292] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />{propertyDistrict(b)}
            </p>
          )}
          <p className="text-xs text-[#929292] mt-1">
            {formatDate(b.startDate)} · {b.duration} tháng ·{' '}
            <span className="font-semibold text-[#222222]">{formatVnd(b.totalPrice)}</span>
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={onReject}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#c13515] bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-colors disabled:opacity-50"
          >
            {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            Từ chối
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#933a12] hover:bg-[#7a2f0e] rounded-lg transition-colors disabled:opacity-50"
          >
            {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
