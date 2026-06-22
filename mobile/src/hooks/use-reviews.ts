import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createReviewApi, getMyReviewsApi, getPropertyReviewsApi } from '@/lib/api/reviews.api';

export function usePropertyReviews(propertyId?: string, page = 1) {
  return useQuery({
    queryKey: ['property-reviews', propertyId, page],
    queryFn: () => getPropertyReviewsApi(propertyId as string, page),
    enabled: !!propertyId,
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: ['my-reviews'],
    queryFn: getMyReviewsApi,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReviewApi,
    onSuccess: (review) => {
      qc.invalidateQueries({ queryKey: ['my-reviews'] });
      qc.invalidateQueries({ queryKey: ['property-reviews', review.target] });
    },
  });
}
