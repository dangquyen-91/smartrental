import api from '@/lib/axios';
import type { ApiResponse, User } from '@/types';

export const updateBankAccountApi = async (
  userId: string,
  payload: { bankName: string; accountNumber: string; accountName: string; branch?: string },
): Promise<User> => {
  const { data } = await api.put<ApiResponse<{ user: User }>>(`/users/${userId}/bank-account`, payload);
  return data.data.user;
};
