import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  getAdminDashboardApi,
  getAdminRevenueAnalyticsApi,
  getAdminUserAnalyticsApi,
  getAdminBookingAnalyticsApi,
  getAdminUsersApi,
  updateUserStatusApi,
  updateUserRoleApi,
  getAdminPropertiesApi,
  togglePropertyFeaturedApi,
  updatePropertyStatusAdminApi,
  deletePropertyAdminApi,
  getAdminPendingPayoutsApi,
  getAdminPendingRefundsApi,
  markBookingPayoutApi,
  markBookingRefundedApi,
  markServicePayoutApi,
  getAdminServiceOrdersApi,
  assignServiceProviderApi,
  type Period,
  type AdminUsersParams,
  type AdminPropertiesParams,
  type AdminServiceOrdersParams,
} from '@/lib/api/admin.api';

export const adminKeys = {
  dashboard: () => ['admin', 'dashboard'] as const,
  revenueAnalytics: (period: Period) => ['admin', 'analytics', 'revenue', period] as const,
  userAnalytics: (period: Period) => ['admin', 'analytics', 'user', period] as const,
  bookingAnalytics: (period: Period) => ['admin', 'analytics', 'booking', period] as const,
  users: (params: AdminUsersParams) => ['admin', 'users', params] as const,
  properties: (params: AdminPropertiesParams) => ['admin', 'properties', params] as const,
  serviceOrders: (params: AdminServiceOrdersParams) => ['admin', 'serviceOrders', params] as const,
  pendingPayouts: (page: number) => ['admin', 'pending', 'payouts', page] as const,
  pendingRefunds: (page: number) => ['admin', 'pending', 'refunds', page] as const,
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: getAdminDashboardApi,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useAdminRevenueAnalytics(period: Period = '30d') {
  return useQuery({
    queryKey: adminKeys.revenueAnalytics(period),
    queryFn: () => getAdminRevenueAnalyticsApi(period),
    staleTime: 5 * 60_000,
  });
}

export function useAdminUserAnalytics(period: Period = '30d') {
  return useQuery({
    queryKey: adminKeys.userAnalytics(period),
    queryFn: () => getAdminUserAnalyticsApi(period),
    staleTime: 5 * 60_000,
  });
}

export function useAdminBookingAnalytics(period: Period = '30d') {
  return useQuery({
    queryKey: adminKeys.bookingAnalytics(period),
    queryFn: () => getAdminBookingAnalyticsApi(period),
    staleTime: 5 * 60_000,
  });
}

// ─── User Management ──────────────────────────────────────────────────────────

export function useAdminUsers(params: AdminUsersParams = {}) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => getAdminUsersApi(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUserStatusApi(id, isActive),
    onSuccess: (_, { isActive }) => {
      toast.success(`Tài khoản đã ${isActive ? 'kích hoạt' : 'vô hiệu hoá'}.`);
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể cập nhật trạng thái.')),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateUserRoleApi(id, role),
    onSuccess: () => {
      toast.success('Đã cập nhật vai trò.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể cập nhật vai trò.')),
  });
}

// ─── Property Management ──────────────────────────────────────────────────────

export function useAdminProperties(params: AdminPropertiesParams = {}) {
  return useQuery({
    queryKey: adminKeys.properties(params),
    queryFn: () => getAdminPropertiesApi(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useTogglePropertyFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => togglePropertyFeaturedApi(id),
    onSuccess: (res) => {
      const featured = res.data?.isFeatured;
      toast.success(`Đã ${featured ? 'đặt' : 'bỏ'} nổi bật tin đăng.`);
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể cập nhật.')),
  });
}

export function useUpdatePropertyStatusAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updatePropertyStatusAdminApi(id, status),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái tin đăng.');
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể cập nhật trạng thái.')),
  });
}

export function useDeletePropertyAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePropertyAdminApi(id),
    onSuccess: () => {
      toast.success('Đã gỡ tin đăng khỏi nền tảng.');
      qc.invalidateQueries({ queryKey: ['admin', 'properties'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể gỡ tin đăng.')),
  });
}

// ─── Service Order Management ─────────────────────────────────────────────────

export function useAdminServiceOrders(params: AdminServiceOrdersParams = {}) {
  return useQuery({
    queryKey: adminKeys.serviceOrders(params),
    queryFn: () => getAdminServiceOrdersApi(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useAssignProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, providerId }: { id: string; providerId: string }) =>
      assignServiceProviderApi(id, providerId),
    onSuccess: () => {
      toast.success('Đã gán nhân viên thành công.');
      qc.invalidateQueries({ queryKey: ['admin', 'serviceOrders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể gán nhân viên.')),
  });
}

// ─── Pending Actions ──────────────────────────────────────────────────────────

export function useAdminPendingPayouts(page = 1) {
  return useQuery({
    queryKey: adminKeys.pendingPayouts(page),
    queryFn: () => getAdminPendingPayoutsApi({ page, limit: 20 }),
    staleTime: 30_000,
  });
}

export function useAdminPendingRefunds(page = 1) {
  return useQuery({
    queryKey: adminKeys.pendingRefunds(page),
    queryFn: () => getAdminPendingRefundsApi({ page, limit: 20 }),
    staleTime: 30_000,
  });
}

export function useMarkBookingPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markBookingPayoutApi(id),
    onSuccess: () => {
      toast.success('Đã xác nhận payout.');
      qc.invalidateQueries({ queryKey: ['admin', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể xác nhận payout.')),
  });
}

export function useMarkBookingRefunded() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markBookingRefundedApi(id),
    onSuccess: () => {
      toast.success('Đã đánh dấu hoàn tiền.');
      qc.invalidateQueries({ queryKey: ['admin', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể xác nhận hoàn tiền.')),
  });
}

export function useMarkServicePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markServicePayoutApi(id),
    onSuccess: () => {
      toast.success('Đã xác nhận payout cho provider.');
      qc.invalidateQueries({ queryKey: ['admin', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Không thể xác nhận payout.')),
  });
}
