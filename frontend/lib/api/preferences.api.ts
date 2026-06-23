import api from "@/lib/axios";
import { type ApiResponse } from "@/types";

export interface TenantPreference {
  id?: string;
  budget: { min: number; max: number };
  preferredTypes: ("room" | "apartment" | "house" | "studio")[];
  preferredCity: string;
  preferredDistrict: string;
  requiredAmenities: string[];
  minArea: number | null;
  maxArea: number | null;
}

export async function getMyPreferenceApi() {
  const res = await api.get<ApiResponse<{ preference: TenantPreference | null }>>("/preferences");
  return res.data;
}

export async function upsertPreferenceApi(data: Omit<TenantPreference, "id">) {
  const res = await api.put<ApiResponse<{ preference: TenantPreference }>>("/preferences", data);
  return res.data;
}

export async function deletePreferenceApi() {
  const res = await api.delete<ApiResponse<null>>("/preferences");
  return res.data;
}
