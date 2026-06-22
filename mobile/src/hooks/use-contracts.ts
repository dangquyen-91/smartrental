import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  generateContractApi,
  getContractApi,
  getMyContractsApi,
  signContractApi,
} from '@/lib/api/contracts.api';

export function useMyContracts() {
  return useQuery({
    queryKey: ['my-contracts'],
    queryFn: getMyContractsApi,
  });
}

export function useContract(id?: string) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: () => getContractApi(id as string),
    enabled: !!id,
  });
}

export function useGenerateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generateContractApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-contracts'] });
      qc.invalidateQueries({ queryKey: ['landlord-bookings'] });
    },
  });
}

export function useSignContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signContractApi,
    onSuccess: (_res, id) => {
      qc.invalidateQueries({ queryKey: ['my-contracts'] });
      qc.invalidateQueries({ queryKey: ['contract', id] });
    },
  });
}
