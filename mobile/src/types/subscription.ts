export type PlanKey = 'free' | 'basic' | 'premium';

export interface Plan {
  id: string;
  key: PlanKey;
  name: string;
  price: number; // VND/tháng, 0 = free
  listingLimit: number; // -1 = không giới hạn
  commissionRate: number; // 0.10 / 0.04 / 0
  badge?: string | null;
  features: string[];
}

export interface SubscriptionSummary {
  subscription: {
    id: string;
    status: 'active' | 'expired' | 'cancelled';
    startDate: string;
    endDate: string | null;
  };
  plan: Plan;
  activeListings: number;
  daysLeft: number | null;
  isExpiringSoon: boolean;
}
