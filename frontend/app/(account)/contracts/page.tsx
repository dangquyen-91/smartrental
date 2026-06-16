'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Home,
  Download,
  Loader2,
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
import { SignModal } from '@/components/shared/sign-modal';
import type { Contract } from '@/types';

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

  const statusCfg = STATUS_CONFIG[contract.status];
  const canSign = contract.status === 'awaiting_signatures' && !contract.signedByTenant.signed;

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

        {/* Landlord */}
        {landlord && (
          <div className="flex items-center self-stretch mb-[7px] gap-1.5">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5daf3aac-0839-4237-b7ae-8800698c0a40"
              className="w-3.5 h-3.5 object-fill"
              alt=""
            />
            <span className="text-[#6A6A6A] text-sm mr-2">Chủ nhà:</span>
            <span className="text-[#222222] text-sm">{landlord.name}</span>
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
          <button className={cn(
            "flex shrink-0 items-center text-left py-[5px] px-[11px] gap-[5px] rounded-lg border border-solid",
            contract.signedByTenant.signed
              ? "bg-emerald-50 border-emerald-200"
              : "bg-[#F7F7F7] border-[#DDDDDD]",
          )}>
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d85e7988-abae-422f-8280-7ac0748fbf12"
              className="w-3.5 h-3.5 object-fill"
              alt=""
            />
            <span className={cn("text-xs", contract.signedByTenant.signed ? "text-emerald-700 font-medium" : "text-[#6A6A6A]")}>
              Bạn · {contract.signedByTenant.signed ? 'Đã ký' : 'Chưa ký'}
            </span>
          </button>
          <button className={cn(
            "flex shrink-0 items-center text-left py-[5px] px-[11px] gap-[5px] rounded-lg border border-solid",
            contract.signedByLandlord.signed
              ? "bg-emerald-50 border-emerald-200"
              : "bg-[#F7F7F7] border-[#DDDDDD]",
          )}>
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9d3e07d5-15b7-4725-9c61-e7fbf37a73cb"
              className="w-3.5 h-3.5 object-fill"
              alt=""
            />
            <span className={cn("text-xs", contract.signedByLandlord.signed ? "text-emerald-700 font-medium" : "text-[#6A6A6A]")}>
              Chủ nhà · {contract.signedByLandlord.signed ? 'Đã ký' : 'Chưa ký'}
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
              className="flex shrink-0 items-center bg-[#ffef3d] hover:shadow-lg transition-all text-left py-1.5 px-3 gap-1.5 rounded-lg border-0"
            >
              {isSigningThis ? (
                <Loader2 className="size-3.5 animate-spin text-[#1f1c00]" />
              ) : (
                <img
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7dfe4f36-bc25-408c-a882-7c0889c04cec"
                  className="w-3.5 h-3.5 object-fill"
                  alt=""
                />
              )}
              <span className="text-[#1f1c00] text-xs font-bold">Ký hợp đồng</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

const EMPTY_CONFIG: Record<TabId, { message: string; sub: string }> = {
  pending:   { message: 'Không có hợp đồng chờ ký',    sub: 'Hợp đồng sẽ xuất hiện ở đây sau khi chủ nhà tạo.' },
  signed:    { message: 'Chưa có hợp đồng hoàn thành', sub: 'Hợp đồng hoàn tất khi cả hai bên đã ký sẽ lưu ở đây.' },
  cancelled: { message: 'Không có hợp đồng bị huỷ',    sub: 'Các hợp đồng đã huỷ sẽ được lưu ở đây.' },
};

function EmptyState({ tabId }: { tabId: TabId }) {
  const { message, sub } = EMPTY_CONFIG[tabId];
  return (
    <div className="flex flex-col items-center py-16 self-stretch">
      <div className="size-16 bg-[#F7F7F7] rounded-full flex items-center justify-center mb-4">
        <FileText className="size-8 text-[#929292]" />
      </div>
      <h3 className="text-base font-semibold text-[#222222] mb-1">{message}</h3>
      <p className="text-sm text-[#6A6A6A] mb-6">{sub}</p>
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
    <div className="flex flex-col self-stretch gap-6">
      {/* Title row */}
      <div className="flex justify-between items-center self-stretch">
        <span className="text-[#222222] text-[25px] font-bold">Hợp đồng</span>
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
        <EmptyState tabId={activeTab} />
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
    </div>
  );
}
