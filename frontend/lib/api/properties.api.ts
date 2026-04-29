import api from "@/lib/axios";
import { type ApiResponse, type PaginatedResponse, type Property } from "@/types";

export interface PropertyFilters {
  type?: Property["type"];
  status?: Property["status"];
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getPropertiesApi(filters?: PropertyFilters) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
  }
  const query = params.toString();
  const res = await api.get<PaginatedResponse<Property>>(
    `/properties${query ? `?${query}` : ""}`
  );
  return res.data;
}

export async function getPropertyApi(id: string) {
  const res = await api.get<ApiResponse<{ property: Property }>>(`/properties/${id}`);
  return res.data;
}

export async function getMyPropertiesApi() {
  const res = await api.get<ApiResponse<Property[]>>("/properties/my/listings");
  return res.data;
}

export async function createPropertyApi(
  data: Omit<Property, "id" | "owner" | "createdAt" | "status" | "isFeatured">
) {
  const res = await api.post<ApiResponse<Property>>("/properties", data);
  return res.data;
}

export async function updatePropertyApi(id: string, data: Partial<Property>) {
  const res = await api.put<ApiResponse<Property>>(`/properties/${id}`, data);
  return res.data;
}

export async function deletePropertyApi(id: string) {
  const res = await api.delete<ApiResponse<null>>(`/properties/${id}`);
  return res.data;
}
