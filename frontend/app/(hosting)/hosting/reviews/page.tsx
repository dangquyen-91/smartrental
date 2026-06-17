'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Star, Loader2, MapPin, ChevronLeft, ChevronRight, MessageSquare,
  BedDouble, Bath, Maximize2, Tag, Home, Eye, CalendarDays, User2,
} from 'lucide-react';
import { useMyPropertiesReviews } from '@/hooks/use-reviews';
import type { LandlordReview, LandlordReviewTarget } from '@/lib/api/reviews.api';

// ─── constants ────────────────────────────────────────────────────────────────

const RATING_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: '5',   label: '5 sao' },
  { key: '4',   label: '4 sao' },
  { key: '3',   label: '3 sao' },
  { key: '2',   label: '2 sao' },
  { key: '1',   label: '1 sao' },
] as const;

type RatingFilter = (typeof RATING_FILTERS)[number]['key'];

const TYPE_LABEL: Record<NonNullable<LandlordReviewTarget['type']>, string> = {
  room:      'Phòng trọ',
  apartment: 'Căn hộ',
  house:     'Nhà nguyên căn',
  studio:    'Studio',
};

const STATUS_CONFIG: Record<NonNullable<LandlordReviewTarget['status']>, { label: string; cls: string }> = {
  available:   { label: 'Còn trống',     cls: 'bg-emerald-50 text-emerald-700' },
  rented:      { label: 'Đang cho thuê', cls: 'bg-blue-50 text-blue-700' },
  maintenance: { label: 'Bảo trì',       cls: 'bg-amber-50 text-amber-700' },
};

const PAGE_SIZE = 10;

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(d: string) {
  const date = new Date(d);
  const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} • ${timeStr}`;
}

function formatPrice(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + ' triệu';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k';
  return new Intl.NumberFormat('vi-VN').format(n);
}

function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= Math.round(value) ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-[#DDDDDD]'}
        />
      ))}
    </div>
  );
}

function ReviewerAvatar({ name, avatar, size = 44 }: { name?: string; avatar?: string; size?: number }) {
  const initial = name?.charAt(0).toUpperCase() ?? '?';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name ?? ''}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-[#2683EB] text-white text-sm font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}

// ─── lightbox ─────────────────────────────────────────────────────────────────

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: { url: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  setIdx((i) => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % images.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [images.length, onClose]);

  if (!images.length) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl leading-none transition-colors z-10"
        aria-label="Đóng"
      >
        ×
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
            className="absolute left-4 size-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
            className="absolute right-4 size-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            aria-label="Ảnh sau"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}

      <img
        src={images[idx].url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[85vh] object-contain rounded-lg"
      />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs">
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

// ─── property gallery ─────────────────────────────────────────────────────────

function PropertyGallery({
  images,
  title,
}: {
  images: { url: string }[];
  title: string;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!images.length) {
    return (
      <div className="w-full sm:w-64 h-44 sm:h-44 rounded-[12px] bg-gradient-to-br from-[#F0F0F0] to-[#E0E0E0] flex items-center justify-center text-[#929292] text-xs">
        Chưa có ảnh
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <>
        <button
          onClick={() => setLightboxIdx(0)}
          className="block w-full sm:w-64 aspect-[4/3] rounded-[12px] overflow-hidden bg-[#F0F0F0] group relative"
        >
          <img src={images[0].url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
            <Eye className="size-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
        {lightboxIdx !== null && (
          <ImageLightbox images={images} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
        )}
      </>
    );
  }

  const main = images[0];
  const rest = images.slice(1, 3);
  const remaining = images.length - 3;

  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 w-full sm:w-64 h-44 sm:h-44 rounded-[12px] overflow-hidden">
        <button
          onClick={() => setLightboxIdx(0)}
          className="col-span-1 row-span-2 bg-[#F0F0F0] overflow-hidden relative group"
        >
          <img src={main.url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
        </button>
        {rest.map((img, i) => (
          <button
            key={i}
            onClick={() => setLightboxIdx(i + 1)}
            className="bg-[#F0F0F0] overflow-hidden relative group"
          >
            <img src={img.url} alt={`${title} ${i + 2}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
            {i === 1 && remaining > 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-semibold">
                +{remaining} ảnh
              </div>
            )}
          </button>
        ))}
        {images.length === 2 && <div className="bg-[#F0F0F0]" />}
      </div>
      {lightboxIdx !== null && (
        <ImageLightbox images={images} initialIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  );
}

// ─── skeletons ────────────────────────────────────────────────────────────────

function ReviewsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-[14px] border border-solid border-[#DDDDDD] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 animate-pulse"
        >
          <div className="w-full sm:w-64 h-44 rounded-[12px] bg-[#F0F0F0] shrink-0" />
          <div className="flex-1 space-y-3 py-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F0F0F0]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#F0F0F0] rounded w-1/3" />
                <div className="h-3 bg-[#F0F0F0] rounded w-1/2" />
              </div>
            </div>
            <div className="h-3 bg-[#F0F0F0] rounded w-full" />
            <div className="h-3 bg-[#F0F0F0] rounded w-4/5" />
            <div className="h-10 bg-[#F0F0F0] rounded w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── review card (rich layout) ────────────────────────────────────────────────

function ReviewCard({ review }: { review: LandlordReview }) {
  const reviewerName = review.reviewer?.name ?? 'Người dùng ẩn danh';
  const reviewerAvatar = review.reviewer?.avatar;
  const reviewerRole = review.reviewerRole;
  const target = review.target;
  const images = target?.images ?? [];
  const propertyTitle = target?.title ?? 'Phòng';
  const fullAddress = target?.address
    ? [target.address.street, target.address.ward, target.address.district, target.address.city]
        .filter(Boolean)
        .join(', ')
    : '';
  const type = target?.type ? TYPE_LABEL[target.type] : null;
  const status = target?.status ? STATUS_CONFIG[target.status] : null;
  const propertyId = target?._id;

  return (
    <div className="bg-white rounded-[14px] border border-solid border-[#DDDDDD] p-4 sm:p-5 space-y-4">
      {/* ─── Header: reviewer + rating + date ─────────────────────────────── */}
      <div className="flex items-start gap-3 sm:gap-4">
        <ReviewerAvatar name={reviewerName} avatar={reviewerAvatar} size={44} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[#222222] text-[15px] font-bold truncate">
              {reviewerName}
            </span>
            {reviewerRole && (
              <span className={
                'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ' +
                (reviewerRole === 'tenant' ? 'bg-[#EEF4FB] text-[#2683EB]' : 'bg-purple-50 text-purple-700')
              }>
                {reviewerRole === 'tenant' ? 'Người thuê' : 'Chủ trọ'}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <StarRating value={review.rating} size={16} />
            <span className="text-[#222222] text-sm font-bold">{review.rating.toFixed(1)}</span>
            <span className="text-[#929292] text-xs">/ 5.0</span>
            <span className="text-[#DDDDDD] text-xs">•</span>
            <span className="flex items-center gap-1 text-[#929292] text-xs">
              <CalendarDays className="size-3" />
              {formatDateTime(review.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Comment ──────────────────────────────────────────────────────── */}
      {review.comment ? (
        <div className="pl-0 sm:pl-[60px]">
          <p className="text-[#222222] text-sm leading-relaxed whitespace-pre-line">
            {review.comment}
          </p>
        </div>
      ) : (
        <div className="pl-0 sm:pl-[60px]">
          <p className="text-[#929292] text-xs italic flex items-center gap-1.5">
            <MessageSquare className="size-3" />
            Người dùng chỉ để lại đánh giá sao, không kèm nhận xét.
          </p>
        </div>
      )}

      {/* ─── Property block ───────────────────────────────────────────────── */}
      {propertyId ? (
        <Link
          href={`/properties/${propertyId}`}
          className="block bg-[#F9FAFB] hover:bg-[#F1F4F8] border border-solid border-[#EFEFEF] rounded-[12px] p-3.5 sm:p-4 transition-colors group/prop"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Gallery */}
            <div className="shrink-0">
              <PropertyGallery images={images} title={propertyTitle} />
            </div>

            {/* Property info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {type && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-[#EEF4FB] text-[#2683EB]">
                    <Home className="size-2.5" />
                    {type}
                  </span>
                )}
                {status && (
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${status.cls}`}>
                    {status.label}
                  </span>
                )}
                {review.targetType === 'property' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-[#F0F0F0] text-[#6A6A6A]">
                    <Tag className="size-2.5 inline mr-0.5" />
                    Tin đăng
                  </span>
                )}
              </div>

              <h3 className="text-[#222222] text-[15px] sm:text-base font-bold leading-snug line-clamp-2 group-hover/prop:text-[#2683EB] transition-colors">
                {propertyTitle}
              </h3>

              {fullAddress && (
                <p className="flex items-start gap-1 text-[#6A6A6A] text-[12px] mt-1.5 line-clamp-2">
                  <MapPin className="size-3 shrink-0 mt-0.5" />
                  <span>{fullAddress}</span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-dashed border-[#E5E5E5]">
                {target?.price != null && (
                  <span className="text-[#222222] text-sm font-bold">
                    {formatPrice(target.price)}₫<span className="text-[#929292] text-xs font-normal">/tháng</span>
                  </span>
                )}
                {target?.area != null && (
                  <span className="inline-flex items-center gap-1 text-[#6A6A6A] text-[12px]">
                    <Maximize2 className="size-3" /> {target.area}m²
                  </span>
                )}
                {target?.bedrooms != null && (
                  <span className="inline-flex items-center gap-1 text-[#6A6A6A] text-[12px]">
                    <BedDouble className="size-3" /> {target.bedrooms} PN
                  </span>
                )}
                {target?.bathrooms != null && (
                  <span className="inline-flex items-center gap-1 text-[#6A6A6A] text-[12px]">
                    <Bath className="size-3" /> {target.bathrooms} WC
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="bg-amber-50/60 border border-dashed border-amber-200 rounded-[12px] p-3.5 flex items-start gap-2.5">
          <div className="shrink-0 size-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold mt-0.5">
            !
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#92400e] text-[13px] font-semibold">
              Tin đăng đã bị ẩn hoặc xoá
            </p>
            <p className="text-[#a16207] text-xs mt-0.5">
              Bạn vẫn có thể xem đánh giá của người thuê. Nếu tin đăng vẫn còn trong trang quản lý, thử refresh hoặc kiểm tra trạng thái kích hoạt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function LandlordReviewsPage() {
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');

  const { data, isLoading, isFetching } = useMyPropertiesReviews(page, PAGE_SIZE);

  const allReviews = data?.reviews ?? [];
  const totalReviews = data?.totalReviews ?? 0;
  const averageRating = data?.averageRating ?? null;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const visible = ratingFilter === 'all'
    ? allReviews
    : allReviews.filter((r) => Math.round(r.rating) === Number(ratingFilter));

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (totalReviews > 0) {
    allReviews.forEach((r) => {
      const k = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5;
      if (k >= 1 && k <= 5) distribution[k] += 1;
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[#222222] text-2xl sm:text-[28px] font-bold leading-tight">
          Đánh giá từ người thuê
        </h1>
        <p className="text-[#6A6A6A] text-sm mt-1">
          Xem tất cả đánh giá mà người thuê đã gửi cho các tin đăng của bạn.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-[14px] border border-solid border-[#DDDDDD] p-5 sm:p-6 mb-5">
        <div className="flex items-center gap-6">
          <div className="text-center shrink-0">
            <p className="text-[#222222] text-4xl font-bold leading-none mb-1">
              {averageRating != null ? averageRating.toFixed(1) : '—'}
            </p>
            <StarRating value={averageRating ?? 0} size={16} />
            <p className="text-[#6A6A6A] text-xs mt-1.5">
              {totalReviews} lượt đánh giá
            </p>
          </div>

          <div className="flex-1 space-y-1.5 min-w-0">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = distribution[star as 1 | 2 | 3 | 4 | 5];
              const pct = allReviews.length > 0
                ? (count / allReviews.length) * 100
                : 0;
              return (
                <button
                  key={star}
                  onClick={() => setRatingFilter(ratingFilter === String(star) ? 'all' : String(star) as RatingFilter)}
                  className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity"
                >
                  <span className="text-xs text-[#6A6A6A] w-5 text-right shrink-0">{star}</span>
                  <Star className="size-3 fill-[#f59e0b] text-[#f59e0b] shrink-0" />
                  <div className="flex-1 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#f59e0b] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#6A6A6A] w-6 shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {RATING_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setRatingFilter(f.key); setPage(1); }}
            className={
              'shrink-0 px-4 py-1.5 text-[13px] font-medium rounded-full border transition-colors ' +
              (ratingFilter === f.key
                ? 'bg-[#ffef3d] text-[#1f1c00] border-[#ffef3d]'
                : 'bg-white text-[#222222] border-[#DDDDDD] hover:border-[#ffef3d]')
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <ReviewsSkeleton />
      ) : totalReviews === 0 ? (
        <div className="bg-white py-12 px-4 rounded-[14px] border border-solid border-[#DDDDDD] text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F0F0F0] mb-3">
            <MessageSquare className="size-5 text-[#929292]" />
          </div>
          <p className="text-[#6A6A6A] text-sm">
            Chưa có đánh giá nào cho các tin đăng của bạn
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white py-10 px-4 rounded-[14px] border border-solid border-[#DDDDDD] text-center">
          <p className="text-[#6A6A6A] text-sm">
            Không có đánh giá {ratingFilter !== 'all' ? `${ratingFilter} sao ` : ''}trong trang này.
          </p>
          <button
            onClick={() => setRatingFilter('all')}
            className="text-[#2683EB] text-sm font-medium mt-2 hover:underline"
          >
            Xem tất cả đánh giá
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((r, idx) => (
            <ReviewCard key={r._id ?? `review-${page}-${idx}`} review={r} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isFetching}
            className="size-9 flex items-center justify-center rounded-full border border-solid border-[#DDDDDD] text-[#222222] hover:border-[#ffef3d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Trang trước"
          >
            <ChevronLeft className="size-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | '…')[]>((acc, p, i, arr) => {
              if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '…' ? (
                <span key={`gap-${i}`} className="px-1 text-[#929292] text-sm">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  disabled={isFetching}
                  className={
                    'min-w-9 h-9 px-3 flex items-center justify-center rounded-full text-sm font-medium border transition-colors ' +
                    (p === page
                      ? 'bg-[#ffef3d] text-[#1f1c00] border-[#ffef3d]'
                      : 'bg-white text-[#222222] border-[#DDDDDD] hover:border-[#ffef3d]')
                  }
                >
                  {isFetching && p === page ? <Loader2 className="size-3.5 animate-spin" /> : p}
                </button>
              ),
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isFetching}
            className="size-9 flex items-center justify-center rounded-full border border-solid border-[#DDDDDD] text-[#222222] hover:border-[#ffef3d] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Trang sau"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
