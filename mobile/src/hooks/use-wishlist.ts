import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWishlistApi, toggleWishlistApi } from '@/lib/api/users.api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';

export function useWishlist() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlistApi,
    enabled: !!accessToken,
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleWishlistApi,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(res.saved ? 'Đã lưu vào danh sách' : 'Đã bỏ khỏi danh sách');
    },
    onError: () => toast.error('Không thực hiện được, thử lại sau'),
  });
}
