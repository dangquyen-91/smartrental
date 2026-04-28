import api from "@/lib/axios";
import { type ApiResponse, type Contract } from "@/types";

export async function getMyContractsApi() {
  const res = await api.get<ApiResponse<Contract[]>>("/contracts/my");
  return res.data;
}

export async function getLandlordContractsApi() {
  const res = await api.get<ApiResponse<Contract[]>>("/contracts/landlord");
  return res.data;
}

export async function getContractApi(id: string) {
  const res = await api.get<ApiResponse<Contract>>(`/contracts/${id}`);
  return res.data;
}

export async function createContractApi(data: { bookingId: string; terms: string }) {
  const res = await api.post<ApiResponse<Contract>>("/contracts", data);
  return res.data;
}

export async function signContractApi(id: string) {
  const res = await api.post<ApiResponse<Contract>>(`/contracts/${id}/sign`);
  return res.data;
}
