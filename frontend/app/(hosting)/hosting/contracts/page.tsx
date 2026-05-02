'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Home,
  Download,
  PenLine,
  Loader2,
  MapPin,
  CalendarDays,
  User,
  Plus,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyContracts, useGenerateContract, useSignContract } from '@/hooks/use-contracts';
import { useLandlordBookings } from '@/hooks/use-bookings';
import {
  STATUS_CONFIG,
  TABS,
  type TabId,
  formatDate,
  getPrimaryImage,
  asUser,
  asProperty,
  asBooking,
  downloadContractPdf,
} from '@/lib/contract-utils';
import { ContractCardSkeleton } from '@/components/ui/skeleton';
import { SignatureBadge } from '@/components/shared/signature-badge';
import { SignModal } from '@/components/shared/sign-modal';
import type { Contract, Booking } from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

// ─── contract card ────────────────────────────────────────────────────────────

function ContractCard({
  contract,
  onSign,
  isSigningThis,
}: {
  contract: Contract;
  onSign: (contract: Contract) => void;
  isSigningThis: boolean;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const property = asProperty(contract.property);
  const tenant = asUser(contract.tenant);
  const imgUrl = property ? getPrimaryImage(property) : null;
  const address = property
    ? [property.address?.district, property.address?.city].filter(Boolean).join(', ')
    : '';

  const statusCfg = STATUS_CONFIG[contract.status];
  const canSign = contract.status === 'awaiting_signatures' && !contract.signedByLandlord.signed;

  return (
    <article className="flex flex-col sm:flex-row gap-4 border border-[#dddddd] rounded-card p-4 sm:p-5 bg-white hover:shadow-[rgba(0,0,0,0.06)_0_2px_12px] transition-shadow">
      <div className="size-25 sm:size-30 rounded-[10px] overflow-hidden shrink-0 bg-[#f7f7f7]">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl} alt={property?.title ?? ''} className="size-full object-cover" loading="lazy" />
        ) : (
          <div className="size-full flex items-center justify-center">
            <Home className="size-8 text-[#dddddd]" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-[#222222] leading-snug line-clamp-2">
            {property?.title ?? 'Hợp đồng thuê phòng'}
          </h3>
          <span className={cn('shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full', statusCfg.className)}>
            {statusCfg.label}
          </span>
        </div>

        {address && (
          <p className="flex items-center gap-1 text-sm text-[#6a6a6a]">
            <MapPin className="size-3.5 shrink-0" />
            {address}
          </p>
        )}

        {tenant && (
          <p className="flex items-center gap-1.5 text-sm text-[#6a6a6a]">
            <User className="size-3.5 shrink-0" />
            Khách thuê: <span className="text-[#222222] font-medium ml-0.5">{tenant.name}</span>
          </p>
        )}

        <p className="flex items-center gap-1.5 text-sm text-[#6a6a6a]">
          <CalendarDays className="size-3.5 shrink-0" />
          Tạo ngày {formatDate(contract.createdAt)}
        </p>

        <div className="flex flex-wrap gap-2 mt-0.5">
          <SignatureBadge label="Bạn" signed={contract.signedByLandlord.signed} signedAt={contract.signedByLandlord.signedAt} />
          <SignatureBadge label="Khách thuê" signed={contract.signedByTenant.signed} signedAt={contract.signedByTenant.signedAt} />
        </div>

        <div className="flex items-center justify-end gap-2 mt-auto pt-3 border-t border-[#dddddd]">
          {contract.pdfUrl && (
            <button
              onClick={async () => {
                setIsDownloading(true);
                await downloadContractPdf(contract.id, `hop-dong-${contract.id}.pdf`);
                setIsDownloading(false);
              }}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#222222] border border-[#dddddd] hover:bg-[#f7f7f7] disabled:opacity-60 rounded-lg transition-colors"
            >
              {isDownloading ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              Tải PDF
            </button>
          )}
          {canSign && (
            <button
              onClick={() => onSign(contract)}
              disabled={isSigningThis}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] disabled:opacity-60 rounded-lg transition-all active:scale-95"
            >
              {isSigningThis ? <Loader2 className="size-3.5 animate-spin" /> : <PenLine className="size-3.5" />}
              Ký hợp đồng
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── generate contract modal ──────────────────────────────────────────────────

function GenerateModal({
  existingContractBookingIds,
  onClose,
  onSuccess,
}: {
  existingContractBookingIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [terms, setTerms] = useState('');

  const { data: bookingsData, isLoading: loadingBookings } = useLandlordBookings();
  const { mutate: generate, isPending } = useGenerateContract();

  const eligibleBookings = useMemo<Booking[]>(() => {
    const all = bookingsData?.data ?? [];
    return all.filter(
      (b) =>
        (b.status === 'confirmed' || b.status === 'active') &&
        b.paymentStatus === 'paid' &&
        !existingContractBookingIds.has(b.id),
    );
  }, [bookingsData?.data, existingContractBookingIds]);

  const selectedBooking = useMemo(
    () => eligibleBookings.find((b) => b.id === selectedBookingId) ?? null,
    [eligibleBookings, selectedBookingId],
  );

  const handleSubmit = () => {
    if (!selectedBookingId) return;
    generate({ bookingId: selectedBookingId, terms: terms.trim() || undefined }, { onSuccess });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-panel p-6 w-full max-w-lg shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_8px_32px_0]">
        <button onClick={onClose} className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-[#f7f7f7] hover:bg-[#dddddd] transition-colors">
          <X className="size-4 text-[#222222]" />
        </button>

        <div className="size-12 bg-[#f7f7f7] rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="size-6 text-[#222222]" />
        </div>
        <h3 className="text-[17px] font-semibold text-[#222222] text-center mb-1">Tạo hợp đồng mới</h3>
        <p className="text-sm text-[#6a6a6a] text-center mb-6">
          Chọn đặt phòng đã xác nhận và thanh toán để tạo hợp đồng điện tử.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#222222] mb-2">Đặt phòng</label>
          {loadingBookings ? (
            <div className="h-11 bg-[#f7f7f7] animate-pulse rounded-lg" />
          ) : eligibleBookings.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">
                Không có đặt phòng nào đủ điều kiện. Booking cần được xác nhận, đã thanh toán và chưa có hợp đồng.
              </p>
            </div>
          ) : (
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="w-full h-11 px-3 text-sm text-[#222222] bg-white border border-[#dddddd] rounded-lg focus:outline-none focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/10 transition-colors"
            >
              <option value="">-- Chọn đặt phòng --</option>
              {eligibleBookings.map((b) => {
                const prop = asProperty(b.property);
                const t = asUser(b.tenant);
                return (
                  <option key={b.id} value={b.id}>
                    {prop?.title ?? 'Phòng'} · {t?.name ?? 'Khách'} · {formatDate(b.startDate)} – {formatDate(b.endDate)} · {formatVnd(b.totalPrice)}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {selectedBooking && (
          <div className="mb-4 p-3 bg-[#f7f7f7] rounded-[10px] text-sm text-[#6a6a6a] space-y-1">
            {(() => {
              const prop = asProperty(selectedBooking.property);
              const t = asUser(selectedBooking.tenant);
              return (
                <>
                  {prop && <p className="font-medium text-[#222222]">{prop.title}</p>}
                  {t && <p>Khách thuê: {t.name}</p>}
                  <p>{formatDate(selectedBooking.startDate)} – {formatDate(selectedBooking.endDate)} ({selectedBooking.duration} tháng)</p>
                  <p className="font-medium text-[#222222]">{formatVnd(selectedBooking.totalPrice)}</p>
                </>
              );
            })()}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#222222] mb-2">
            Điều khoản bổ sung <span className="text-[#6a6a6a] font-normal">(tuỳ chọn)</span>
          </label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Nhập các điều khoản bổ sung cho hợp đồng..."
            className="w-full px-3 py-2.5 text-sm text-[#222222] placeholder:text-[#929292] bg-white border border-[#dddddd] rounded-lg resize-none focus:outline-none focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/10 transition-colors"
          />
          <p className="text-xs text-[#929292] text-right mt-1">{terms.length}/2000</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f7f7] transition-colors">
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedBookingId || isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="size-4 animate-spin" />
                Đang tạo...
              </span>
            ) : 'Tạo hợp đồng'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

const EMPTY_CONFIG: Record<TabId, { message: string; sub: string }> = {
  pending:   { message: 'Chưa có hợp đồng chờ ký',    sub: 'Tạo hợp đồng từ đặt phòng đã xác nhận và thanh toán để bắt đầu.' },
  signed:    { message: 'Chưa có hợp đồng hoàn thành', sub: 'Hợp đồng hoàn tất khi cả hai bên đã ký sẽ lưu ở đây.' },
  cancelled: { message: 'Không có hợp đồng bị huỷ',    sub: 'Các hợp đồng đã huỷ sẽ được lưu ở đây.' },
};

function EmptyState({ tabId, onGenerate }: { tabId: TabId; onGenerate: () => void }) {
  const { message, sub } = EMPTY_CONFIG[tabId];
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="size-16 bg-[#f7f7f7] rounded-full flex items-center justify-center mb-4">
        <FileText className="size-8 text-[#dddddd]" />
      </div>
      <h2 className="text-lg font-semibold text-[#222222] mb-2">{message}</h2>
      <p className="text-sm text-[#6a6a6a] mb-6 max-w-xs leading-relaxed">{sub}</p>
      {tabId === 'pending' && (
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-lg transition-all active:scale-95"
        >
          <Plus className="size-4" />
          Tạo hợp đồng
        </button>
      )}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function HostingContractsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const { data, isLoading } = useMyContracts();
  const { mutate: signContract, isPending: isSigning, variables: signingId } = useSignContract();

  const allContracts = useMemo<Contract[]>(() => data?.data ?? [], [data?.data]);

  const { filtered, tabCounts, existingContractBookingIds } = useMemo(() => {
    const counts = Object.fromEntries(TABS.map((t) => [t.id, 0])) as Record<TabId, number>;
    const filteredContracts: Contract[] = [];
    const bookingIds = new Set<string>();

    for (const c of allContracts) {
      const b = asBooking(c.booking);
      if (b) bookingIds.add(b.id);
      else if (typeof c.booking === 'string') bookingIds.add(c.booking);

      for (const tab of TABS) {
        if (tab.statuses.includes(c.status)) {
          counts[tab.id]++;
          if (tab.id === activeTab) filteredContracts.push(c);
          break;
        }
      }
    }
    return { filtered: filteredContracts, tabCounts: counts, existingContractBookingIds: bookingIds };
  }, [allContracts, activeTab]);

  const handleSign = (onSuccess: () => void) => {
    if (!signingContract) return;
    signContract(signingContract.id, { onSuccess });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#222222]">Hợp đồng</h1>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-lg transition-all active:scale-95 shrink-0"
        >
          <Plus className="size-4" />
          Tạo hợp đồng
        </button>
      </div>

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
              <span className={cn(
                'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-[#222222] text-white' : 'bg-[#ebebeb] text-[#6a6a6a]',
              )}>
                {tabCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <ContractCardSkeleton />
          <ContractCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tabId={activeTab} onGenerate={() => setShowGenerateModal(true)} />
      ) : (
        <div className="space-y-4">
          {filtered.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onSign={setSigningContract}
              isSigningThis={isSigning && signingId === contract.id}
            />
          ))}
        </div>
      )}

      {signingContract && (
        <SignModal
          contract={signingContract}
          onConfirm={handleSign}
          onClose={() => setSigningContract(null)}
          isPending={isSigning}
        />
      )}

      {showGenerateModal && (
        <GenerateModal
          existingContractBookingIds={existingContractBookingIds}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
}
