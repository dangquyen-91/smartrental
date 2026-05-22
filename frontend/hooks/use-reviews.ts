import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createReviewApi,
  getPropertyReviewsApi,
  getBookingReviewsApi,
  getMyReviewsApi,
  getAllReviewsAdminApi,
  deleteReviewAdminApi,
  type CreateReviewPayload,
  type AdminReviewsParams,
} from "@/lib/api/reviews.api";
import { getApiErrorMessage } from "@/lib/api-error";

export const reviewKeys = {
  property: (id: string, page?: number)   => ["reviews", "property", id, page] as const,
  booking:  (id: string)                  => ["reviews", "booking", id]         as const,
  mine:     (page?: number)               => ["reviews", "mine", page]          as const,
  admin:    (params: AdminReviewsParams)  => ["reviews", "admin", params]       as const,
};

export function usePropertyReviews(propertyId: string, page = 1) {
  return useQuery({
    queryKey: reviewKeys.property(propertyId, page),
    queryFn: () => getPropertyReviewsApi(propertyId, page),
    enabled: !!propertyId,
    staleTime: 60_000,
  });
}

export function useBookingReviews(bookingId: string, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.booking(bookingId),
    queryFn: () => getBookingReviewsApi(bookingId),
    enabled: !!bookingId && enabled,
  });
}

export function useMyReviews(page = 1) {
  return useQuery({
    queryKey: reviewKeys.mine(page),
    queryFn: () => getMyReviewsApi(page),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReviewPayload) => createReviewApi(data),
    onSuccess: () => {
      toast.success("Đánh giá đã được gửi thành công!");
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Không thể gửi đánh giá. Vui lòng thử lại.")),
  });
}

// ─── Admin hooks ──────────────────────────────────────────────────────────────

export function useAllReviewsAdmin(params: AdminReviewsParams = {}) {
  return useQuery({
    queryKey: reviewKeys.admin(params),
    queryFn: () => getAllReviewsAdminApi(params),
    staleTime: 0,
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReviewAdminApi(id),
    onSuccess: () => {
      toast.success("Đã xoá đánh giá.");
      qc.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Không thể xoá đánh giá.")),
  });
}
