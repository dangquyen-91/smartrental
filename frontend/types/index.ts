export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'tenant' | 'landlord' | 'admin' | 'provider';
  avatar?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  isActive: boolean;
  authProvider?: 'local' | 'google';
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PropertyImage {
  url: string;
  isPrimary: boolean;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  type: 'room' | 'apartment' | 'house' | 'studio';
  status: 'available' | 'rented' | 'maintenance';
  price: number;
  pricePerM2?: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  address: {
    street?: string;
    ward?: string;
    district: string;
    city: string;
    fullAddress?: string;
  };
  amenities: string[];
  images: PropertyImage[];
  owner: User | string;
  contact?: {
    name: string;
    phone: string;
  };
  views?: number;
  isFeatured: boolean;
  isActive?: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  property: Property | string;
  tenant: User | string;
  landlord: User | string;
  startDate: string;
  endDate: string;
  duration: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'active' | 'completed';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentCode?: number;
  paymentDeadline?: string;
  depositAmount?: number;
  createdAt: string;
}

export interface ServiceOrder {
  id: string;
  tenant: User | string;
  property: Property | string;
  type: 'cleaning' | 'repair' | 'wifi' | 'moving' | 'painting' | 'registration';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  price: number;
  assignedProvider?: User | string;
  paymentStatus: 'unpaid' | 'paid';
  paymentCode?: number;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: 'free' | 'basic' | 'premium';
  price: number;
  durationDays: number;
  maxListings: number;
  maxFeatured: number;
  maxContracts: number;       // -1 = unlimited, 0 = none, n = trial cap
  priorityLevel: number;      // 0 = none, 1 = low, 2 = high
  includesHighlight: boolean;
  includesAnalytics: boolean;
  description?: string;
}

export interface Subscription {
  id: string;
  landlord: User | string;
  plan: Plan;
  status: 'pending_payment' | 'active' | 'expired' | 'cancelled';
  startDate?: string;
  endDate?: string;
  paymentCode?: number;
  paymentStatus: 'unpaid' | 'paid';
  createdAt: string;
}

export interface Contract {
  id: string;
  booking: Booking | string;
  tenant: User | string;
  landlord: User | string;
  property: Property | string;
  terms: string;
  pdfUrl?: string;
  status: 'draft' | 'awaiting_signatures' | 'signed' | 'cancelled';
  signedByTenant: { signed: boolean; signedAt?: string | null };
  signedByLandlord: { signed: boolean; signedAt?: string | null };
  createdAt: string;
}

export interface RoommateProfile {
  id: string;
  user: User | string;
  budget: number;
  preferredLocation: string;
  moveInDate: string;
  lifestyle: string[];
  createdAt: string;
}
