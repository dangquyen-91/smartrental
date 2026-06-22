import { useQuery } from '@tanstack/react-query';
import { getRevenueStatsApi } from '@/lib/api/revenue.api';
import type { RevenuePeriod } from '@/types/revenue';

export function useRevenueStats(period: RevenuePeriod) {
  return useQuery({
    queryKey: ['revenue-stats', period],
    queryFn: () => getRevenueStatsApi(period),
  });
}
