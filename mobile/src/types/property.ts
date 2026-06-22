export interface PropertyImage {
  url: string;
  isPrimary?: boolean;
  publicId?: string;
}

export type PropertyType = 'room' | 'apartment' | 'house' | 'studio';

export interface Property {
  id: string;
  title: string;
  description?: string;
  type: PropertyType;
  status: 'available' | 'rented' | 'maintenance';
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  address: {
    street?: string;
    ward?: string;
    district: string;
    city: string;
    fullAddress?: string;
    lat?: number | null;
    lng?: number | null;
  };
  amenities?: string[];
  images: PropertyImage[];
  isFeatured?: boolean;
  isVerified?: boolean;
  owner?: {
    id?: string;
    _id?: string;
    name: string;
    avatar?: string | null;
    phone?: string | null;
  } | null;
}

export interface PropertyFilters {
  search?: string;
  city?: string;
  type?: PropertyType | 'all';
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  data: T[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}
