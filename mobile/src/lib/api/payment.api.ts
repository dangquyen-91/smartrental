import api from '@/lib/api';

export interface PaymentLink {
  checkoutUrl: string;
  orderCode?: number;
  amount?: number;
  platformFee?: number;
  landlordPayout?: number;
}

export interface BookingPaymentStatus {
  orderCode: number;
  status: string; // PayOS: PAID | PENDING | CANCELLED | ...
  amount: number;
  paymentStatus: 'unpaid' | 'paid' | 'refunded'; // trạng thái trong DB (do webhook cập nhật)
  platformFee: number;
  landlordPayout: number;
}

// Tạo link thanh toán cho booking (chỉ khi booking active + chưa trả)
export async function createBookingPaymentApi(bookingId: string) {
  const { data } = await api.post(`/payment/booking/${bookingId}`);
  return data.data as PaymentLink;
}

// Hỏi trạng thái thanh toán (tin vào paymentStatus của DB)
export async function getBookingPaymentStatusApi(bookingId: string) {
  const { data } = await api.get(`/payment/booking/${bookingId}/status`, {
    params: { _t: Date.now() }, // chống cache
  });
  return data.data as BookingPaymentStatus;
}
