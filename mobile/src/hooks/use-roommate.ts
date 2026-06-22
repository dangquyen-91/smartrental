import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelRoommateRequestApi,
  deleteRoommateProfileApi,
  getMyRoommateProfileApi,
  getRoommateMatchesApi,
  getRoommateRequestsApi,
  respondRoommateRequestApi,
  sendRoommateRequestApi,
  upsertRoommateProfileApi,
} from '@/lib/api/roommate.api';
import { toast } from '@/stores/toast.store';

export function useMyRoommateProfile() {
  return useQuery({
    queryKey: ['roommate-profile'],
    queryFn: getMyRoommateProfileApi,
    retry: false, // 404 = chưa có hồ sơ, đừng thử lại
  });
}

export function useUpsertRoommateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertRoommateProfileApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roommate-profile'] });
      qc.invalidateQueries({ queryKey: ['roommate-matches'] });
    },
  });
}

export function useDeleteRoommateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRoommateProfileApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roommate-profile'] });
      toast.success('Đã xóa hồ sơ tìm ghép');
    },
  });
}

export function useRoommateMatches() {
  return useQuery({ queryKey: ['roommate-matches'], queryFn: getRoommateMatchesApi, retry: false });
}

export function useRoommateRequests(type: 'sent' | 'received') {
  return useQuery({
    queryKey: ['roommate-requests', type],
    queryFn: () => getRoommateRequestsApi(type),
  });
}

export function useSendRoommateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message?: string }) =>
      sendRoommateRequestApi(userId, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roommate-matches'] });
      qc.invalidateQueries({ queryKey: ['roommate-requests'] });
      toast.success('Đã gửi lời mời ghép');
    },
    onError: (e) =>
      toast.error(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Gửi lời mời thất bại',
      ),
  });
}

export function useRespondRoommateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accepted' | 'rejected' }) =>
      respondRoommateRequestApi(id, action),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['roommate-requests'] });
      toast.success(vars.action === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối');
    },
  });
}

export function useCancelRoommateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelRoommateRequestApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roommate-requests'] });
      toast.success('Đã hủy lời mời');
    },
  });
}
