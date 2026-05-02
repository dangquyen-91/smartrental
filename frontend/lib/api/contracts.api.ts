import api from "@/lib/axios";
import { type ApiResponse, type Contract } from "@/types";

export async function getMyContractsApi() {
  const res = await api.get<ApiResponse<Contract[]>>("/contracts/my");
  return res.data;
}

export async function getContractApi(id: string) {
  const res = await api.get<ApiResponse<Contract>>(`/contracts/${id}`);
  return res.data;
}

export async function getContractByBookingApi(bookingId: string) {
  const res = await api.get<ApiResponse<Contract>>(`/contracts/booking/${bookingId}`);
  return res.data;
}

export async function generateContractApi(data: { bookingId: string; terms?: string }) {
  const res = await api.post<ApiResponse<Contract>>("/contracts/generate", data);
  return res.data;
}

export async function signContractApi(id: string) {
  const res = await api.patch<ApiResponse<Contract>>(`/contracts/${id}/sign`);
  return res.data;
}
