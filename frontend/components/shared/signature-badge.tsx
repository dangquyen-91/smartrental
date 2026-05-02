'use client';

import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/contract-utils';

export function SignatureBadge({
  label,
  signed,
  signedAt,
}: {
  label: string;
  signed: boolean;
  signedAt?: string | null;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border',
        signed
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-[#f7f7f7] text-[#6a6a6a] border-[#dddddd]',
      )}
    >
      {signed ? <CheckCircle2 className="size-3.5 shrink-0" /> : <Clock className="size-3.5 shrink-0" />}
      <span>
        {label}
        {signed && signedAt ? ` · ${formatDate(signedAt)}` : signed ? ' · Đã ký' : ' · Chưa ký'}
      </span>
    </div>
  );
}
