import api from '@/lib/axios';
import { type ApiResponse, type Plan, type SubscriptionSummary } from '@/types';
import { type PaymentLink } from './payment.api';

export async function getPlansApi() {
  const res = await api.get<ApiResponse<{ plans: Plan[] }>>('/subscriptions/plans');
  return res.data.data?.plans ?? [];
}

export async function getMySummaryApi() {
  const res = await api.get<ApiResponse<SubscriptionSummary>>('/subscriptions/my');
  return res.data.data;
}

export async function createSubscriptionPaymentApi(planKey: 'basic' | 'premium') {
  const res = await api.post<ApiResponse<PaymentLink>>(`/payment/subscription/${planKey}`);
  return res.data;
}
