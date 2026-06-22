import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createServiceOrderApi,
  getLandlordServiceOrdersApi,
  getMyServiceOrdersApi,
  getServiceCatalogApi,
  updateServiceOrderStatusApi,
} from '@/lib/api/services.api';
import type { ServiceStatus } from '@/types/service';
import { toast } from '@/stores/toast.store';

export function useServiceCatalog() {
  return useQuery({ queryKey: ['service-catalog'], queryFn: getServiceCatalogApi });
}

export function useMyServiceOrders() {
  return useQuery({ queryKey: ['my-service-orders'], queryFn: getMyServiceOrdersApi });
}

export function useLandlordServiceOrders() {
  return useQuery({ queryKey: ['landlord-service-orders'], queryFn: getLandlordServiceOrdersApi });
}

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createServiceOrderApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-service-orders'] });
      qc.invalidateQueries({ queryKey: ['landlord-service-orders'] });
    },
  });
}

export function useServiceOrderAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, cancelReason }: { id: string; status: ServiceStatus; cancelReason?: string }) =>
      updateServiceOrderStatusApi(id, { status, cancelReason }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['my-service-orders'] });
      qc.invalidateQueries({ queryKey: ['landlord-service-orders'] });
      toast.success(vars.status === 'cancelled' ? 'Đã hủy đơn dịch vụ' : 'Đã xác nhận đơn dịch vụ');
    },
    onError: () => toast.error('Không thực hiện được, thử lại sau'),
  });
}
