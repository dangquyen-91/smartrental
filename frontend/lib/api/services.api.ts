import api from "@/lib/axios";
import { type ApiResponse, type ServiceOrder } from "@/types";

export interface CreateServiceOrderPayload {
  property: string;
  type: ServiceOrder["type"];
  scheduledAt: string;
  notes?: string;
}

export async function getMyServiceOrdersApi(status?: ServiceOrder["status"]) {
  const res = await api.get<ApiResponse<ServiceOrder[]>>(
    `/services/my${status ? `?status=${status}` : ""}`
  );
  return res.data;
}

export async function getProviderServiceOrdersApi(status?: ServiceOrder["status"]) {
  const res = await api.get<ApiResponse<ServiceOrder[]>>(
    `/services/provider${status ? `?status=${status}` : ""}`
  );
  return res.data;
}

export async function getServiceOrderApi(id: string) {
  const res = await api.get<ApiResponse<ServiceOrder>>(`/services/${id}`);
  return res.data;
}

export async function createServiceOrderApi(data: CreateServiceOrderPayload) {
  const res = await api.post<ApiResponse<ServiceOrder>>("/services", data);
  return res.data;
}

export async function updateServiceStatusApi(
  id: string,
  status: ServiceOrder["status"]
) {
  const res = await api.patch<ApiResponse<ServiceOrder>>(`/services/${id}/status`, {
    status,
  });
  return res.data;
}

export async function cancelServiceOrderApi(id: string) {
  const res = await api.patch<ApiResponse<ServiceOrder>>(`/services/${id}/cancel`);
  return res.data;
}
