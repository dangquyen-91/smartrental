export type RevenuePeriod = '3m' | '6m' | '1y';

export interface MonthlyRevenue {
  month: string; // 'YYYY-MM'
  grossRevenue: number;
  landlordPayout: number;
  platformFee: number;
  bookingCount: number;
}

export interface PropertyRevenue {
  propertyId: string;
  title: string;
  type: string;
  address?: { district?: string; city?: string };
  grossRevenue: number;
  landlordPayout: number;
  bookingCount: number;
}

export interface RevenueSummary {
  grossRevenue: number;
  landlordPayout: number;
  platformFee: number;
  totalBookings: number;
}

export interface RevenueStats {
  period: RevenuePeriod;
  monthly: MonthlyRevenue[];
  byProperty: PropertyRevenue[];
  summary: RevenueSummary;
}
