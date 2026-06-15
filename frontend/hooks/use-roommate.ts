import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  upsertRoommateProfileApi,
  getMyRoommateProfileApi,
  getUserRoommateProfileApi,
  deleteRoommateProfileApi,
  getRoommateMatchesApi,
  explainRoommateMatchApi,
  sendRoommateRequestApi,
  respondRoommateRequestApi,
  cancelRoommateRequestApi,
  getMyRoommateRequestsApi,
  type UpsertProfilePayload,
} from '@/lib/api/roommate.api';
import { getApiErrorMessage } from '@/lib/api-error';
import type { RoommateRequest } from '@/types';

export const roommateKeys = {
  profile: () => ['roommate', 'profile'] as const,
  userProfile: (userId: string) => ['roommate', 'profile', userId] as const,
  matches: (page?: number) => ['roommate', 'matches', page] as const,
  requests: (type?: string, status?: string) => ['roommate', 'requests', type, status] as const,
  explain: (userId: string) => ['roommate', 'explain', userId] as const,
};

export function useRoommateUserProfile(userId: string, enabled = false) {
  return useQuery({
    queryKey: roommateKeys.userProfile(userId),
    queryFn: () => getUserRoommateProfileApi(userId),
    enabled: enabled && !!userId,
    staleTime: 120_000,
    retry: false,
  });
}

export function useMyRoommateProfile() {
  return useQuery({
    queryKey: roommateKeys.profile(),
    queryFn: getMyRoommateProfileApi,  // returns RoommateProfile | undefined directly
    retry: false,
    staleTime: 60_000,
  });
}

export function useUpsertRoommateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertProfilePayload) => upsertRoommateProfileApi(data),
    onSuccess: () => {
      toast.success('Đã lưu hồ sơ tìm bạn cùng phòng.');
      qc.invalidateQueries({ queryKey: ['roommate'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'Không thể lưu hồ sơ.')),
  });
}

export function useDeleteRoommateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRoommateProfileApi,
    onSuccess: () => {
      toast.success('Đã xoá hồ sơ tìm bạn cùng phòng.');
      qc.removeQueries({ queryKey: roommateKeys.profile() });
      qc.invalidateQueries({ queryKey: ['roommate', 'matches'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'Không thể xoá hồ sơ.')),
  });
}

export function useRoommateMatches(page = 1) {
  return useQuery({
    queryKey: roommateKeys.matches(page),
    queryFn: () => getRoommateMatchesApi({ page, limit: 12 }),
    staleTime: 60_000,
  });
}

export function useExplainRoommateMatch(userId: string, enabled = false) {
  return useQuery({
    queryKey: roommateKeys.explain(userId),
    queryFn: () => explainRoommateMatchApi(userId),
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}

export function useSendRoommateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message?: string }) =>
      sendRoommateRequestApi(userId, { message }),
    onSuccess: () => {
      toast.success('Đã gửi lời mời kết bạn cùng phòng.');
      qc.invalidateQueries({ queryKey: ['roommate', 'requests'] });
      qc.invalidateQueries({ queryKey: ['roommate', 'matches'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'Không thể gửi lời mời.')),
  });
}

export function useRespondRoommateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accepted' | 'rejected' }) =>
      respondRoommateRequestApi(id, action),
    onSuccess: (_, { action }) => {
      toast.success(action === 'accepted' ? 'Đã chấp nhận lời mời.' : 'Đã từ chối lời mời.');
      qc.invalidateQueries({ queryKey: ['roommate', 'requests'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'Không thể phản hồi lời mời.')),
  });
}

export function useCancelRoommateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelRoommateRequestApi,
    onSuccess: () => {
      toast.success('Đã thu hồi lời mời.');
      qc.invalidateQueries({ queryKey: ['roommate', 'requests'] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, 'Không thể thu hồi lời mời.')),
  });
}

export function useMyRoommateRequests(type: 'sent' | 'received' = 'received', status?: RoommateRequest['status']) {
  return useQuery({
    queryKey: roommateKeys.requests(type, status),
    queryFn: () => getMyRoommateRequestsApi({ type, status }),
    staleTime: 30_000,
  });
}
