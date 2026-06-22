import { useQuery } from '@tanstack/react-query';
import { getMySubscriptionApi, getPlansApi } from '@/lib/api/subscriptions.api';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: getPlansApi,
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: getMySubscriptionApi,
  });
}
