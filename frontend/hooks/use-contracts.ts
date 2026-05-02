import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getMyContractsApi,
  getContractApi,
  getContractByBookingApi,
  generateContractApi,
  signContractApi,
} from "@/lib/api/contracts.api";
import { getApiErrorMessage } from "@/lib/api-error";

export const contractKeys = {
  mine: () => ["contracts", "mine"] as const,
  detail: (id: string) => ["contracts", "detail", id] as const,
  byBooking: (bookingId: string) => ["contracts", "booking", bookingId] as const,
};

export function useMyContracts() {
  return useQuery({
    queryKey: contractKeys.mine(),
    queryFn: getMyContractsApi,
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => getContractApi(id),
    enabled: !!id,
  });
}

export function useContractByBooking(bookingId: string) {
  return useQuery({
    queryKey: contractKeys.byBooking(bookingId),
    queryFn: () => getContractByBookingApi(bookingId),
    enabled: !!bookingId,
  });
}

export function useGenerateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: generateContractApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Hợp đồng đã được tạo thành công.");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Không thể tạo hợp đồng.")),
  });
}

export function useSignContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: signContractApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Không thể ký hợp đồng.")),
  });
}
