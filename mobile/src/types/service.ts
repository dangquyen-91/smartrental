export type ServiceType = 'cleaning' | 'repair' | 'wifi' | 'moving' | 'painting' | 'registration';
export type ServiceStatus = 'pending' | 'confirmed' | 'in_progress' | 'done' | 'cancelled';

export interface CatalogItem {
  id: string;
  type: ServiceType;
  name: string;
  price: number;
  unit: string;
  isActive: boolean;
}

export interface ServiceOrderProperty {
  id?: string;
  _id?: string;
  title: string;
  type?: string;
  address?: { district?: string; city?: string };
  images?: { url: string; isPrimary?: boolean }[];
}

export interface ServiceOrder {
  id: string;
  tenant?: { id?: string; name?: string; phone?: string; avatar?: string } | string | null;
  property: ServiceOrderProperty | string;
  type: ServiceType;
  status: ServiceStatus;
  scheduledAt: string;
  price: number;
  note?: string | null;
  cancelReason?: string | null;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  assignedProvider?: { name?: string; phone?: string } | string | null;
  createdAt: string;
}

export interface CreateServiceOrderInput {
  property: string;
  type: ServiceType;
  scheduledAt: string; // ISO
  note?: string;
}
