'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Home,
  Download,
  PenLine,
  Loader2,
  Plus,
  AlertCircle,
  X,
  ChevronDown,
  Banknote,
  Hourglass,
  MapPin,
  User,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
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

const PAYMENT_CONFIG: Record<Booking['paymentStatus'], { label: string; className: string }> = {
  unpaid:   { label: 'Chưa thanh toán', className: 'text-amber-600' },
  paid:     { label: 'Đã thanh toán',   className: 'text-emerald-600' },
  refunded: { label: 'Đã hoàn tiền',    className: 'text-blue-600' },
};

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
  const booking = asBooking(contract.booking);
  const imgUrl = property ? getPrimaryImage(property) : null;

  const statusCfg = STATUS_CONFIG[contract.status];
  const canSign = contract.status === 'awaiting_signatures' && !contract.signedByLandlord.signed;

  const paymentCfg = booking ? PAYMENT_CONFIG[booking.paymentStatus] : null;

  return (
    <div className="flex items-start self-stretch bg-white py-[21px] px-5 gap-4 rounded-[14px] border border-solid border-[#DDDDDD]">
      {/* Property image */}
      <div className="shrink-0 rounded-[10px] overflow-hidden bg-[#F7F7F7]">
        {imgUrl ? (
          <img src={imgUrl} alt={property?.title ?? ''} className="w-16 h-16 sm:w-[120px] sm:h-[120px] object-cover" loading="lazy" />
        ) : (
          <div className="w-16 h-16 sm:w-[120px] sm:h-[120px] flex items-center justify-center">
            <Home className="size-8 text-[#929292]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* Title row + status */}
        <div className="flex justify-between items-center self-stretch mb-2">
          <span className="text-[#222222] text-[15px] font-bold line-clamp-2">
            {property?.title ?? 'Hợp đồng thuê phòng'}
          </span>
          <div className={cn('shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full', statusCfg.className)}>
            {statusCfg.label}
          </div>
        </div>

        {/* Address */}
        {property && (
          <div className="flex items-center self-stretch mb-[7px] gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#6A6A6A]" />
            <span className="text-[#6A6A6A] text-sm">
              {[property.address?.district, property.address?.city].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Tenant */}
        {tenant && (
          <div className="flex items-center self-stretch mb-[7px] gap-1.5">
            <User className="w-3.5 h-3.5 text-[#6A6A6A]" />
            <span className="text-[#6A6A6A] text-sm mr-2">Khách thuê:</span>
            <span className="text-[#222222] text-sm">{tenant.name}</span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center self-stretch mb-[7px] gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-[#6A6A6A]" />
          <span className="text-[#6A6A6A] text-sm">Tạo ngày {formatDate(contract.createdAt)}</span>
        </div>

        {/* Signature badges */}
        <div className="flex gap-[9px] mb-[9px] flex-wrap">
          <button className={cn(
            "flex shrink-0 items-center text-left py-[5px] px-[11px] gap-[5px] rounded-lg border border-solid",
            contract.signedByLandlord.signed
              ? "bg-emerald-50 border-emerald-200"
              : "bg-[#F7F7F7] border-[#DDDDDD]",
          )}>
            {contract.signedByLandlord.signed
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              : <Circle className="w-3.5 h-3.5 text-[#6A6A6A]" />}
            <span className={cn("text-xs", contract.signedByLandlord.signed ? "text-emerald-700 font-medium" : "text-[#6A6A6A]")}>
              Bạn · {contract.signedByLandlord.signed ? 'Đã ký' : 'Chưa ký'}
            </span>
          </button>
          <button className={cn(
            "flex shrink-0 items-center text-left py-[5px] px-[11px] gap-[5px] rounded-lg border border-solid",
            contract.signedByTenant.signed
              ? "bg-emerald-50 border-emerald-200"
              : "bg-[#F7F7F7] border-[#DDDDDD]",
          )}>
            {contract.signedByTenant.signed
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              : <Circle className="w-3.5 h-3.5 text-[#6A6A6A]" />}
            <span className={cn("text-xs", contract.signedByTenant.signed ? "text-emerald-700 font-medium" : "text-[#6A6A6A]")}>
              Khách thuê · {contract.signedByTenant.signed ? 'Đã ký' : 'Chưa ký'}
            </span>
          </button>
        </div>

        {/* Payment status */}
        {paymentCfg && (
          <div className="flex items-center gap-2 mb-[9px]">
            {booking?.paymentStatus === 'paid' ? (
              <Banknote className="size-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Clock className={cn('size-3.5 shrink-0', paymentCfg.className)} />
            )}
            <span className={cn('text-xs font-medium', paymentCfg.className)}>
              {paymentCfg.label}
            </span>
            {booking?.paymentStatus === 'paid' && booking?.payoutStatus === 'pending' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Hourglass className="size-3 shrink-0" />
                Chờ nhận tiền
              </span>
            )}
            {booking?.paymentStatus === 'paid' && booking?.payoutStatus === 'paid' && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Banknote className="size-3 shrink-0" />
                Đã nhận tiền
              </span>
            )}
          </div>
        )}

        {/* Footer: download + sign */}
        <div className="flex justify-end items-start self-stretch pt-[13px] gap-[9px] border-t border-solid border-t-[#DDDDDD]">
          {contract.pdfUrl && (
            <button
              onClick={async () => {
                setIsDownloading(true);
                await downloadContractPdf(contract.id, `hop-dong-${contract.id}.pdf`);
                setIsDownloading(false);
              }}
              disabled={isDownloading}
              className="flex shrink-0 items-center bg-transparent text-left py-[7px] px-[13px] gap-1.5 rounded-lg border border-solid border-[#2683EB]"
            >
              {isDownloading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#2683EB]" />
              )}
              <span className="text-[#222222] text-xs font-bold">Tải PDF</span>
            </button>
          )}
          {canSign && (
            <button
              onClick={() => onSign(contract)}
              disabled={isSigningThis}
              className="flex shrink-0 items-center bg-[#ffef3d] hover:shadow-lg transition-all text-left py-1.5 px-3 gap-1.5 rounded-lg border-0"
            >
              {isSigningThis ? (
                <Loader2 className="size-3.5 animate-spin text-[#1f1c00]" />
              ) : (
                <PenLine className="size-3.5 text-[#1f1c00]" />
              )}
              <span className="text-[#1f1c00] text-xs font-bold">Ký hợp đồng</span>
            </button>
          )}
        </div>
      </div>
    </div>
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
  const [electricityPrice, setElectricityPrice] = useState('');
  const [waterPrice, setWaterPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const { data: bookingsData, isLoading: loadingBookings } = useLandlordBookings();
  const { mutate: generate, isPending } = useGenerateContract();

  const eligibleBookings = useMemo<Booking[]>(() => {
    const all = bookingsData?.data ?? [];
    return all.filter(
      (b) =>
        (b.status === 'confirmed' || b.status === 'active' || b.status === 'completed') &&
        !existingContractBookingIds.has(b.id),
    );
  }, [bookingsData?.data, existingContractBookingIds]);

  const selectedBooking = useMemo(
    () => eligibleBookings.find((b) => b.id === selectedBookingId) ?? null,
    [eligibleBookings, selectedBookingId],
  );

  const handleSubmit = () => {
    if (!selectedBookingId) return;
    generate(
      {
        bookingId: selectedBookingId,
        terms: terms.trim() || undefined,
        electricityPrice: electricityPrice ? Number(electricityPrice) : null,
        waterPrice: waterPrice ? Number(waterPrice) : null,
        paymentMethod: paymentMethod || null,
      },
      { onSuccess },
    );
  };

  const inputCls =
    'w-full h-11 px-3 text-sm text-[#222222] bg-white border border-[#DDDDDD] rounded-lg focus:outline-none focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/10 transition-colors placeholder:text-[#929292]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-[#F6F8FB] hover:bg-[#DDDDDD] transition-colors">
          <X className="size-4 text-[#222222]" />
        </button>

        <div className="size-12 bg-[#F7F7F7] rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="size-6 text-[#222222]" />
        </div>
        <h3 className="text-[17px] font-semibold text-[#222222] text-center mb-1">Tạo hợp đồng mới</h3>
        <p className="text-sm text-[#6A6A6A] text-center mb-6">
          Chọn đặt phòng đã xác nhận để tạo hợp đồng điện tử.
        </p>

        {/* Booking selector */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#222222] mb-2">
            Đặt phòng <span className="text-[#c13515]">*</span>
          </label>
          {loadingBookings ? (
            <div className="h-11 bg-[#F7F7F7] animate-pulse rounded-lg" />
          ) : eligibleBookings.length === 0 ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">
                Không có đặt phòng nào đủ điều kiện. Booking cần được xác nhận hoặc đang thuê và chưa có hợp đồng.
              </p>
            </div>
          ) : (
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className={inputCls}
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

        {/* Booking summary */}
        {selectedBooking && (
          <div className="mb-4 p-3 bg-[#F7F7F7] rounded-[10px] text-sm text-[#6A6A6A] space-y-1">
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

        {/* Utility prices */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-[#222222] mb-2">
              Giá điện <span className="text-[#6A6A6A] font-normal">(đ/kWh)</span>
            </label>
            <input type="number" min={0} step={100} placeholder="VD: 3500"
              value={electricityPrice} onChange={(e) => setElectricityPrice(e.target.value)}
              className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#222222] mb-2">
              Giá nước <span className="text-[#6A6A6A] font-normal">(đ/m³)</span>
            </label>
            <input type="number" min={0} step={100} placeholder="VD: 15000"
              value={waterPrice} onChange={(e) => setWaterPrice(e.target.value)}
              className={inputCls} />
          </div>
        </div>

        {/* Payment method */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#222222] mb-2">
            Hình thức thanh toán <span className="text-[#6A6A6A] font-normal">(tuỳ chọn)</span>
          </label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
            <option value="">-- Chưa xác định --</option>
            <option value="cash">Tiền mặt</option>
            <option value="bank_transfer">Chuyển khoản ngân hàng</option>
          </select>
        </div>

        {/* Additional terms */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#222222] mb-2">
            Điều khoản bổ sung <span className="text-[#6A6A6A] font-normal">(tuỳ chọn)</span>
          </label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Nhập các điều khoản bổ sung cho hợp đồng..."
            className="w-full px-3 py-2.5 text-sm text-[#222222] placeholder:text-[#929292] bg-white border border-[#DDDDDD] rounded-lg resize-none focus:outline-none focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/10 transition-colors"
          />
          <p className="text-xs text-[#929292] text-right mt-1">{terms.length}/2000</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-[#222222] border border-[#DDDDDD] rounded-lg hover:bg-[#F6F8FB] transition-colors">
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedBookingId || isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-[#1f1c00] bg-[#ffef3d] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
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
  pending:   { message: 'Chưa có hợp đồng chờ ký',      sub: 'Tạo hợp đồng từ đặt phòng đã xác nhận để bắt đầu.' },
  signed:    { message: 'Chưa có hợp đồng hoàn thành',   sub: 'Hợp đồng hoàn tất khi cả hai bên đã ký sẽ lưu ở đây.' },
  cancelled: { message: 'Không có hợp đồng bị huỷ',     sub: 'Các hợp đồng đã huỷ sẽ được lưu ở đây.' },
};

function EmptyState({ tabId, onGenerate }: { tabId: TabId; onGenerate: () => void }) {
  const { message, sub } = EMPTY_CONFIG[tabId];
  return (
    <div className="flex flex-col items-center py-16 self-stretch">
      <div className="size-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-4">
        <FileText className="size-8 text-[#929292]" />
      </div>
      <h3 className="text-base font-semibold text-[#222222] mb-1">{message}</h3>
      <p className="text-sm text-[#6A6A6A] mb-6">{sub}</p>
      {tabId === 'pending' && (
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#1f1c00] bg-[#ffef3d] hover:shadow-lg rounded-lg transition-all"
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
      {/* Title row */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-ink-black">Hợp đồng</h1>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex shrink-0 items-center bg-[#ffef3d] hover:shadow-lg transition-all text-left py-2 px-4 gap-2 rounded-lg border-0"
        >
          <Plus className="size-4 text-[#1f1c00]" />
          <span className="text-[#1f1c00] text-sm font-bold">Tạo hợp đồng</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center self-stretch gap-1 border-b border-solid border-b-[#DDDDDD]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex shrink-0 items-center pb-3 px-2 gap-2 transition-colors',
              activeTab === tab.id ? 'pb-[11px] border-b-2 border-[#222222] -mb-px' : '',
            )}
          >
            {tabCounts[tab.id] > 0 && activeTab !== tab.id ? (
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[#222222] text-[15px] font-bold">{tab.label}</span>
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

      {/* Contract list */}
      {isLoading ? (
        <div className="flex flex-col gap-4 self-stretch">
          <ContractCardSkeleton />
          <ContractCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tabId={activeTab} onGenerate={() => setShowGenerateModal(true)} />
      ) : (
        <div className="flex flex-col gap-4 self-stretch">
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

      {/* Sign modal */}
      {signingContract && (
        <SignModal
          contract={signingContract}
          onConfirm={handleSign}
          onClose={() => setSigningContract(null)}
          isPending={isSigning}
        />
      )}

      {/* Generate modal */}
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
