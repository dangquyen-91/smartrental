import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toggleWishlistApi, getWishlistApi } from '@/lib/api/users.api';
import { useAuthStore } from '@/stores/auth.store';
import { getApiErrorMessage } from '@/lib/api-error';

export const wishlistKeys = {
  all: () => ['wishlist'] as const,
};

export function useWishlist() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: wishlistKeys.all(),
    queryFn: getWishlistApi,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
    select: (properties) => properties.map((p) => p.id),
  });
}

export function useToggleWishlist(propertyId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => toggleWishlistApi(propertyId),
    onMutate: async () => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: wishlistKeys.all() });
      const prev = qc.getQueryData<string[]>(wishlistKeys.all());

      qc.setQueryData<string[]>(wishlistKeys.all(), (old = []) => {
        const isSaved = old.includes(propertyId);
        return isSaved ? old.filter((id) => id !== propertyId) : [...old, propertyId];
      });

      return { prev };
    },
    onSuccess: (result) => {
      if (result.saved) {
        toast.success('Đã lưu vào danh sách yêu thích');
      } else {
        toast('Đã xoá khỏi danh sách yêu thích');
      }
    },
    onError: (err, _vars, ctx) => {
      // Roll back on error
      if (ctx?.prev !== undefined) {
        qc.setQueryData(wishlistKeys.all(), ctx.prev);
      }
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật danh sách yêu thích.'));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: wishlistKeys.all() });
    },
  });
}
