'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, RefreshCw, Banknote, Wrench, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminPendingPayouts,
  useAdminPendingRefunds,
  useMarkBookingPayout,
  useMarkBookingRefunded,
  useMarkServicePayout,
} from '@/hooks/use-admin';
import type { Booking, ServiceOrder, User, Property } from '@/types';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Tab = 'payouts' | 'refunds';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const getUser = (u: User | string | null | undefined): User | null => {
  if (!u || typeof u === 'string') return null;
  return u as User;
};

const getProperty = (p: Property | string | null | undefined): Property | null => {
  if (!p || typeof p === 'string') return null;
  return p as Property;
};

const SERVICE_TYPE_LABEL: Record<string, string> = {
  cleaning: 'Vệ sinh',
  repair: 'Sửa chữa',
  wifi: 'WiFi',
  moving: 'Chuyển nhà',
  painting: 'Sơn',
  registration: 'Đăng ký',
};

// ─── BankAccountCard ──────────────────────────────────────────────────────────

function BankAccountCard({ bank }: { bank: User['bankAccount'] }) {
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã copy ${label}`);
  };

  if (!bank?.bankName) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[#fff7ed] border border-[#fed7aa]">
        <AlertTriangle className="w-3.5 h-3.5 text-[#ea580c] shrink-0" />
        <span className="text-xs font-medium text-[#ea580c]">Chưa cài đặt tài khoản ngân hàng</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 rounded-[8px] bg-[#f0fdf4] border border-[#bbf7d0]">
      <span className="text-xs font-semibold text-[#15803d]">{bank.bankName}</span>
      <span className="text-[#bbf7d0]">·</span>
      <button
        onClick={() => copy(bank.accountNumber!, 'số tài khoản')}
        className="flex items-center gap-1 text-xs font-mono font-bold text-[#15803d] hover:text-[#166534] transition-colors group"
        title="Click để copy"
      >
        {bank.accountNumber}
        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <span className="text-[#bbf7d0]">·</span>
      <span className="text-xs text-[#166534]">{bank.accountName}</span>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BookingPayoutRow({ booking }: { booking: Booking }) {
  const markPayout = useMarkBookingPayout();
  const landlord = getUser(booking.landlord);
  const property = getProperty(booking.property);
  const landlordPayout = (booking as Booking & { landlordPayout?: number }).landlordPayout ?? 0;
  const platformFee   = (booking as Booking & { platformFee?: number }).platformFee ?? 0;

  return (
    <div className="px-5 py-4 border-b border-[#dddddd] last:border-0 space-y-3">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-full bg-[#fff0f3] flex items-center justify-center shrink-0 mt-0.5">
          <Banknote className="w-4 h-4 text-[#ff385c]" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-[#222222] truncate">{property?.title ?? '—'}</p>
          <p className="text-xs text-[#6a6a6a]">
            Chủ trọ: <span className="font-medium text-[#222222]">{landlord?.name ?? '—'}</span>
            {landlord?.email && <span className="text-[#929292]"> · {landlord.email}</span>}
            {landlord?.phone && <span className="text-[#929292]"> · {landlord.phone}</span>}
          </p>
          <BankAccountCard bank={landlord?.bankAccount} />
          <p className="text-xs text-[#929292]">Khách thanh toán: {fmtDate(booking.paidDate)}</p>
        </div>

        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-base font-bold text-[#ff385c]">{fmt(landlordPayout)}</p>
          <p className="text-xs text-[#929292]">Platform: {fmt(platformFee)}</p>
          <button
            onClick={() => markPayout.mutate(booking.id)}
            disabled={markPayout.isPending}
            className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[8px] bg-[#ff385c] text-white hover:bg-[#e00b41] transition-colors disabled:opacity-50"
          >
            {markPayout.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Đã chuyển
          </button>
        </div>
      </div>
    </div>
  );
}

function ServicePayoutRow({ order }: { order: ServiceOrder }) {
  const markPayout = useMarkServicePayout();
  const provider = getUser(order.assignedProvider);
  const property = getProperty(order.property);

  return (
    <div className="px-5 py-4 border-b border-[#dddddd] last:border-0 space-y-3">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-full bg-[#fefce8] flex items-center justify-center shrink-0 mt-0.5">
          <Wrench className="w-4 h-4 text-[#ca8a04]" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-[#222222]">
            {SERVICE_TYPE_LABEL[order.type] ?? order.type}
            {property?.title && <span className="font-normal text-[#6a6a6a]"> · {property.title}</span>}
          </p>
          <p className="text-xs text-[#6a6a6a]">
            Provider: <span className="font-medium text-[#222222]">{provider?.name ?? '—'}</span>
            {provider?.email && <span className="text-[#929292]"> · {provider.email}</span>}
            {provider?.phone && <span className="text-[#929292]"> · {provider.phone}</span>}
          </p>
          <BankAccountCard bank={provider?.bankAccount} />
          <p className="text-xs text-[#929292]">Lịch thực hiện: {fmtDate(order.scheduledAt)}</p>
        </div>

        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-base font-bold text-[#ca8a04]">{fmt(order.providerPayout ?? 0)}</p>
          <p className="text-xs text-[#929292]">Platform: {fmt(order.platformFee ?? 0)}</p>
          <button
            onClick={() => markPayout.mutate(order.id)}
            disabled={markPayout.isPending}
            className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[8px] bg-[#ca8a04] text-white hover:bg-[#a16207] transition-colors disabled:opacity-50"
          >
            {markPayout.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Đã chuyển
          </button>
        </div>
      </div>
    </div>
  );
}

function RefundRow({ booking }: { booking: Booking }) {
  const markRefunded = useMarkBookingRefunded();
  const tenant = getUser(booking.tenant);
  const property = getProperty(booking.property);

  return (
    <div className="px-5 py-4 border-b border-[#dddddd] last:border-0">
      <div className="flex items-start gap-4">
        <div className="w-9 h-9 rounded-full bg-[#fff5f5] flex items-center justify-center shrink-0 mt-0.5">
          <RefreshCw className="w-4 h-4 text-[#c13515]" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-[#222222] truncate">{property?.title ?? '—'}</p>
          <p className="text-xs text-[#6a6a6a]">
            Người thuê: <span className="font-medium text-[#222222]">{tenant?.name ?? '—'}</span>
            {tenant?.email && <span className="text-[#929292]"> · {tenant.email}</span>}
            {tenant?.phone && <span className="text-[#929292]"> · {tenant.phone}</span>}
          </p>
          <BankAccountCard bank={tenant?.bankAccount} />
          <p className="text-xs text-[#929292]">
            Huỷ lúc: {fmtDate(booking.updatedAt)}
            {booking.cancelReason && <span> · &ldquo;{booking.cancelReason}&rdquo;</span>}
          </p>
        </div>

        <div className="text-right shrink-0 space-y-0.5">
          <p className="text-base font-bold text-[#c13515]">{fmt(booking.totalPrice)}</p>
          <p className="text-xs text-[#929292]">Cọc: {fmt(booking.depositAmount ?? 0)}</p>
          <button
            onClick={() => markRefunded.mutate(booking.id)}
            disabled={markRefunded.isPending}
            className="mt-2 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-[8px] bg-[#c13515] text-white hover:bg-[#b32505] transition-colors disabled:opacity-50"
          >
            {markRefunded.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Đã hoàn tiền
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminTransactionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'payouts');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = searchParams.get('tab') as Tab;
    if (t === 'payouts' || t === 'refunds') setTab(t);
  }, [searchParams]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setPage(1);
    router.replace(`/admin/transactions?tab=${t}`, { scroll: false });
  };

  const payoutsQuery = useAdminPendingPayouts(page);
  const refundsQuery = useAdminPendingRefunds(page);

  const payoutsData = payoutsQuery.data?.data;
  const refundsData = refundsQuery.data;

  const TABS: { id: Tab; label: string; count?: number }[] = [
    {
      id: 'payouts',
      label: 'Chờ payout',
      count: payoutsData?.totalPending,
    },
    {
      id: 'refunds',
      label: 'Chờ hoàn tiền',
      count: refundsData?.pagination?.total,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">Giao dịch & Payout</h1>
        <p className="text-sm text-[#6a6a6a] mt-0.5">Xử lý thanh toán cho chủ trọ, provider và hoàn tiền người thuê</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#f7f7f7] p-1 rounded-[10px] w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-white text-[#222222] shadow-sm'
                : 'text-[#6a6a6a] hover:text-[#222222]',
            )}
          >
            {t.label}
            {(t.count ?? 0) > 0 && (
              <span className={cn(
                'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                tab === t.id ? 'bg-[#ff385c] text-white' : 'bg-[#dddddd] text-[#6a6a6a]',
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Payouts Tab */}
      {tab === 'payouts' && (
        <div className="space-y-4">
          {payoutsQuery.isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-[#ff385c]" />
            </div>
          ) : (
            <>
              {/* Booking payouts */}
              {(payoutsData?.bookings.items.length ?? 0) > 0 && (
                <div className="bg-white rounded-card border border-[#dddddd] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#dddddd] bg-[#f7f7f7] flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">
                      Payout chủ trọ — Booking
                    </p>
                    <span className="text-xs font-bold text-[#ff385c]">
                      {payoutsData?.bookings.total} chờ xử lý
                    </span>
                  </div>
                  {payoutsData?.bookings.items.map((b) => (
                    <BookingPayoutRow key={b.id} booking={b} />
                  ))}
                </div>
              )}

              {/* Service payouts */}
              {(payoutsData?.services.items.length ?? 0) > 0 && (
                <div className="bg-white rounded-card border border-[#dddddd] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#dddddd] bg-[#f7f7f7] flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">
                      Payout provider — Dịch vụ
                    </p>
                    <span className="text-xs font-bold text-[#ca8a04]">
                      {payoutsData?.services.total} chờ xử lý
                    </span>
                  </div>
                  {payoutsData?.services.items.map((s) => (
                    <ServicePayoutRow key={s.id} order={s} />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {(payoutsData?.totalPending ?? 0) === 0 && (
                <div className="bg-white rounded-card border border-[#dddddd] flex flex-col items-center justify-center h-48 gap-2">
                  <CheckCircle2 className="w-8 h-8 text-[#16a34a]" />
                  <p className="text-sm font-semibold text-[#222222]">Không có payout nào đang chờ</p>
                  <p className="text-xs text-[#6a6a6a]">Tất cả đã được xử lý.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Refunds Tab */}
      {tab === 'refunds' && (
        <div className="space-y-4">
          {refundsQuery.isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-[#ff385c]" />
            </div>
          ) : (
            <>
              {(refundsData?.data.length ?? 0) > 0 ? (
                <div className="bg-white rounded-card border border-[#dddddd] overflow-hidden">
                  <div className="px-5 py-3 border-b border-[#dddddd] bg-[#f7f7f7] flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">
                      Hoàn tiền người thuê — Booking đã huỷ
                    </p>
                    <span className="text-xs font-bold text-[#c13515]">
                      {refundsData?.pagination?.total} chờ xử lý
                    </span>
                  </div>
                  {refundsData?.data.map((b) => (
                    <RefundRow key={b.id} booking={b} />
                  ))}

                  {/* Pagination */}
                  {refundsData?.pagination && refundsData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-[#dddddd] bg-[#f7f7f7]">
                      <p className="text-xs text-[#6a6a6a]">
                        {(page - 1) * 20 + 1}–{Math.min(page * 20, refundsData.pagination.total)} /{' '}
                        {refundsData.pagination.total}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="px-3 py-1.5 rounded-[8px] border border-[#dddddd] text-xs hover:bg-white disabled:opacity-40 transition-colors"
                        >
                          Trước
                        </button>
                        <span className="px-3 py-1.5 text-xs text-[#6a6a6a]">
                          {page} / {refundsData.pagination.totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(refundsData.pagination.totalPages, p + 1))}
                          disabled={page >= refundsData.pagination.totalPages}
                          className="px-3 py-1.5 rounded-[8px] border border-[#dddddd] text-xs hover:bg-white disabled:opacity-40 transition-colors"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-card border border-[#dddddd] flex flex-col items-center justify-center h-48 gap-2">
                  <CheckCircle2 className="w-8 h-8 text-[#16a34a]" />
                  <p className="text-sm font-semibold text-[#222222]">Không có hoàn tiền nào đang chờ</p>
                  <p className="text-xs text-[#6a6a6a]">Tất cả booking đã được xử lý.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
