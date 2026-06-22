import api from '@/lib/api';
import type {
  RoommateMatch,
  RoommateProfile,
  RoommateRequest,
  UpsertProfileInput,
} from '@/types/roommate';
import type { Paginated } from '@/types/property';

// GET /roommates/profile/me → { profile } (404 nếu chưa có)
export async function getMyRoommateProfileApi() {
  const { data } = await api.get('/roommates/profile/me');
  return (data.data?.profile ?? data.data) as RoommateProfile;
}

// POST /roommates/profile → { profile }
export async function upsertRoommateProfileApi(input: UpsertProfileInput) {
  const { data } = await api.post('/roommates/profile', input);
  return (data.data?.profile ?? data.data) as RoommateProfile;
}

// DELETE /roommates/profile/me
export async function deleteRoommateProfileApi() {
  await api.delete('/roommates/profile/me');
}

// GET /roommates/matches → R.paginated
export async function getRoommateMatchesApi(): Promise<Paginated<RoommateMatch>> {
  const { data } = await api.get('/roommates/matches', { params: { limit: 30 } });
  return { data: data.data ?? [], pagination: data.pagination };
}

// GET /roommates/matches/:userId/explain → { score, explanation }
export async function explainRoommateMatchApi(userId: string) {
  const { data } = await api.get(`/roommates/matches/${userId}/explain`);
  return data.data as { score: number; explanation: string };
}

// GET /roommates/requests?type=sent|received → R.paginated
export async function getRoommateRequestsApi(type: 'sent' | 'received'): Promise<Paginated<RoommateRequest>> {
  const { data } = await api.get('/roommates/requests', { params: { type, limit: 50 } });
  return { data: data.data ?? [], pagination: data.pagination };
}

// POST /roommates/request/:userId → { request }
export async function sendRoommateRequestApi(userId: string, message?: string) {
  const { data } = await api.post(`/roommates/request/${userId}`, { message });
  return (data.data?.request ?? data.data) as RoommateRequest;
}

// PATCH /roommates/request/:id/respond → { request }
export async function respondRoommateRequestApi(id: string, action: 'accepted' | 'rejected') {
  const { data } = await api.patch(`/roommates/request/${id}/respond`, { action });
  return (data.data?.request ?? data.data) as RoommateRequest;
}

// PATCH /roommates/request/:id/cancel
export async function cancelRoommateRequestApi(id: string) {
  const { data } = await api.patch(`/roommates/request/${id}/cancel`);
  return (data.data?.request ?? data.data) as RoommateRequest;
}
