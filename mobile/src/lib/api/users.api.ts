import api from '@/lib/api';
import type { BankAccount, User } from '@/types/auth';
import type { Property } from '@/types/property';

export async function updateBankAccountApi(userId: string, data: BankAccount) {
  const res = await api.put(`/users/${userId}/bank-account`, data);
  return (res.data.data?.user ?? res.data.data) as User;
}

// ─── Sửa hồ sơ ─────────────────────────────────────────────────────────────────
export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string; // YYYY-MM-DD
  address?: string;
}

export async function updateProfileApi(userId: string, data: UpdateProfileInput) {
  const res = await api.put(`/users/${userId}`, data);
  return (res.data.data?.user ?? res.data.data) as User;
}

// ─── Đổi mật khẩu ──────────────────────────────────────────────────────────────
export async function changePasswordApi(
  userId: string,
  data: { currentPassword: string; newPassword: string },
) {
  await api.put(`/users/${userId}/password`, data);
}

// ─── Wishlist (tin đã lưu) ─────────────────────────────────────────────────────
export async function toggleWishlistApi(propertyId: string) {
  const res = await api.post(`/users/wishlist/${propertyId}/toggle`);
  return res.data.data as { saved: boolean; count: number };
}

export async function getWishlistApi() {
  const res = await api.get('/users/wishlist');
  return (res.data.data?.properties ?? res.data.data ?? []) as Property[];
}
