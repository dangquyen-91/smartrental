import api from '@/lib/axios';
import type { ApiResponse, User } from '@/types';

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, 'name' | 'email' | 'role' | 'avatar'> & { id: string };
}

export const loginApi = async (email: string, password: string): Promise<AuthData> => {
  const { data } = await api.post<ApiResponse<AuthData>>('/auth/login', { email, password });
  return data.data;
};

export const registerApi = async (payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthData> => {
  const { data } = await api.post<ApiResponse<AuthData>>('/auth/register', payload);
  return data.data;
};

export const googleLoginApi = async (googleAccessToken: string): Promise<AuthData> => {
  const { data } = await api.post<ApiResponse<AuthData>>('/auth/google', { googleAccessToken });
  return data.data;
};

export const logoutApi = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getMeApi = async (): Promise<User> => {
  const { data } = await api.get<ApiResponse<{ user: User }>>('/auth/me');
  return data.data.user;
};
