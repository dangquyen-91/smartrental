import api from '@/lib/api';
import type { RevenuePeriod, RevenueStats } from '@/types/revenue';

// GET /bookings/landlord/revenue-stats?period=3m|6m|1y
export async function getRevenueStatsApi(period: RevenuePeriod) {
  const { data } = await api.get('/bookings/landlord/revenue-stats', { params: { period } });
  return data.data as RevenueStats;
}
