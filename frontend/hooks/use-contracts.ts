import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMyContractsApi,
  getLandlordContractsApi,
  getContractApi,
  createContractApi,
  signContractApi,
} from "@/lib/api/contracts.api";
import { getApiErrorMessage } from "@/lib/api-error";

export const contractKeys = {
  mine: () => ["contracts", "mine"] as const,
  landlord: () => ["contracts", "landlord"] as const,
  detail: (id: string) => ["contracts", "detail", id] as const,
};

export function useMyContracts() {
  return useQuery({
    queryKey: contractKeys.mine(),
    queryFn: getMyContractsApi,
  });
}

export function useLandlordContracts() {
  return useQuery({
    queryKey: contractKeys.landlord(),
    queryFn: getLandlordContractsApi,
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => getContractApi(id),
    enabled: !!id,
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createContractApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contracts"] }),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạo hợp đồng.')),
  });
}

export function useSignContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signContractApi,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: contractKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể ký hợp đồng.')),
  });
}
