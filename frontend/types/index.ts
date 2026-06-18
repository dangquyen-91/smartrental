export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'tenant' | 'landlord' | 'admin' | 'provider';
  avatar?: string;
  address?: {
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
  };
  dateOfBirth?: string | null;
  nationalId?: {
    number?: string | null;
    issuedDate?: string | null;
    issuedPlace?: string | null;
  } | null;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  savedProperties?: string[];
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
  isVerified?: boolean;
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
  paidDate?: string;
  platformFee?: number;
  landlordPayout?: number;
  payoutStatus?: 'pending' | 'paid' | null;
  cancelledBy?: 'tenant' | 'landlord' | 'admin' | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceCatalogEntry {
  id: string;
  type: 'cleaning' | 'repair' | 'wifi' | 'moving' | 'painting' | 'registration';
  name: string;
  price: number;
  unit: string;
  isActive: boolean;
}

export interface ServiceOrder {
  id: string;
  tenant: User | string;
  property: Property | string;
  type: 'cleaning' | 'repair' | 'wifi' | 'moving' | 'painting' | 'registration';
  status: 'pending' | 'confirmed' | 'in_progress' | 'done' | 'cancelled';
  scheduledAt: string;
  price: number;
  note?: string | null;
  assignedProvider?: User | string | null;
  cancelReason?: string | null;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  paymentCode?: number | null;
  platformFee?: number | null;
  providerPayout?: number | null;
  payoutStatus: 'none' | 'pending' | 'paid';
  payoutDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  booking: Booking | string;
  tenant: User | string;
  landlord: User | string;
  property: Property | string;
  terms: string;
  pdfUrl?: string;
  electricityPrice?: number | null;
  waterPrice?: number | null;
  paymentMethod?: string | null;
  status: 'draft' | 'awaiting_signatures' | 'signed' | 'cancelled';
  signedByTenant: { signed: boolean; signedAt?: string | null };
  signedByLandlord: { signed: boolean; signedAt?: string | null };
  createdAt: string;
}

export interface RoommateProfile {
  id: string;
  user: User;
  gender: 'male' | 'female' | 'any';
  budget: { min: number; max: number };
  schedule: 'early_bird' | 'night_owl' | 'flexible';
  lifestyle: 'quiet' | 'active' | 'mixed';
  cleanliness: 'neat' | 'average' | 'relaxed';
  duration: 'short' | 'long' | 'flexible';
  pets: 'ok' | 'no';
  smoking: 'ok' | 'no';
  looking: boolean;
  bio?: string;
  city?: string;
  property?: Property | string;
  // returned by GET /matches and GET /profile/:userId
  matchScore?: number;
  requestStatus?: 'pending' | 'accepted' | 'rejected' | 'cancelled' | null;
  contactRevealed?: boolean;
  createdAt: string;
}

export interface RoommateRequest {
  id: string;
  sender: User;
  receiver: User;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  createdAt: string;
}

// ─── Review ──────────────────────────────────────────────────────────────────

/** Populated target — shape depends on targetType */
export interface ReviewTargetRef {
  _id: string;
  // property fields
  title?: string;
  address?: { street?: string; district?: string; city?: string };
  // user fields
  name?: string;
  email?: string;
  avatar?: string;
}

export interface Review {
  id: string;
  booking: string | Booking;
  reviewer: User | string;
  reviewerRole: 'tenant';
  targetType: 'property';
  target: string;
  rating: number;
  comment?: string | null;
  /** present when booking reviews endpoint is called */
  isOwn?: boolean;
  /** populated only in admin getAllReviews response */
  targetRef?: ReviewTargetRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyReviewsData {
  reviews: Review[];
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution: Record<string, number> | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

