import api from "@/lib/axios";
import type { ApiResponse, Review, PropertyReviewsData } from "@/types";

export interface CreateReviewPayload {
  bookingId: string;
  targetType: "property";
  rating: number;
  comment?: string;
}

// POST /api/reviews
export async function createReviewApi(data: CreateReviewPayload) {
  const res = await api.post<ApiResponse<{ review: Review }>>("/reviews", data);
  return res.data;
}

// GET /api/reviews/property/:id
export async function getPropertyReviewsApi(propertyId: string, page = 1, limit = 10) {
  const res = await api.get<PropertyReviewsData & { success: boolean; message: string }>(
    `/reviews/property/${propertyId}?page=${page}&limit=${limit}`,
  );
  return res.data;
}

// GET /api/reviews/booking/:id  (auth required)
export async function getBookingReviewsApi(bookingId: string) {
  const res = await api.get<ApiResponse<{ reviews: (Review & { isOwn: boolean })[] }>>(
    `/reviews/booking/${bookingId}`,
  );
  return res.data;
}

// GET /api/reviews/mine  (auth required)
export async function getMyReviewsApi(page = 1, limit = 10) {
  const res = await api.get<{ success: boolean; data: Review[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    `/reviews/mine?page=${page}&limit=${limit}`,
  );
  return res.data;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminReviewsParams {
  page?: number;
  limit?: number;
  targetType?: "property";
  includeDeleted?: boolean;
}

// GET /api/reviews  (admin only)
export async function getAllReviewsAdminApi(params: AdminReviewsParams = {}) {
  const q = new URLSearchParams();
  if (params.page)         q.set("page",           String(params.page));
  if (params.limit)        q.set("limit",          String(params.limit));
  if (params.targetType)   q.set("targetType",     params.targetType);
  if (params.includeDeleted) q.set("includeDeleted", "true");
  const res = await api.get<{ success: boolean; data: Review[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    `/reviews${q.toString() ? `?${q}` : ""}`,
  );
  return res.data;
}

// DELETE /api/reviews/:id  (admin only — soft delete)
export async function deleteReviewAdminApi(id: string) {
  const res = await api.delete<ApiResponse<{ review: Review }>>(`/reviews/${id}`);
  return res.data;
}

// ─── Landlord ──────────────────────────────────────────────────────────────────

export interface LandlordReviewUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface LandlordReviewTarget {
  _id: string;
  title: string;
  type?: 'room' | 'apartment' | 'house' | 'studio';
  status?: 'available' | 'rented' | 'maintenance';
  price?: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  address?: { city?: string; district?: string; ward?: string; street?: string };
  images?: { url: string; isPrimary?: boolean }[];
}

export interface LandlordReview {
  _id: string;
  id?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
  reviewer: LandlordReviewUser;
  reviewerRole?: 'tenant' | 'landlord';
  target: LandlordReviewTarget;
  targetType: 'property' | 'landlord' | 'tenant';
  booking?: string;
}

export interface LandlordPropertiesReviewsData {
  reviews: LandlordReview[];
  averageRating: number | null;
  totalReviews: number;
}

export async function getMyPropertiesReviewsApi(page = 1, limit = 10) {
  const res = await api.get<
    { success: boolean; message: string } & LandlordPropertiesReviewsData & {
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }
  >(`/reviews/landlord/my-properties?page=${page}&limit=${limit}`);
  return res.data;
}
