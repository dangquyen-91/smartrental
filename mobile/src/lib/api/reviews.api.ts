import api from '@/lib/api';
import type { CreateReviewInput, PropertyReviews, Review } from '@/types/review';
import type { Paginated } from '@/types/property';

// POST /reviews → { data: { review } }
export async function createReviewApi(input: CreateReviewInput) {
  const res = await api.post('/reviews', input);
  return (res.data.data?.review ?? res.data.data) as Review;
}

// GET /reviews/property/:id → { reviews, averageRating, totalReviews, ratingDistribution, pagination }
export async function getPropertyReviewsApi(propertyId: string, page = 1) {
  const res = await api.get(`/reviews/property/${propertyId}`, { params: { page, limit: 10 } });
  return res.data as PropertyReviews;
}

// GET /reviews/mine → R.paginated (mảng ở data.data + pagination)
export async function getMyReviewsApi(): Promise<Paginated<Review>> {
  const res = await api.get('/reviews/mine');
  return { data: res.data.data ?? [], pagination: res.data.pagination };
}
