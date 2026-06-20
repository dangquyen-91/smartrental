'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Loader2, Trash2, Star, AlertTriangle, Building2, User as UserIcon } from 'lucide-react';
import { useAllReviewsAdmin, useDeleteReview } from '@/hooks/use-reviews';
import type { Review, ReviewTargetRef, User } from '@/types';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────


function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            'w-3.5 h-3.5',
            s <= rating ? 'text-amber-400 fill-amber-400' : 'text-[#dddddd] fill-[#dddddd]',
          )}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-[#222222]">{rating}/5</span>
    </span>
  );
}

// ─── Target label ─────────────────────────────────────────────────────────────

function TargetInfo({
  targetType,
  targetRef,
}: {
  targetType: Review['targetType'];
  targetRef?: ReviewTargetRef | null;
}) {
  if (!targetRef) return null;

  if (targetType === 'property') {
    const addr = targetRef.address;
    const location = [addr?.street, addr?.district, addr?.city].filter(Boolean).join(', ');
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-[#444444]">
        <Building2 className="w-3 h-3 text-[#929292] shrink-0" />
        <span className="font-medium">{targetRef.title ?? '—'}</span>
        {location && <span className="text-[#929292]">· {location}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[#444444]">
      <UserIcon className="w-3 h-3 text-[#929292] shrink-0" />
      <span className="font-medium">{targetRef.name ?? '—'}</span>
      {targetRef.email && <span className="text-[#929292]">· {targetRef.email}</span>}
    </span>
  );
}

function ReviewerAvatar({ reviewer }: { reviewer: Review['reviewer'] }) {
  if (!reviewer || typeof reviewer === 'string') {
    return (
      <div className="w-8 h-8 rounded-full bg-[#ebebeb] flex items-center justify-center shrink-0">
        <span className="text-xs text-[#6a6a6a]">?</span>
      </div>
    );
  }
  const u = reviewer as User;
  return (
    <div className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center text-white text-xs font-semibold shrink-0 overflow-hidden">
      {u.avatar ? (
        <Image src={u.avatar} alt={u.name} width={32} height={32} className="w-full h-full object-cover" />
      ) : (
        u.name?.charAt(0).toUpperCase() ?? '?'
      )}
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  review,
  onConfirm,
  onCancel,
  isPending,
}: {
  review: Review;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const reviewer = typeof review.reviewer === 'object' ? review.reviewer : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-[20px] p-6 w-full max-w-sm shadow-xl">
        <div className="w-12 h-12 rounded-full bg-[#fff1f2] flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-[#e11d48]" />
        </div>

        <h3 className="text-[17px] font-bold text-[#222222] text-center mb-1">
          Xoá đánh giá này?
        </h3>
        <p className="text-sm text-[#6a6a6a] text-center mb-5">
          Đánh giá của{' '}
          <span className="font-semibold text-[#222222]">{reviewer?.name ?? 'người dùng'}</span>{' '}
          sẽ bị ẩn khỏi hệ thống. Hành động này không thể hoàn tác.
        </p>

        {/* Preview */}
        <div className="bg-[#f7f7f7] rounded-[10px] p-3 mb-5 space-y-1.5">
          <StarRow rating={review.rating} />
          {review.comment && (
            <p className="text-sm text-[#444444] line-clamp-2">{review.comment}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-[10px] hover:bg-[#f7f7f7] transition-colors disabled:opacity-50"
          >
            Giữ lại
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#e11d48] hover:bg-[#be123c] rounded-[10px] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Đang xoá...' : 'Xoá'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ReviewRow({
  review,
  onDelete,
}: {
  review: Review;
  onDelete: (r: Review) => void;
}) {
  const reviewer = typeof review.reviewer === 'object' ? review.reviewer : null;

  return (
    <div className="px-5 py-4 border-b border-[#ebebeb] last:border-0 hover:bg-[#fafafa] transition-colors">
      <div className="flex items-start gap-4">
        {/* Reviewer info */}
        <ReviewerAvatar reviewer={review.reviewer} />

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Top row: name */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[#222222]">
              {reviewer?.name ?? '—'}
            </span>
            {reviewer?.email && (
              <span className="text-[11px] text-[#929292]">{reviewer.email}</span>
            )}
          </div>

          {/* Target entity */}
          <TargetInfo targetType={review.targetType} targetRef={review.targetRef} />

          {/* Stars */}
          <StarRow rating={review.rating} />

          {/* Comment */}
          {review.comment ? (
            <p className="text-sm text-[#444444] leading-relaxed line-clamp-3">
              {review.comment}
            </p>
          ) : (
            <p className="text-sm text-[#929292] italic">Không có nhận xét</p>
          )}

          {/* Date */}
          <p className="text-xs text-[#929292]">{fmtDate(review.createdAt)}</p>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(review)}
          title="Xoá đánh giá"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-[8px] text-[#929292] hover:bg-[#fff1f2] hover:text-[#e11d48] transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <div className="animate-pulse px-5 py-4 border-b border-[#ebebeb] flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-[#ebebeb] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <div className="h-4 bg-[#ebebeb] rounded w-28" />
          <div className="h-4 bg-[#ebebeb] rounded w-16" />
        </div>
        <div className="h-3.5 bg-[#ebebeb] rounded w-20" />
        <div className="h-3.5 bg-[#ebebeb] rounded w-full" />
        <div className="h-3.5 bg-[#ebebeb] rounded w-2/3" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TargetTypeFilter = '' | 'property' | 'landlord' | 'tenant';

const TARGET_TYPE_OPTIONS: { label: string; value: TargetTypeFilter }[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Phòng / BĐS', value: 'property' },
  { label: 'Chủ trọ', value: 'landlord' },
  { label: 'Người thuê', value: 'tenant' },
];

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [targetType, setTargetType] = useState<TargetTypeFilter>('');
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  const handleFilterChange = useCallback((v: TargetTypeFilter) => {
    setTargetType(v);
    setPage(1);
  }, []);

  const { data, isLoading, isFetching } = useAllReviewsAdmin({
    page,
    limit: 20,
    ...(targetType ? { targetType } : {}),
  });

  const reviews    = data?.data ?? [];
  const pagination = data?.pagination;
  const hasLowRating = !isLoading && reviews.some((r) => r.rating <= 2);

  const { mutate: deleteReview, isPending: isDeleting } = useDeleteReview();

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteReview(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222222]">Đánh giá</h1>
          <p className="text-sm text-[#6a6a6a] mt-0.5">
            {pagination ? `${pagination.total} đánh giá` : 'Đang tải...'}
          </p>
        </div>
        {isFetching && !isLoading && (
          <Loader2 className="w-5 h-5 animate-spin text-[#929292]" />
        )}
      </div>

      {/* Low-rating warning — đầu trang để dễ thấy */}
      {hasLowRating && (
        <div className="flex items-start gap-3 px-4 py-3 bg-[#fff7ed] border border-[#fed7aa] rounded-[10px]">
          <AlertTriangle className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
          <p className="text-sm text-[#9a3412]">
            Có đánh giá xếp hạng thấp (1–2 sao) trên trang này. Cân nhắc kiểm tra và xoá nếu vi phạm.
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-card border border-[#dddddd] p-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm text-[#6a6a6a] font-medium">Lọc theo:</span>
        <div className="flex flex-wrap items-center gap-1 bg-[#f7f7f7] rounded-[8px] p-1">
          {TARGET_TYPE_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              className={cn(
                'px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all whitespace-nowrap',
                targetType === value
                  ? 'bg-white text-[#222222] shadow-sm'
                  : 'text-[#929292] hover:text-[#6a6a6a]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] border border-[#dddddd] overflow-hidden">
        {/* Column header */}
        <div className="grid grid-cols-[1fr_auto] px-5 py-3 bg-[#f7f7f7] border-b border-[#ebebeb]">
          <span className="text-xs font-semibold text-[#6a6a6a] uppercase tracking-wider">Đánh giá</span>
          <span className="text-xs font-semibold text-[#6a6a6a] uppercase tracking-wider">Hành động</span>
        </div>

        {/* Rows */}
        {isLoading ? (
          <>{[0,1,2,3,4].map(i => <RowSkeleton key={i} />)}</>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f7f7f7] flex items-center justify-center mb-3">
              <Star className="w-6 h-6 text-[#dddddd]" />
            </div>
            <p className="text-sm font-semibold text-[#222222] mb-1">Không có đánh giá nào</p>
            <p className="text-sm text-[#929292]">
              {targetType ? 'Không có đánh giá nào phù hợp với bộ lọc.' : 'Hệ thống chưa có đánh giá nào.'}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewRow key={review.id} review={review} onDelete={setDeleteTarget} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#6a6a6a]">
            Trang {pagination.page} / {pagination.totalPages}
            <span className="ml-2 text-[#929292]">({pagination.total} đánh giá)</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1 || isFetching}
              className="px-3 py-1.5 text-sm font-medium text-[#222222] border border-[#dddddd] rounded-[8px] hover:bg-[#f7f7f7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Trước
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages || isFetching}
              className="px-3 py-1.5 text-sm font-medium text-[#222222] border border-[#dddddd] rounded-[8px] hover:bg-[#f7f7f7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          review={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isPending={isDeleting}
        />
      )}
    </div>
  );
}
