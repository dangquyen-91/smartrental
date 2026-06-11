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
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useLandlordServiceOrders() {
  return useQuery({
    queryKey: serviceKeys.landlord,
    queryFn:  () => getLandlordServiceOrdersApi({ limit: 50 }),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useProviderServiceOrders() {
  return useQuery({
    queryKey: serviceKeys.provider,
    queryFn:  () => getProviderServiceOrdersApi({ limit: 50 }),
    staleTime: 0,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateServiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, cancelReason }: { id: string; status: ServiceOrder['status']; cancelReason?: string }) =>
      updateServiceOrderStatusApi(id, status, cancelReason),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: serviceKeys.landlord });
      await qc.cancelQueries({ queryKey: serviceKeys.mine });
      await qc.cancelQueries({ queryKey: serviceKeys.provider });

      const prev = {
        landlord: qc.getQueryData(serviceKeys.landlord),
        mine:     qc.getQueryData(serviceKeys.mine),
        provider: qc.getQueryData(serviceKeys.provider),
      };

      const patch = (old: unknown) => {
        const data = old as { data?: ServiceOrder[] } | undefined;
        if (!data?.data) return old;
        return { ...data, data: data.data.map((o) => o.id === id ? { ...o, status } : o) };
      };

      qc.setQueryData(serviceKeys.landlord, patch);
      qc.setQueryData(serviceKeys.mine, patch);
      qc.setQueryData(serviceKeys.provider, patch);

      return prev;
    },
    onError: (error, _, context) => {
      if (context?.landlord) qc.setQueryData(serviceKeys.landlord, context.landlord);
      if (context?.mine)     qc.setQueryData(serviceKeys.mine, context.mine);
      if (context?.provider) qc.setQueryData(serviceKeys.provider, context.provider);
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật trạng thái.'));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.landlord });
      qc.invalidateQueries({ queryKey: serviceKeys.mine });
      qc.invalidateQueries({ queryKey: serviceKeys.provider });
    },
  });
}

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceOrderPayload) => createServiceOrderApi(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.mine });
      qc.invalidateQueries({ queryKey: serviceKeys.landlord });
      toast.success('Yêu cầu dịch vụ đã được tạo thành công!');
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạo yêu cầu dịch vụ.')),
  });
}

export function useCancelServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateServiceOrderStatusApi(id, 'cancelled'),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: serviceKeys.mine });
      const prev = qc.getQueryData(serviceKeys.mine);
      qc.setQueryData(serviceKeys.mine, (old: unknown) => {
        const data = old as { data?: ServiceOrder[] } | undefined;
        if (!data?.data) return old;
        return { ...data, data: data.data.map((o) => o.id === id ? { ...o, status: 'cancelled' as const } : o) };
      });
      return { prev };
    },
    onError: (error, _, context) => {
      if (context?.prev) qc.setQueryData(serviceKeys.mine, context.prev);
      toast.error(getApiErrorMessage(error, 'Không thể huỷ yêu cầu.'));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: serviceKeys.mine });
    },
    onSuccess: () => {
      toast.success('Đã huỷ yêu cầu dịch vụ.');
    },
  });
}

export function useCreateServicePayment() {
  return useMutation({
    mutationFn: (orderId: string) => createServicePaymentApi(orderId),
    onSuccess: (data, orderId) => {
      const url = data.data?.checkoutUrl;
      if (url) {
        sessionStorage.setItem('pendingPayment', JSON.stringify({ type: 'service', id: orderId }));
        window.location.href = url;
      } else {
        toast.error('Không nhận được liên kết thanh toán.');
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạo liên kết thanh toán.')),
  });
}
