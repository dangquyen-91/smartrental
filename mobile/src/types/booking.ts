import type { PropertyImage, PropertyType } from './property';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

export interface BookingProperty {
  id: string;
  title: string;
  price: number;
  type: PropertyType;
  images?: PropertyImage[];
  address?: { district?: string; city?: string };
}

export interface Booking {
  id: string;
  property: BookingProperty | string;
  landlord?: { id?: string; name?: string; phone?: string; avatar?: string | null } | string;
  tenant?: { id?: string; name?: string; phone?: string; email?: string; avatar?: string | null } | string;
  startDate: string;
  endDate: string;
  duration: number; // số tháng
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  rejectionReason?: string | null;
  paymentDeadline?: string | null;
  createdAt?: string;
}
