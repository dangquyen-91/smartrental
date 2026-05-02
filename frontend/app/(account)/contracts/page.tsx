'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Home,
  Download,
  PenLine,
  Loader2,
  MapPin,
  CalendarDays,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMyContracts, useSignContract } from '@/hooks/use-contracts';
import {
  STATUS_CONFIG,
  TABS,
  type TabId,
  formatDate,
  getPrimaryImage,
  asUser,
  asProperty,
  downloadContractPdf,
} from '@/lib/contract-utils';
import { ContractCardSkeleton } from '@/components/ui/skeleton';
import { SignatureBadge } from '@/components/shared/signature-badge';
import { SignModal } from '@/components/shared/sign-modal';
import type { Contract, Property, User as UserType } from '@/types';

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
  const landlord = asUser(contract.landlord);
  const imgUrl = property ? getPrimaryImage(property) : null;
  const address = property
    ? [property.address?.district, property.address?.city].filter(Boolean).join(', ')
    : '';

  const statusCfg = STATUS_CONFIG[contract.status];
  const canSign = contract.status === 'awaiting_signatures' && !contract.signedByTenant.signed;

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

        {landlord && (
          <p className="flex items-center gap-1.5 text-sm text-[#6a6a6a]">
            <User className="size-3.5 shrink-0" />
            Chủ nhà: <span className="text-[#222222] font-medium ml-0.5">{landlord.name}</span>
          </p>
        )}

        <p className="flex items-center gap-1.5 text-sm text-[#6a6a6a]">
          <CalendarDays className="size-3.5 shrink-0" />
          Tạo ngày {formatDate(contract.createdAt)}
        </p>

        <div className="flex flex-wrap gap-2 mt-0.5">
          <SignatureBadge label="Bạn" signed={contract.signedByTenant.signed} signedAt={contract.signedByTenant.signedAt} />
          <SignatureBadge label="Chủ nhà" signed={contract.signedByLandlord.signed} signedAt={contract.signedByLandlord.signedAt} />
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

// ─── empty state ──────────────────────────────────────────────────────────────

const EMPTY_CONFIG: Record<TabId, { message: string; sub: string }> = {
  pending:   { message: 'Không có hợp đồng chờ ký',    sub: 'Hợp đồng sẽ xuất hiện ở đây sau khi chủ nhà tạo từ đặt phòng đã thanh toán.' },
  signed:    { message: 'Chưa có hợp đồng hoàn thành', sub: 'Hợp đồng hoàn tất khi cả hai bên đã ký sẽ lưu ở đây.' },
  cancelled: { message: 'Không có hợp đồng bị huỷ',    sub: 'Các hợp đồng đã huỷ sẽ được lưu ở đây.' },
};

function EmptyState({ tabId }: { tabId: TabId }) {
  const { message, sub } = EMPTY_CONFIG[tabId];
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="size-16 bg-[#f7f7f7] rounded-full flex items-center justify-center mb-4">
        <FileText className="size-8 text-[#dddddd]" />
      </div>
      <h2 className="text-lg font-semibold text-[#222222] mb-2">{message}</h2>
      <p className="text-sm text-[#6a6a6a] mb-6 max-w-xs leading-relaxed">{sub}</p>
      {tabId === 'pending' && (
        <Link href="/trips" className="px-6 py-3 text-sm font-semibold text-[#222222] border border-[#dddddd] hover:bg-[#f7f7f7] rounded-lg transition-colors">
          Xem đơn thuê
        </Link>
      )}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [signingContract, setSigningContract] = useState<Contract | null>(null);

  const { data, isLoading } = useMyContracts();
  const { mutate: signContract, isPending: isSigning, variables: signingId } = useSignContract();

  const allContracts = useMemo<Contract[]>(() => data?.data ?? [], [data?.data]);

  const { filtered, tabCounts } = useMemo(() => {
    const counts = Object.fromEntries(TABS.map((t) => [t.id, 0])) as Record<TabId, number>;
    const filteredContracts: Contract[] = [];
    for (const c of allContracts) {
      for (const tab of TABS) {
        if (tab.statuses.includes(c.status)) {
          counts[tab.id]++;
          if (tab.id === activeTab) filteredContracts.push(c);
          break;
        }
      }
    }
    return { filtered: filteredContracts, tabCounts: counts };
  }, [allContracts, activeTab]);

  const handleSign = (onSuccess: () => void) => {
    if (!signingContract) return;
    signContract(signingContract.id, { onSuccess });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#222222]">Hợp đồng của tôi</h1>

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
        <EmptyState tabId={activeTab} />
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
    </div>
  );
}
