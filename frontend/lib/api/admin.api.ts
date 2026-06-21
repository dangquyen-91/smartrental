import api from '@/lib/axios';
import type { ApiResponse, PaginatedResponse, User, Property, Booking, ServiceOrder } from '@/types';

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    byRole: Record<string, { total: number; active: number }>;
  };
  properties: {
    total: number;
    byStatus: Record<string, number>;
  };
  bookings: {
    total: number;
    byStatus: Record<string, number>;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number | null;
  };
  pendingActions: {
    payouts: number;
    refunds: number;
    unassignedServiceOrders: number;
  };
}

export async function getAdminDashboardApi() {
  const res = await api.get<ApiResponse<DashboardStats>>('/admin/dashboard');
  return res.data;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type Period = '7d' | '30d' | '90d' | '1y' | 'week' | 'month' | 'year';
export type Granularity = 'day' | 'week' | 'month';

export interface RevenueTimeline {
  date: string;
  booking: { fee: number; count: number };
  service: { fee: number; count: number };
  total: number;
}

export interface RevenueAnalytics {
  period: Period;
  timeline: RevenueTimeline[];
  totals: { booking: number; service: number; total: number };
}

export interface UserGrowthEntry {
  _id: string;
  total: number;
  tenants: number;
  landlords: number;
  providers: number;
}

export interface UserAnalytics {
  period: Period;
  growth: UserGrowthEntry[];
  distribution: {
    byRole: Record<string, { total: number; active: number }>;
    byAuthProvider: Record<string, number>;
  };
  topLandlords: Array<{
    landlordId: string;
    name: string;
    email: string;
    avatar?: string;
    totalPayout: number;
    bookingCount: number;
  }>;
}

export interface BookingAnalytics {
  period: Period;
  granularity: Granularity;
  timeline: Array<{
    _id: string;
    total: number;
    confirmed: number;
    active: number;
    completed: number;
    cancelled: number;
    revenue: number;
  }>;
  summary: {
    byStatus: Record<string, number>;
    completionRate: number;
    cancellationRate: number;
    avgDurationMonths: number | null;
    cancellationByActor?: Record<string, number>;
  };
  revenueByPropertyType: Array<{
    _id: string;
    count: number;
    revenue: number;
  }>;
}

export async function getAdminRevenueAnalyticsApi(period: Period = '30d') {
  const res = await api.get<ApiResponse<RevenueAnalytics>>(`/admin/analytics/revenue?period=${period}`);
  return res.data;
}

export async function getAdminUserAnalyticsApi(period: Period = '30d') {
  const res = await api.get<ApiResponse<UserAnalytics>>(`/admin/analytics/users?period=${period}`);
  return res.data;
}

export async function getAdminBookingAnalyticsApi(period: Period = '30d', granularity: Granularity = 'week') {
  const res = await api.get<ApiResponse<BookingAnalytics>>(`/admin/analytics/bookings?period=${period}&granularity=${granularity}`);
  return res.data;
}

// ─── User Management ──────────────────────────────────────────────────────────

export interface AdminUsersParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  isActive?: string;
}

export async function getAdminUsersApi(params: AdminUsersParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.role) q.set('role', params.role);
  if (params.search) q.set('search', params.search);
  if (params.isActive !== undefined && params.isActive !== '') q.set('isActive', params.isActive);
  const res = await api.get<PaginatedResponse<User>>(`/admin/users?${q.toString()}`);
  return res.data;
}

export async function updateUserStatusApi(id: string, isActive: boolean) {
  const res = await api.patch<ApiResponse<User>>(`/admin/users/${id}/status`, { isActive });
  return res.data;
}

export async function updateUserRoleApi(id: string, role: string) {
  const res = await api.patch<ApiResponse<User>>(`/admin/users/${id}/role`, { role });
  return res.data;
}

// ─── Property Management ──────────────────────────────────────────────────────

export interface AdminPropertiesParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
}

export async function getAdminPropertiesApi(params: AdminPropertiesParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.status) q.set('status', params.status);
  if (params.type) q.set('type', params.type);
  if (params.search) q.set('search', params.search);
  const res = await api.get<PaginatedResponse<Property>>(`/admin/properties?${q.toString()}`);
  return res.data;
}

export async function togglePropertyFeaturedApi(id: string) {
  const res = await api.patch<ApiResponse<Property>>(`/admin/properties/${id}/featured`);
  return res.data;
}

export async function updatePropertyStatusAdminApi(id: string, status: string) {
  const res = await api.patch<ApiResponse<Property>>(`/admin/properties/${id}/status`, { status });
  return res.data;
}

export async function deletePropertyAdminApi(id: string) {
  const res = await api.delete<ApiResponse<Property>>(`/admin/properties/${id}`);
  return res.data;
}

// ─── Pending Actions ──────────────────────────────────────────────────────────

export interface PendingPayoutsData {
  bookings: { items: Booking[]; total: number };
  services: { items: ServiceOrder[]; total: number };
  totalPending: number;
  pagination: { page: number; limit: number };
}

export async function getAdminPendingPayoutsApi(params: { page?: number; limit?: number } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const res = await api.get<ApiResponse<PendingPayoutsData>>(`/admin/pending/payouts?${q.toString()}`);
  return res.data;
}

export async function getAdminPendingRefundsApi(params: { page?: number; limit?: number } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const res = await api.get<PaginatedResponse<Booking>>(`/admin/pending/refunds?${q.toString()}`);
  return res.data;
}

// ─── Admin Action Shortcuts (existing booking/service endpoints) ───────────────

export async function markBookingPayoutApi(id: string) {
  const res = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/payout`);
  return res.data;
}

export async function markBookingRefundedApi(id: string) {
  const res = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/mark-refunded`);
  return res.data;
}

export async function markServicePayoutApi(id: string) {
  const res = await api.patch<ApiResponse<ServiceOrder>>(`/services/order/${id}/payout`);
  return res.data;
}

// ─── Service Order Management (admin) ─────────────────────────────────────────

export interface AdminServiceOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

export async function getAdminServiceOrdersApi(params: AdminServiceOrdersParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.status) q.set('status', params.status);
  if (params.type) q.set('type', params.type);
  const res = await api.get<PaginatedResponse<ServiceOrder>>(`/services/orders?${q.toString()}`);
  return res.data;
}

export async function assignServiceProviderApi(id: string, providerId: string) {
  const res = await api.patch<ApiResponse<ServiceOrder>>(`/services/order/${id}/assign`, { providerId });
  return res.data;
}
