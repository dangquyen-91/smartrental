import { Ionicons } from '@expo/vector-icons';
import type { ServiceStatus, ServiceType } from '@/types/service';

type IoniconName = keyof typeof Ionicons.glyphMap;

export const SERVICE_ICON: Record<ServiceType, IoniconName> = {
  cleaning: 'sparkles-outline',
  repair: 'construct-outline',
  wifi: 'wifi-outline',
  moving: 'cube-outline',
  painting: 'color-fill-outline',
  registration: 'document-text-outline',
};

export const SERVICE_STATUS: Record<ServiceStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ xác nhận', color: '#d97706' },
  confirmed: { label: 'Đã xác nhận', color: '#2563eb' },
  in_progress: { label: 'Đang thực hiện', color: '#0891b2' },
  done: { label: 'Hoàn tất', color: '#16a34a' },
  cancelled: { label: 'Đã hủy', color: '#dc2626' },
};
