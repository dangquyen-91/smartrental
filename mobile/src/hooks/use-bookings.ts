import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activateBookingApi,
  cancelBookingApi,
  completeBookingApi,
  confirmBookingApi,
  createBookingApi,
  getLandlordBookingsApi,
  getMyBookingsApi,
  rejectBookingApi,
} from '@/lib/api/bookings.api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';

const errMsg = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

export function useMyBookings() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: getMyBookingsApi,
    enabled: !!accessToken,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBookingApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
    onError: (e) => toast.error(errMsg(e, 'Đặt phòng thất bại')),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelBookingApi(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
    onError: (e) => toast.error(errMsg(e, 'Hủy đặt phòng thất bại')),
  });
}

// ─── Landlord ───
export function useLandlordBookings() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['landlord-bookings'],
    queryFn: getLandlordBookingsApi,
    enabled: !!accessToken,
  });
}

export type BookingAction = 'confirm' | 'reject' | 'activate' | 'complete';

export function useBookingAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ action, id, reason }: { action: BookingAction; id: string; reason?: string }) => {
      switch (action) {
        case 'confirm':
          return confirmBookingApi(id);
        case 'reject':
          return rejectBookingApi(id, reason);
        case 'activate':
          return activateBookingApi(id);
        case 'complete':
          return completeBookingApi(id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord-bookings'] });
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
    },
    onError: (e) => toast.error(errMsg(e, 'Thao tác thất bại')),
  });
}
