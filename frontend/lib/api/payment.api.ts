import api from "@/lib/axios";
import { type ApiResponse } from "@/types";

export interface PaymentLink {
  checkoutUrl: string;
  paymentCode?: number;
}

export async function createBookingPaymentApi(bookingId: string) {
  const res = await api.post<ApiResponse<PaymentLink>>(`/payment/booking/${bookingId}`);
  return res.data;
}

export async function createServicePaymentApi(orderId: string) {
  const res = await api.post<ApiResponse<PaymentLink>>(`/payment/service/${orderId}`);
  return res.data;
}

export async function createSubscriptionPaymentApi(subscriptionId: string) {
  const res = await api.post<ApiResponse<PaymentLink>>(`/payment/subscription/${subscriptionId}`);
  return res.data;
}
