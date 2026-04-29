import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMyBookingsApi,
  getLandlordBookingsApi,
  getBookingApi,
  createBookingApi,
  confirmBookingApi,
  rejectBookingApi,
  cancelBookingApi,
  activateBookingApi,
  type CreateBookingPayload,
} from "@/lib/api/bookings.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { type Booking } from "@/types";

export const bookingKeys = {
  mine: (status?: Booking["status"]) => ["bookings", "mine", status] as const,
  landlord: (status?: Booking["status"]) => ["bookings", "landlord", status] as const,
  detail: (id: string) => ["bookings", "detail", id] as const,
};

export function useMyBookings(status?: Booking["status"]) {
  return useQuery({
    queryKey: bookingKeys.mine(status),
    queryFn: () => getMyBookingsApi(status),
  });
}

export function useLandlordBookings(status?: Booking["status"]) {
  return useQuery({
    queryKey: bookingKeys.landlord(status),
    queryFn: () => getLandlordBookingsApi(status),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => getBookingApi(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBookingPayload) => createBookingApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạo yêu cầu đặt phòng.')),
  });
}

export function useConfirmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: confirmBookingApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể xác nhận đặt phòng.')),
  });
}

export function useRejectBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rejectBookingApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể từ chối đặt phòng.')),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelBookingApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể huỷ đặt phòng.')),
  });
}

export function useActivateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activateBookingApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể kích hoạt đặt phòng.')),
  });
}
