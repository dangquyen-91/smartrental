import api from '@/lib/axios';
import { toast } from 'sonner';
import type { Contract, Property, User as UserType, Booking } from '@/types';

export const STATUS_CONFIG: Record<Contract['status'], { label: string; className: string }> = {
  draft:                { label: 'Nháp',     className: 'bg-stone-100 text-stone-500 border border-stone-200' },
  awaiting_signatures:  { label: 'Chờ ký',   className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  signed:               { label: 'Đã ký đủ', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  cancelled:            { label: 'Đã huỷ',   className: 'bg-red-50 text-[#c13515] border border-red-100' },
};

export type TabId = 'pending' | 'signed' | 'cancelled';

export const TABS: { id: TabId; label: string; statuses: Contract['status'][] }[] = [
  { id: 'pending',   label: 'Chờ ký',  statuses: ['draft', 'awaiting_signatures'] },
  { id: 'signed',    label: 'Đã ký',   statuses: ['signed'] },
  { id: 'cancelled', label: 'Đã huỷ', statuses: ['cancelled'] },
];

export function formatDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getPrimaryImage(property: Property): string | null {
  if (!property.images?.length) return null;
  return property.images.find((i) => i.isPrimary)?.url ?? property.images[0]?.url ?? null;
}

export function asUser(u: UserType | string): UserType | null {
  return typeof u === 'object' ? u : null;
}

export function asProperty(p: Property | string): Property | null {
  return typeof p === 'object' ? p : null;
}

export function asBooking(b: Booking | string): Booking | null {
  return typeof b === 'object' ? b : null;
}

export async function downloadContractPdf(contractId: string, filename: string) {
  try {
    const res = await api.get(`/contracts/${contractId}/pdf`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    toast.error('Không thể tải file PDF. Vui lòng thử lại.');
  }
}
