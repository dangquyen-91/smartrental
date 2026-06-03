'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
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

// ─── Sidebar nav items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: 'Tổng quan',
    href: '/hosting',
    icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/0975cf20-29ba-4c90-a408-0bcb7c01067a',
  },
  {
    label: 'Tin đăng',
    href: '/hosting/listings',
    icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/3998786a-cbc4-41c7-a67f-040f52104128',
  },
  {
    label: 'Yêu cầu thuê',
    href: '/hosting/reservations',
    icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/99881c0f-0190-4fc8-a573-480c848bdd9a',
  },
  {
    label: 'Hợp đồng',
    href: '/hosting/contracts',
    icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/f3631b44-54e6-4752-af63-c3fb94f41dd8',
    active: true,
  },
  {
    label: 'Dịch vụ',
    href: '/hosting/services',
    icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7b068a65-5445-42dc-98b5-f2c163ec67fe',
  },
];

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

  const statusCfg = STATUS_CONFIG[contract.status];
  const canSign = contract.status === 'awaiting_signatures' && !contract.signedByLandlord.signed;

  return (
    <div className="flex items-start self-stretch bg-white py-[21px] px-5 gap-4 rounded-[14px] border border-solid border-[#DDDDDD]">
      {/* Property image */}
      <div className="shrink-0 rounded-[10px] overflow-hidden bg-[#F7F7F7]">
        {imgUrl ? (
          <img src={imgUrl} alt={property?.title ?? ''} className="w-[120px] h-[120px] object-cover" loading="lazy" />
        ) : (
          <div className="w-[120px] h-[120px] flex items-center justify-center">
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
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7f6bc1cc-13f8-4bb4-889f-ba66de342a6b"
              className="w-3.5 h-3.5 object-fill"
              alt=""
            />
            <span className="text-[#6A6A6A] text-sm">
              {[property.address?.district, property.address?.city].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {/* Tenant */}
        {tenant && (
          <div className="flex items-center self-stretch mb-[7px] gap-1.5">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5daf3aac-0839-4237-b7ae-8800698c0a40"
              className="w-3.5 h-3.5 object-fill"
              alt=""
            />
            <span className="text-[#6A6A6A] text-sm mr-2">Khách thuê:</span>
            <span className="text-[#222222] text-sm">{tenant.name}</span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center self-stretch mb-[7px] gap-1.5">
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/daefa182-046c-4686-8dfd-f2f38cf31ba0"
            className="w-3.5 h-3.5 object-fill"
            alt=""
          />
          <span className="text-[#6A6A6A] text-sm">Tạo ngày {formatDate(contract.createdAt)}</span>
        </div>

        {/* Signature badges */}
        <div className="flex gap-[9px] mb-[9px]">
          <button className="flex shrink-0 items-center bg-[#F7F7F7] text-left py-[5px] px-[11px] gap-[5px] rounded-lg border border-solid border-[#DDDDDD]">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d85e7988-abae-422f-8280-7ac0748fbf12"
              className="w-3.5 h-3.5 object-fill"
              alt=""
            />
            <span className="text-[#6A6A6A] text-xs">
              Bạn · {contract.signedByLandlord.signed ? 'Đã ký' : 'Chưa ký'}
            </span>
          </button>
          <button className="flex shrink-0 items-center bg-[#F7F7F7] text-left py-[5px] px-[11px] gap-[5px] rounded-lg border border-solid border-[#DDDDDD]">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9d3e07d5-15b7-4725-9c61-e7fbf37a73cb"
              className="w-3.5 h-3.5 object-fill"
              alt=""
            />
            <span className="text-[#6A6A6A] text-xs">
              Khách thuê · {contract.signedByTenant.signed ? 'Đã ký' : 'Chưa ký'}
            </span>
          </button>
        </div>

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
                <img
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/afb97ec9-29f4-4b60-b73f-c882ee134f2c"
                  className="w-3.5 h-3.5 object-fill"
                  alt=""
                />
              )}
              <span className="text-[#222222] text-xs font-bold">Tải PDF</span>
            </button>
          )}
          {canSign && (
            <button
              onClick={() => onSign(contract)}
              disabled={isSigningThis}
              className="flex shrink-0 items-center bg-[#2683EB] text-left py-1.5 px-3 gap-1.5 rounded-lg border-0"
            >
              {isSigningThis ? (
                <Loader2 className="size-3.5 animate-spin text-white" />
              ) : (
                <img
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7dfe4f36-bc25-408c-a882-7c0889c04cec"
                  className="w-3.5 h-3.5 object-fill"
                  alt=""
                />
              )}
              <span className="text-white text-xs font-bold">Ký hợp đồng</span>
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
        (b.status === 'confirmed' || b.status === 'active') &&
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
        <div className="mb-4 grid grid-cols-2 gap-3">
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
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#2683EB] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
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
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#2683EB] hover:bg-blue-600 rounded-lg transition-colors"
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
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [signingContract, setSigningContract] = useState<Contract | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, logout, isAuthenticated, isLandlord, isAdmin, hasHydrated } = useAuth();

  // Auth redirect
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (!isLandlord && !isAdmin) router.replace('/');
  }, [hasHydrated, isAuthenticated, isLandlord, isAdmin, router]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!hasHydrated || !isAuthenticated || (!isLandlord && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#2683EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
    <div className="flex flex-col bg-white">
      {/* ── Header ── */}
      <div
        className="bg-cover bg-center py-[22px] px-20"
        style={{
          backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/eb609fa3-9a4b-4bf7-8291-56c045573ba8)',
        }}
      >
        <div className="flex justify-between items-center self-stretch">
          <Link href="/">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/cc012ec2-2e37-440b-a5a8-14c2ae1bf1b0"
              alt="SmartRental"
              className="w-[182px] h-[26px] object-fill cursor-pointer"
            />
          </Link>

          <div className="flex shrink-0 items-center">
            {/* Admin label */}
            <div className="flex flex-col shrink-0 items-center py-2 mr-1 rounded-[20px]">
              <span className="text-[#222222] text-sm font-bold">Quản lý cho thuê</span>
            </div>

            {/* Avatar dropdown */}
            <div className="relative" ref={userMenuRef}>
              <div className="flex shrink-0 items-center py-[5px] px-[13px] mx-2 gap-[9px] rounded-[20px] border border-solid border-black">
                <img
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/66c8ca5a-7553-49d9-be3c-ab10680e0f66"
                  className="w-4 h-3 rounded-[20px] object-fill"
                  alt=""
                />
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex flex-col shrink-0 items-center bg-[#222222] text-left py-1.5 px-[11px] rounded-[26843500px] border-0"
                >
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() ?? 'N'}
                  </span>
                </button>
              </div>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#DDDDDD] rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#DDDDDD]">
                    <p className="text-sm font-semibold text-[#222222] truncate">{user?.name}</p>
                    <p className="text-xs text-[#6A6A6A] truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); router.push('/'); }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-[#c13515] hover:bg-red-50 transition-colors gap-2"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col items-start self-stretch">
        <div className="flex self-stretch flex-1">
          {/* Sidebar */}
          <aside className="w-[223px] shrink-0 flex flex-col items-start bg-white border-r border-[#DDDDDD]">
            {/* Explore */}
            <div className="flex items-center py-[21px] pl-[15px] pr-[118px] gap-2 border-b border-solid border-b-[#DDDDDD]">
              <img
                src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/0d8421f1-fd5e-40b4-8d7c-757a4e29614d"
                className="w-4 h-4 object-fill"
                alt=""
              />
              <span className="text-[#222222] text-[15px] font-bold">Khám phá</span>
            </div>

            {/* Section label */}
            <div className="flex flex-col items-start py-4 pl-[15px] pr-[70px] border-b border-solid border-b-[#DDDDDD]">
              <span className="text-[#929292] text-[13px] font-bold">QUẢN LÝ CHO THUÊ</span>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col items-start px-[7px] pt-3 gap-0.5 w-full">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center py-2.5 rounded-lg w-full',
                      isActive ? 'bg-[#F7F7F7]' : '',
                    )}
                  >
                    <img
                      src={item.icon}
                      className="w-4 h-4 mx-3 rounded-lg object-fill"
                      alt=""
                    />
                    <span className={cn(
                      'text-[15px]',
                      isActive ? 'text-[#222222] font-bold' : 'text-[#6A6A6A]',
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-[#F6F8FB] pt-8 pb-[436px] px-24">
            <div className="flex flex-col self-stretch gap-6 max-w-[1217px]">
              {/* Title row */}
              <div className="flex justify-between items-center self-stretch">
                <span className="text-[#222222] text-[25px] font-bold">Hợp đồng</span>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="flex shrink-0 items-center bg-[#2683EB] text-left py-2 px-4 gap-2 rounded-lg border-0"
                >
                  <img
                    src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/66e90a74-9b83-4c04-8d5c-235a3bff0c2e"
                    className="w-4 h-4 object-fill"
                    alt=""
                  />
                  <span className="text-white text-sm font-bold">Tạo hợp đồng</span>
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
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="flex flex-col self-stretch bg-[#FFF546] py-10 px-20 gap-8 border-t border-solid border-t-[#FFF546]">
          <div className="flex items-center self-stretch gap-8">
            <div className="flex flex-1 flex-col items-start pb-[90px] gap-3">
              <img
                src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/22dc7a32-fc83-4861-94b5-8fe718f89037"
                alt="SmartRental"
                className="w-[182px] h-[25px] object-fill"
              />
              <span className="text-black text-sm">Nền tảng thuê nhà thông minh cho thị trường Việt Nam.</span>
            </div>

            <div className="flex flex-1 flex-col gap-[11px]">
              <span className="text-black text-sm font-bold">Hỗ trợ</span>
              <div className="flex flex-col gap-2">
                <span className="text-[#6A6A6A] text-sm">Trung tâm trợ giúp</span>
                <span className="text-[#6A6A6A] text-sm">Liên hệ</span>
                <span className="text-[#6A6A6A] text-sm">Chính sách bảo mật</span>
                <span className="text-[#6A6A6A] text-sm">Điều khoản sử dụng</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-[11px]">
              <span className="text-black text-sm font-bold">Dành cho chủ nhà</span>
              <div className="flex flex-col gap-2">
                <span className="text-[#6A6A6A] text-sm">Đăng tin cho thuê</span>
                <span className="text-[#6A6A6A] text-sm">Quản lý đặt phòng</span>
                <span className="text-[#6A6A6A] text-sm">Hợp đồng điện tử</span>
                <span className="text-[#6A6A6A] text-sm">Gói dịch vụ</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-start self-stretch pt-[25px] border-t border-solid border-t-[#6C6C6C]">
            <span className="text-[#6C6C6C] text-xs">© 2026 Smart Rental. Nền tảng thuê nhà thông minh.</span>
          </div>
        </footer>
      </div>

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
