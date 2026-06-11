import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBookingPaymentApi,
  createServicePaymentApi,
} from "@/lib/api/payment.api";
import { getApiErrorMessage } from "@/lib/api-error";

export function useCreateBookingPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => createBookingPaymentApi(bookingId),
    onSuccess: (data, bookingId) => {
      const url = data.data?.checkoutUrl;
      if (url) {
        sessionStorage.setItem('pendingPayment', JSON.stringify({ type: 'booking', id: bookingId }));
        window.location.href = url;
      } else {
        toast.error("Không nhận được liên kết thanh toán.");
      }
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Không thể tạo liên kết thanh toán.")),
  });
}

export function useCreateServicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => createServicePaymentApi(orderId),
    onSuccess: (data, orderId) => {
      const url = data.data?.checkoutUrl;
      if (url) {
        sessionStorage.setItem('pendingPayment', JSON.stringify({ type: 'service', id: orderId }));
        window.location.href = url;
      } else {
        toast.error("Không nhận được liên kết thanh toán.");
      }
      qc.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Không thể tạo liên kết thanh toán.")),
  });
}

