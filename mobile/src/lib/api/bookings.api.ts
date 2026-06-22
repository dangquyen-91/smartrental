import api from '@/lib/api';
import type { Booking } from '@/types/booking';
import type { Paginated } from '@/types/property';

export async function createBookingApi(input: {
  property: string;
  startDate: string; // YYYY-MM-DD
  duration: number; // tháng
  note?: string;
}) {
  const { data } = await api.post('/bookings', input);
  return (data.data?.booking ?? data.data) as Booking;
}

export async function getMyBookingsApi() {
  const { data } = await api.get('/bookings/my', { params: { limit: 50 } });
  return {
    data: (data.data ?? []) as Booking[],
    pagination: data.pagination,
  } as Paginated<Booking>;
}

export async function cancelBookingApi(id: string, reason?: string) {
  const { data } = await api.put(`/bookings/${id}/cancel`, { reason });
  return (data.data?.booking ?? data.data) as Booking;
}

// ─── Landlord: quản lý đặt phòng nhận được ───
export async function getLandlordBookingsApi() {
  const { data } = await api.get('/bookings/landlord', { params: { limit: 50 } });
  return {
    data: (data.data ?? []) as Booking[],
    pagination: data.pagination,
  } as Paginated<Booking>;
}

export async function confirmBookingApi(id: string) {
  const { data } = await api.put(`/bookings/${id}/confirm`);
  return (data.data?.booking ?? data.data) as Booking;
}

export async function rejectBookingApi(id: string, reason?: string) {
  const { data } = await api.put(`/bookings/${id}/reject`, { reason });
  return (data.data?.booking ?? data.data) as Booking;
}

export async function activateBookingApi(id: string) {
  const { data } = await api.put(`/bookings/${id}/activate`);
  return (data.data?.booking ?? data.data) as Booking;
}

export async function completeBookingApi(id: string) {
  const { data } = await api.put(`/bookings/${id}/complete`);
  return (data.data?.booking ?? data.data) as Booking;
}
