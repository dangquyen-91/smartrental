import api from "@/lib/axios";
import { type ApiResponse, type Booking } from "@/types";

export interface PaymentLink {
  checkoutUrl: string;
  paymentCode?: number;
}

export interface BookingPaymentStatus {
  orderCode: number;
  status: string;
  amount: number;
  transactions: unknown[];
  paymentStatus: Booking["paymentStatus"];
  platformFee: number;
  landlordPayout: number;
}

export async function createBookingPaymentApi(bookingId: string) {
  const res = await api.post<ApiResponse<PaymentLink>>(`/payment/booking/${bookingId}`);
  return res.data;
}

export async function getBookingPaymentStatusApi(bookingId: string) {
  const res = await api.get<ApiResponse<BookingPaymentStatus>>(`/payment/booking/${bookingId}/status`, {
    params: { _t: Date.now() }
  });
  return res.data;
}

export interface ServicePaymentStatus {
  orderCode: number;
  status: string;
  amount: number;
  transactions: unknown[];
  paymentStatus: "unpaid" | "paid" | "refunded";
}

export async function createServicePaymentApi(orderId: string) {
  const res = await api.post<ApiResponse<PaymentLink>>(`/payment/service/${orderId}`);
  return res.data;
}

export async function getServicePaymentStatusApi(orderId: string) {
  const res = await api.get<ApiResponse<ServicePaymentStatus>>(`/payment/service/${orderId}/status`, {
    params: { _t: Date.now() }
  });
  return res.data;
}

