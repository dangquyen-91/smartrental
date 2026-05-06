import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPropertiesApi,
  getPropertyApi,
  getMyPropertiesApi,
  createPropertyApi,
  updatePropertyApi,
  deletePropertyApi,
  type PropertyFilters,
} from "@/lib/api/properties.api";
import { getApiErrorMessage } from "@/lib/api-error";
import { type Property } from "@/types";

export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (filters?: PropertyFilters) => [...propertyKeys.lists(), filters] as const,
  details: () => [...propertyKeys.all, "detail"] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
  mine: () => [...propertyKeys.all, "mine"] as const,
};

export function useProperties(filters?: PropertyFilters) {
  return useQuery({
    queryKey: propertyKeys.list(filters),
    queryFn: () => getPropertiesApi(filters),
    placeholderData: keepPreviousData,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => getPropertyApi(id),
    enabled: !!id,
  });
}

export function useMyProperties() {
  return useQuery({
    queryKey: propertyKeys.mine(),
    queryFn: getMyPropertiesApi,
  });
}

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPropertyApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: propertyKeys.lists() });
      qc.invalidateQueries({ queryKey: propertyKeys.mine() });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạo bất động sản.')),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Property> }) =>
      updatePropertyApi(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: propertyKeys.detail(id) });
      qc.invalidateQueries({ queryKey: propertyKeys.lists() });
      qc.invalidateQueries({ queryKey: propertyKeys.mine() });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể cập nhật bất động sản.')),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePropertyApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: propertyKeys.lists() });
      qc.invalidateQueries({ queryKey: propertyKeys.mine() });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể xoá bất động sản.')),
  });
}
