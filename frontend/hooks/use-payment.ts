import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBookingPaymentApi,
  createServicePaymentApi,
  createSubscriptionPaymentApi,
} from "@/lib/api/payment.api";
import { getApiErrorMessage } from "@/lib/api-error";

export function useCreateBookingPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBookingPaymentApi,
    onSuccess: (data) => {
      const url = data.data?.checkoutUrl;
      if (url) {
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
    mutationFn: createServicePaymentApi,
    onSuccess: (data) => {
      const url = data.data?.checkoutUrl;
      if (url) {
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

export function useCreateSubscriptionPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSubscriptionPaymentApi,
    onSuccess: (data) => {
      const url = data.data?.checkoutUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Không nhận được liên kết thanh toán.");
      }
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Không thể tạo liên kết thanh toán.")),
  });
}
