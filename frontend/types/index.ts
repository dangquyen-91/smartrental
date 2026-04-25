export interface User {
  _id: string;
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

export interface Property {
  _id: string;
  title: string;
  type: 'room' | 'apartment' | 'house' | 'studio';
  status: 'available' | 'rented' | 'maintenance';
  price: number;
  area: number;
  address: {
    street: string;
    ward: string;
    district: string;
    city: string;
  };
  amenities: string[];
  images: string[];
  owner: User | string;
  isFeatured: boolean;
  createdAt: string;
}

export interface Booking {
  _id: string;
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
  depositAmount?: number;
  createdAt: string;
}

export interface ServiceOrder {
  _id: string;
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
  _id: string;
  name: string;
  slug: 'free' | 'basic' | 'premium';
  price: number;
  durationDays: number;
  maxListings: number;
  maxFeatured: number;
  includesContract: boolean;
}

export interface Subscription {
  _id: string;
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
  _id: string;
  booking: Booking | string;
  tenant: User | string;
  landlord: User | string;
  property: Property | string;
  terms: string;
  pdfUrl?: string;
  status: 'draft' | 'awaiting_signatures' | 'signed' | 'cancelled';
  signedByTenant: boolean;
  signedByLandlord: boolean;
  createdAt: string;
}

export interface RoommateProfile {
  _id: string;
  user: User | string;
  budget: number;
  preferredLocation: string;
  moveInDate: string;
  lifestyle: string[];
  createdAt: string;
}
