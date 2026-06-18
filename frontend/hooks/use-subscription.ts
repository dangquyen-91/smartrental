import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPlansApi, getMySummaryApi, createSubscriptionPaymentApi } from '@/lib/api/subscription.api';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/hooks/use-auth';

export const subscriptionKeys = {
  plans:   ['subscription', 'plans']   as const,
  summary: ['subscription', 'summary'] as const,
};

export function usePlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans,
    queryFn:  getPlansApi,
    staleTime: 10 * 60 * 1000,
  });
}

export function useMySubscription() {
  const { isLandlord } = useAuth();
  return useQuery({
    queryKey: subscriptionKeys.summary,
    queryFn:  getMySummaryApi,
    enabled:  isLandlord,
    staleTime: 60_000,
    retry: false,
  });
}

export function useBuyPlan() {
  return useMutation({
    mutationFn: (planKey: 'basic' | 'premium') => createSubscriptionPaymentApi(planKey),
    onSuccess: (data) => {
      const url = data.data?.checkoutUrl;
      if (url) {
        sessionStorage.setItem('pendingPayment', JSON.stringify({ type: 'subscription' }));
        window.location.href = url;
      } else {
        toast.error('Không nhận được liên kết thanh toán.');
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạo liên kết thanh toán.')),
  });
}
