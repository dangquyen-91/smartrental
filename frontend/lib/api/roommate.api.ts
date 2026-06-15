import api from '@/lib/axios';
import { type ApiResponse, type PaginatedResponse, type RoommateProfile, type RoommateRequest } from '@/types';

export interface UpsertProfilePayload {
  gender: RoommateProfile['gender'];
  budget: { min: number; max: number };
  schedule: RoommateProfile['schedule'];
  lifestyle: RoommateProfile['lifestyle'];
  cleanliness: RoommateProfile['cleanliness'];
  duration?: RoommateProfile['duration'];
  pets: RoommateProfile['pets'];
  smoking: RoommateProfile['smoking'];
  looking: boolean;
  bio?: string;
  city?: string;
}

export interface SendRequestPayload {
  message?: string;
}

export async function upsertRoommateProfileApi(data: UpsertProfilePayload) {
  const res = await api.post<ApiResponse<{ profile: RoommateProfile }>>('/roommates/profile', data);
  return res.data.data?.profile;
}

export async function getMyRoommateProfileApi() {
  const res = await api.get<ApiResponse<{ profile: RoommateProfile }>>('/roommates/profile/me');
  return res.data.data?.profile;
}

export async function deleteRoommateProfileApi() {
  const res = await api.delete<ApiResponse<null>>('/roommates/profile/me');
  return res.data;
}

export async function getRoommateMatchesApi(params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const res = await api.get<PaginatedResponse<RoommateProfile>>(`/roommates/matches?${qs}`);
  return res.data;
}

export async function explainRoommateMatchApi(userId: string) {
  const res = await api.get<ApiResponse<{ score: number; explanation: string }>>(
    `/roommates/matches/${userId}/explain`
  );
  return res.data;
}

export async function sendRoommateRequestApi(userId: string, data: SendRequestPayload) {
  const res = await api.post<ApiResponse<RoommateRequest>>(`/roommates/request/${userId}`, data);
  return res.data;
}

export async function respondRoommateRequestApi(id: string, action: 'accepted' | 'rejected') {
  const res = await api.patch<ApiResponse<RoommateRequest>>(`/roommates/request/${id}/respond`, { action });
  return res.data;
}

export async function cancelRoommateRequestApi(id: string) {
  const res = await api.patch<ApiResponse<RoommateRequest>>(`/roommates/request/${id}/cancel`);
  return res.data;
}

export async function getUserRoommateProfileApi(userId: string) {
  const res = await api.get<ApiResponse<{ profile: RoommateProfile }>>(`/roommates/profile/${userId}`);
  return res.data.data?.profile;
}

export async function getMyRoommateRequestsApi(params?: {
  type?: 'sent' | 'received';
  status?: RoommateRequest['status'];
}) {
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  if (params?.status) qs.set('status', params.status);
  const res = await api.get<PaginatedResponse<RoommateRequest>>(`/roommates/requests?${qs}`);
  return res.data;
}
