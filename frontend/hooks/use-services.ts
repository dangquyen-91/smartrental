import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getServiceCatalogApi,
  getMyServiceOrdersApi,
  getLandlordServiceOrdersApi,
  getProviderServiceOrdersApi,
  createServiceOrderApi,
  updateServiceOrderStatusApi,
  type CreateServiceOrderPayload,
} from '@/lib/api/services.api';
import { createServicePaymentApi } from '@/lib/api/payment.api';
import { getApiErrorMessage } from '@/lib/api-error';
import type { ServiceOrder } from '@/types';

export const serviceKeys = {
  catalog:   ['services', 'catalog']   as const,
  mine:      ['services', 'mine']      as const,
  landlord:  ['services', 'landlord']  as const,
  provider:  ['services', 'provider']  as const,
};

export function useServiceCatalog() {
  return useQuery({
    queryKey: serviceKeys.catalog,
    queryFn:  getServiceCatalogApi,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyServiceOrders() {
  return useQuery({
    queryKey: serviceKeys.mine,
    queryFn:  () => getMyServiceOrdersApi({ limit: 50 }),
  });
}

export function useLandlordServiceOrders() {
  return useQuery({
    queryKey: serviceKeys.landlord,
    queryFn:  () => getLandlordServiceOrdersApi({ limit: 50 }),
  });
}

export function useProviderServiceOrders() {
  return useQuery({
    queryKey: serviceKeys.provider,
    queryFn:  () => getProviderServiceOrdersApi({ limit: 50 }),
  });
}

export function useUpdateServiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceOrder['status'] }) =>
      updateServiceOrderStatusApi(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.provider });
      qc.invalidateQueries({ queryKey: serviceKeys.landlord });
      qc.invalidateQueries({ queryKey: serviceKeys.mine });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể cập nhật trạng thái.')),
  });
}

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceOrderPayload) => createServiceOrderApi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.mine });
      toast.success('Yêu cầu dịch vụ đã được tạo thành công!');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạo yêu cầu dịch vụ.')),
  });
}

export function useCancelServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateServiceOrderStatusApi(id, 'cancelled'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.mine });
      toast.success('Đã huỷ yêu cầu dịch vụ.');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể huỷ yêu cầu.')),
  });
}

export function useCreateServicePayment() {
  return useMutation({
    mutationFn: (orderId: string) => createServicePaymentApi(orderId),
    onSuccess: (data) => {
      const url = data.data?.checkoutUrl;
      if (url) window.location.href = url;
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạo link thanh toán.')),
  });
}
