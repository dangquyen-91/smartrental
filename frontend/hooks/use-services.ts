import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyServiceOrdersApi,
  getProviderServiceOrdersApi,
  getServiceOrderApi,
  createServiceOrderApi,
  updateServiceStatusApi,
  cancelServiceOrderApi,
  type CreateServiceOrderPayload,
} from "@/lib/api/services.api";
import { type ServiceOrder } from "@/types";

export const serviceKeys = {
  mine: (status?: ServiceOrder["status"]) => ["services", "mine", status] as const,
  provider: (status?: ServiceOrder["status"]) => ["services", "provider", status] as const,
  detail: (id: string) => ["services", "detail", id] as const,
};

export function useMyServiceOrders(status?: ServiceOrder["status"]) {
  return useQuery({
    queryKey: serviceKeys.mine(status),
    queryFn: () => getMyServiceOrdersApi(status),
  });
}

export function useProviderServiceOrders(status?: ServiceOrder["status"]) {
  return useQuery({
    queryKey: serviceKeys.provider(status),
    queryFn: () => getProviderServiceOrdersApi(status),
  });
}

export function useServiceOrder(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: () => getServiceOrderApi(id),
    enabled: !!id,
  });
}

export function useCreateServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceOrderPayload) => createServiceOrderApi(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}

export function useUpdateServiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceOrder["status"] }) =>
      updateServiceStatusApi(id, status),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: serviceKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["services"] });
    },
  });
}

export function useCancelServiceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelServiceOrderApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }),
  });
}
