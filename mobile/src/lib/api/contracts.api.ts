import api from '@/lib/api';
import type { Contract } from '@/types/contract';
import type { Paginated } from '@/types/property';

export async function getMyContractsApi() {
  const { data } = await api.get('/contracts/my', { params: { limit: 50 } });
  return {
    data: (data.data ?? []) as Contract[],
    pagination: data.pagination,
  } as Paginated<Contract>;
}

export async function getContractApi(id: string) {
  const { data } = await api.get(`/contracts/${id}`);
  return (data.data?.contract ?? data.data) as Contract;
}

export async function generateContractApi(input: {
  bookingId: string;
  terms?: string;
  electricityPrice?: number | null;
  waterPrice?: number | null;
  paymentMethod?: string | null;
}) {
  const { data } = await api.post('/contracts/generate', input);
  const c = (data.data?.contract ?? data.data) as Contract & { _id?: string };
  // BE generate trả về lean nên có thể thiếu `id` (chỉ có _id) → bổ sung để điều hướng đúng
  if (c && !c.id && c._id) c.id = String(c._id);
  return c as Contract;
}

export async function signContractApi(id: string) {
  const { data } = await api.patch(`/contracts/${id}/sign`);
  return (data.data?.contract ?? data.data) as Contract;
}
