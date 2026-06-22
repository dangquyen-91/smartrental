import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreatePropertyInput,
  deletePropertyApi,
  getMyListingsApi,
  getPropertiesApi,
  getPropertyApi,
  updatePropertyApi,
} from '@/lib/api/properties.api';
import type { Property, PropertyFilters } from '@/types/property';

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => getPropertiesApi(filters),
  });
}

export function useProperty(id?: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => getPropertyApi(id as string),
    enabled: !!id,
  });
}

export function useMyListings() {
  return useQuery({
    queryKey: ['my-listings'],
    queryFn: getMyListingsApi,
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePropertyApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreatePropertyInput> & { status?: Property['status'] };
    }) => updatePropertyApi(id, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['property', vars.id] });
    },
  });
}
