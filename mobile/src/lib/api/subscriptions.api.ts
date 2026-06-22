import api from '@/lib/api';
import type { Plan, SubscriptionSummary } from '@/types/subscription';
import type { PaymentLink } from '@/lib/api/payment.api';

// GET /subscriptions/plans → { plans }
export async function getPlansApi() {
  const { data } = await api.get('/subscriptions/plans');
  return (data.data?.plans ?? data.data ?? []) as Plan[];
}

// GET /subscriptions/my → summary (landlord)
export async function getMySubscriptionApi() {
  const { data } = await api.get('/subscriptions/my');
  return data.data as SubscriptionSummary;
}

// POST /payment/subscription/:planKey → checkoutUrl
export async function createSubscriptionPaymentApi(planKey: string) {
  const { data } = await api.post(`/payment/subscription/${planKey}`);
  return data.data as PaymentLink;
}

// GET /payment/subscription/status → tự hỏi PayOS + kích hoạt (phòng webhook không tới localhost)
export async function getSubscriptionPaymentStatusApi() {
  const { data } = await api.get('/payment/subscription/status', {
    params: { _t: Date.now() }, // chống cache
  });
  return data.data as { status: string; activated: boolean; orderCode?: number; amount?: number };
}
