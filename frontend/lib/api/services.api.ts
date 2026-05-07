import api from '@/lib/axios';
import { type ApiResponse, type PaginatedResponse, type ServiceOrder, type ServiceCatalogEntry } from '@/types';

export interface CreateServiceOrderPayload {
  property: string;
  type: ServiceOrder['type'];
  scheduledAt: string;
  note?: string;
}

export async function getServiceCatalogApi(): Promise<ServiceCatalogEntry[]> {
  const res = await api.get<ApiResponse<{ services: ServiceCatalogEntry[] }>>('/services');
  const services = res.data?.data?.services ?? res.data?.data ?? res.data;
  return Array.isArray(services) ? services : [];
}

export async function getMyServiceOrdersApi(params?: { limit?: number; status?: ServiceOrder['status'] }) {
  const query = new URLSearchParams();
  if (params?.limit)  query.set('limit',  String(params.limit));
  if (params?.status) query.set('status', params.status);
  const res = await api.get<PaginatedResponse<ServiceOrder>>(`/services/my-orders?${query}`);
  return res.data;
}

export async function createServiceOrderApi(data: CreateServiceOrderPayload) {
  const res = await api.post<ApiResponse<ServiceOrder>>('/services/order', data);
  return res.data;
}

export async function getLandlordServiceOrdersApi(params?: { limit?: number; status?: ServiceOrder['status'] }) {
  const query = new URLSearchParams();
  if (params?.limit)  query.set('limit',  String(params.limit));
  if (params?.status) query.set('status', params.status);
  const res = await api.get<PaginatedResponse<ServiceOrder>>(`/services/landlord-orders?${query}`);
  return res.data;
}

export async function getProviderServiceOrdersApi(params?: { limit?: number; status?: ServiceOrder['status'] }) {
  const query = new URLSearchParams();
  if (params?.limit)  query.set('limit',  String(params.limit));
  if (params?.status) query.set('status', params.status);
  const res = await api.get<PaginatedResponse<ServiceOrder>>(`/services/provider-orders?${query}`);
  return res.data;
}

export async function updateServiceOrderStatusApi(
  id: string,
  status: ServiceOrder['status'],
  cancelReason?: string,
) {
  const res = await api.patch<ApiResponse<ServiceOrder>>(`/services/order/${id}`, {
    status,
    ...(cancelReason ? { cancelReason } : {}),
  });
  return res.data;
}
