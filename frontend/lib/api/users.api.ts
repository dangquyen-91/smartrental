import api from '@/lib/axios';
import type { ApiResponse, Property, User } from '@/types';

export const updateBankAccountApi = async (
  userId: string,
  payload: { bankName: string; accountNumber: string; accountName: string; branch?: string },
): Promise<User> => {
  const { data } = await api.put<ApiResponse<{ user: User }>>(`/users/${userId}/bank-account`, payload);
  return data.data.user;
};

export const toggleWishlistApi = async (
  propertyId: string,
): Promise<{ saved: boolean; count: number }> => {
  const { data } = await api.post<ApiResponse<{ saved: boolean; count: number }>>(
    `/users/wishlist/${propertyId}/toggle`,
  );
  return data.data;
};

export const getWishlistApi = async (): Promise<Property[]> => {
  const { data } = await api.get<ApiResponse<{ properties: Property[] }>>('/users/wishlist');
  return data.data.properties;
};
