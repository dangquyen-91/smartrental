"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageSquare, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarDisplay } from "@/components/shared/star-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { usePropertyReviews } from "@/hooks/use-reviews";
import type { Review } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  if (days < 30) return `${days} ngày trước`;
  if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
  return `${Math.floor(days / 365)} năm trước`;
}

// ─── Rating distribution bar ──────────────────────────────────────────────────

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-6 text-right text-ash-gray shrink-0">{star}</span>
      <div className="flex-1 h-1.5 bg-[#ebebeb] rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-xs text-ash-gray shrink-0">{count}</span>
    </div>
  );
}

// ─── Single review card ───────────────────────────────────────────────────────

export function ReviewCard({ review }: { review: Review }) {
  const reviewer = typeof review.reviewer === "object" ? review.reviewer : null;
  const initial  = reviewer?.name?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="py-5 border-b border-hairline-gray last:border-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="size-9 rounded-full bg-ink-black flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
          {reviewer?.avatar ? (
            <Image
              src={reviewer.avatar}
              alt={reviewer.name}
              width={36}
              height={36}
              className="size-full object-cover"
            />
          ) : (
            initial
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold text-ink-black">
              {reviewer?.name ?? "Người dùng"}
            </span>
            <span className="text-xs text-ash-gray shrink-0">
              {formatRelative(review.createdAt)}
            </span>
          </div>

          <StarDisplay rating={review.rating} size="sm" className="mt-0.5 mb-1.5" />

          {review.comment ? (
            <p className="text-sm text-charcoal leading-relaxed">{review.comment}</p>
          ) : (
            <p className="text-sm text-ash-gray italic">Không có nhận xét</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ReviewSkeleton() {
  return (
    <div className="py-5 border-b border-hairline-gray">
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      </div>
    </div>
  );
}

// ─── Property review section (exported) ──────────────────────────────────────

interface PropertyReviewSectionProps {
  propertyId: string;
  className?: string;
}

export function PropertyReviewSection({ propertyId, className }: PropertyReviewSectionProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePropertyReviews(propertyId, page);

  const avg   = data?.averageRating;
  const total = data?.totalReviews ?? 0;
  const dist  = data?.ratingDistribution;
  const hasMore = data ? page < data.pagination.totalPages : false;

  return (
    <section
      id="reviews"
      className={cn("py-7 border-b border-hairline-gray", className)}
    >
      {/* Section header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-lg font-semibold text-ink-black">Đánh giá</h2>
        {total > 0 && (
          <span className="text-base text-ash-gray font-normal">({total})</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-0">
          {/* Summary skeleton */}
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            <Skeleton className="h-20 w-32" />
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((s) => <Skeleton key={s} className="h-3 w-full" />)}
            </div>
          </div>
          {[1, 2, 3].map((i) => <ReviewSkeleton key={i} />)}
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="size-12 bg-soft-cloud rounded-full flex items-center justify-center mb-3">
            <MessageSquare className="size-6 text-hairline-gray" />
          </div>
          <p className="text-sm font-semibold text-ink-black mb-1">Chưa có đánh giá</p>
          <p className="text-sm text-ash-gray">Hãy là người đầu tiên chia sẻ trải nghiệm!</p>
        </div>
      ) : (
        <>
          {/* Summary: big score + bars */}
          <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-hairline-gray mb-1">
            {/* Big number */}
            <div className="flex flex-col items-center justify-center bg-soft-cloud rounded-[14px] p-5 min-w-[110px]">
              <span className="text-4xl font-bold text-ink-black leading-none">
                {avg?.toFixed(1) ?? "—"}
              </span>
              <StarDisplay rating={avg ?? 0} size="sm" className="mt-2" />
              <span className="text-xs text-ash-gray mt-1">{total} đánh giá</span>
            </div>

            {/* Distribution bars */}
            {dist && (
              <div className="flex-1 flex flex-col justify-center gap-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar
                    key={star}
                    star={star}
                    count={dist[star] ?? 0}
                    total={total}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Review list */}
          <div>
            {data?.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>

          {/* Load more */}
          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-ink-black hover:text-rausch transition-colors"
            >
              <ChevronDown className="size-4" />
              Xem thêm đánh giá
            </button>
          )}
        </>
      )}
    </section>
  );
}

// ─── Compact inline star summary (for property card / header) ─────────────────

interface StarSummaryProps {
  averageRating: number | null;
  totalReviews: number;
  size?: "sm" | "md";
  className?: string;
}

export function StarSummary({ averageRating, totalReviews, size = "sm", className }: StarSummaryProps) {
  if (!averageRating || totalReviews === 0) return null;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <StarDisplay rating={averageRating} size={size} />
      <span className="text-xs text-ash-gray">
        {averageRating.toFixed(1)} ({totalReviews})
      </span>
    </span>
  );
}
