import api from "@/lib/axios";
import { type ApiResponse, type Booking } from "@/types";

export interface CreateBookingPayload {
  property: string;
  startDate: string;
  duration: number;
}

export async function getMyBookingsApi(status?: Booking["status"]) {
  const res = await api.get<ApiResponse<Booking[]>>(
    `/bookings/my${status ? `?status=${status}` : ""}`
  );
  return res.data;
}

export async function getLandlordBookingsApi(status?: Booking["status"]) {
  const res = await api.get<ApiResponse<Booking[]>>(
    `/bookings/landlord${status ? `?status=${status}` : ""}`
  );
  return res.data;
}

export async function getAllMyBookingsApi() {
  const res = await api.get<ApiResponse<Booking[]>>("/bookings/my");
  return res.data;
}

export async function getBookingApi(id: string) {
  const res = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
  return res.data;
}

export async function createBookingApi(data: CreateBookingPayload) {
  const res = await api.post<ApiResponse<Booking>>("/bookings", data);
  return res.data;
}

export async function confirmBookingApi(id: string) {
  const res = await api.put<ApiResponse<Booking>>(`/bookings/${id}/confirm`);
  return res.data;
}

export async function rejectBookingApi({
  id,
  reason,
}: {
  id: string;
  reason?: string;
}) {
  const res = await api.put<ApiResponse<Booking>>(`/bookings/${id}/reject`, {
    reason,
  });
  return res.data;
}

export async function cancelBookingApi(id: string) {
  // Send empty body so Express parses req.body as {} instead of undefined
  const res = await api.put<ApiResponse<Booking>>(`/bookings/${id}/cancel`, {});
  return res.data;
}

export async function activateBookingApi(id: string) {
  const res = await api.put<ApiResponse<Booking>>(`/bookings/${id}/activate`);
  return res.data;
}

export async function completeBookingApi(id: string) {
  const res = await api.put<ApiResponse<Booking>>(`/bookings/${id}/complete`);
  return res.data;
}

export type RevenuePeriod = "3m" | "6m" | "1y";

export interface RevenueByMonth {
  month: string;
  grossRevenue: number;
  landlordPayout: number;
  platformFee: number;
  bookingCount: number;
}

export interface RevenueByProperty {
  propertyId: string;
  title: string;
  thumbnail: string | null;
  grossRevenue: number;
  landlordPayout: number;
  platformFee: number;
  bookingCount: number;
}

export interface LandlordRevenueStats {
  period: RevenuePeriod;
  monthly: RevenueByMonth[];
  byProperty: RevenueByProperty[];
  totals: {
    grossRevenue: number;
    landlordPayout: number;
    platformFee: number;
    bookingCount: number;
  };
}

export async function getLandlordRevenueStatsApi(period: RevenuePeriod = "3m") {
  const res = await api.get<ApiResponse<LandlordRevenueStats>>(
    `/bookings/landlord/revenue-stats?period=${period}`,
  );
  return res.data;
}
