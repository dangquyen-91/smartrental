export interface ReviewReviewer {
  id: string;
  name: string;
  avatar?: string | null;
  role?: string;
}

export interface Review {
  id: string;
  booking: string | { id: string; startDate?: string; endDate?: string };
  reviewer: ReviewReviewer | string;
  reviewerRole: 'tenant' | 'landlord';
  targetType: 'property' | 'landlord' | 'tenant';
  target: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface CreateReviewInput {
  bookingId: string;
  targetType: 'property';
  rating: number;
  comment?: string;
}

export interface PropertyReviews {
  reviews: Review[];
  averageRating: number | null;
  totalReviews: number;
  ratingDistribution: Record<string, number> | null;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
