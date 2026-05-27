"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarInput } from "@/components/shared/star-rating";
import { useCreateReview, useBookingReviews } from "@/hooks/use-reviews";

interface ReviewFormModalProps {
  bookingId: string;
  propertyTitle: string;
  onClose: () => void;
}

export function ReviewFormModal({ bookingId, propertyTitle, onClose }: ReviewFormModalProps) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState("");

  const { data: reviewsData, isLoading } = useBookingReviews(bookingId, true);
  const existingReview = reviewsData?.data?.reviews?.find(
    (r) => r.targetType === "property" && r.isOwn,
  );

  const { mutate: submit, isPending, isSuccess } = useCreateReview();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = () => {
    if (rating === 0) return;
    submit({ bookingId, targetType: "property", rating, comment: comment.trim() || undefined });
  };

  const done = isSuccess || !!existingReview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white rounded-panel shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebebeb]">
          <h2 className="text-base font-bold text-[#222222]">Đánh giá phòng</h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full hover:bg-[#f7f8f0] transition-colors"
          >
            <X className="size-5 text-[#222222]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-[#929292]" />
            </div>
          ) : done ? (
            /* Already reviewed */
            <div className="flex items-center gap-3 py-4 px-4 bg-emerald-50 rounded-[10px] border border-emerald-100">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Đã đánh giá</p>
                {existingReview && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {existingReview.rating} ⭐ · {existingReview.comment ?? "Không có nhận xét"}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#929292]">
                Đánh giá:{" "}
                <span className="font-semibold text-[#222222]">{propertyTitle}</span>
              </p>

              <StarInput
                value={rating}
                onChange={setRating}
                disabled={isPending}
                className="w-full"
              />

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                placeholder="Nhận xét của bạn (không bắt buộc)..."
                rows={3}
                disabled={isPending}
                className={cn(
                  "w-full resize-none rounded-[10px] border border-[#dddddd] px-3.5 py-2.5",
                  "text-sm text-[#222222] placeholder:text-[#929292]",
                  "focus:outline-none focus:border-[#222222] transition-colors",
                  "disabled:opacity-60",
                )}
              />
              {comment.length > 0 && (
                <p className="text-xs text-[#929292] text-right -mt-2">{comment.length}/1000</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={rating === 0 || isPending}
                className={cn(
                  "w-full py-2.5 rounded-[10px] text-sm font-semibold transition-colors",
                  "bg-[#222222] text-white hover:bg-[#333333]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2",
                )}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isPending ? "Đang gửi..." : "Gửi đánh giá"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <p className="text-xs text-[#929292] text-center">
            Đánh giá giúp cộng đồng SmartRental tin tưởng và an toàn hơn
          </p>
        </div>
      </div>
    </div>
  );
}
