import api from '@/lib/api';
import type { Paginated, Property, PropertyFilters, PropertyType } from '@/types/property';

export interface CreatePropertyInput {
  title: string;
  type: PropertyType;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  address: { city: string; district: string; ward?: string; street?: string };
  amenities: string[];
  images: { url: string; isPrimary: boolean }[];
}

export async function getPropertiesApi(filters: PropertyFilters = {}) {
  // Bỏ type='all' vì backend không hiểu giá trị này
  const params: Record<string, unknown> = { ...filters };
  if (params.type === 'all') delete params.type;

  const { data } = await api.get('/properties', { params });
  // Backend trả { success, message, data: [...], pagination }
  return {
    data: (data.data ?? []) as Property[],
    pagination: data.pagination,
  } as Paginated<Property>;
}

export async function getPropertyApi(id: string) {
  const { data } = await api.get(`/properties/${id}`);
  // Production bọc { property, contactRevealed }
  return (data.data?.property ?? data.data) as Property;
}

// Tin của landlord đang đăng nhập
export async function getMyListingsApi() {
  const { data } = await api.get('/properties/my/listings');
  return {
    data: (data.data ?? []) as Property[],
    pagination: data.pagination,
  } as Paginated<Property>;
}

export async function createPropertyApi(payload: CreatePropertyInput) {
  const { data } = await api.post('/properties', payload);
  return (data.data?.property ?? data.data) as Property;
}

export async function updatePropertyApi(
  id: string,
  data: Partial<CreatePropertyInput> & { status?: Property['status'] },
) {
  const { data: res } = await api.put(`/properties/${id}`, data);
  return (res.data?.property ?? res.data) as Property;
}

export async function deletePropertyApi(id: string) {
  await api.delete(`/properties/${id}`);
}
