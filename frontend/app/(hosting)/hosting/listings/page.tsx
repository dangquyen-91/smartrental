'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2, Plus, MapPin, Pencil, Trash2, Eye,
  Star, Loader2, BedDouble, Bath, Maximize2, MoreVertical,
} from 'lucide-react';
import {
  useMyProperties,
  useDeleteProperty,
  useUpdateProperty,
  propertyKeys,
} from '@/hooks/use-properties';
import { cn } from '@/lib/utils';
import type { Property } from '@/types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

const STATUS_FILTERS = [
  { key: 'all',         label: 'Tất cả' },
  { key: 'rented',      label: 'Đang cho thuê' },
  { key: 'available',   label: 'Còn trống' },
  { key: 'maintenance', label: 'Bảo trì' },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]['key'];

const STATUS_CONFIG: Record<Property['status'], { label: string; cls: string }> = {
  available:   { label: 'Còn trống',     cls: 'bg-emerald-50 text-emerald-700' },
  rented:      { label: 'Đang cho thuê', cls: 'bg-blue-50 text-blue-700' },
  maintenance: { label: 'Bảo trì',       cls: 'bg-amber-50 text-amber-700' },
};

const TYPE_LABEL: Record<Property['type'], string> = {
  room:      'Phòng trọ',
  apartment: 'Căn hộ',
  house:     'Nhà nguyên căn',
  studio:    'Studio',
};

// ─── skeleton ─────────────────────────────────────────────────────────────────

function ListingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-card border border-hairline-gray p-4 flex gap-4 animate-pulse"
        >
          <div className="w-30 h-22.5 rounded-[10px] bg-soft-cloud shrink-0" />
          <div className="flex-1 space-y-2.5 py-1">
            <div className="h-3.5 bg-soft-cloud rounded w-2/3" />
            <div className="h-3 bg-soft-cloud rounded w-1/2" />
            <div className="h-3 bg-soft-cloud rounded w-1/3" />
            <div className="h-3 bg-soft-cloud rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({
  property,
  onConfirm,
  onCancel,
  isPending,
}: {
  property: Property;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[16px] p-6 max-w-sm w-full"
        style={{ boxShadow: 'rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-ink-black mb-2">Xoá tin đăng?</h3>
        <p className="text-sm font-medium text-ash-gray mb-6 leading-relaxed">
          Tin đăng{' '}
          <span className="font-semibold text-ink-black">
            &ldquo;{property.title}&rdquo;
          </span>{' '}
          sẽ bị ẩn và không thể khôi phục.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold text-ink-black border border-hairline-gray rounded-lg hover:bg-soft-cloud transition-colors disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-rausch hover:bg-deep-rausch rounded-lg transition-colors disabled:opacity-60 active:scale-95"
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── listing card ──────────────────────────────────────────────────────────────

function ListingCard({
  property,
  onDelete,
}: {
  property: Property;
  onDelete: (p: Property) => void;
}) {
  const qc = useQueryClient();
  const { mutate: updateProperty, isPending: isUpdating } = useUpdateProperty();
  const [menuOpen, setMenuOpen] = useState(false);

  const primaryImage =
    property.images.find((i) => i.isPrimary)?.url ??
    property.images[0]?.url ??
    '/placeholder.jpg';

  const address = [property.address.district, property.address.city]
    .filter(Boolean)
    .join(', ');

  const statusCfg = STATUS_CONFIG[property.status];

  const toggleFeatured = () => {
    updateProperty(
      { id: property.id, data: { isFeatured: !property.isFeatured } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: propertyKeys.mine() }) },
    );
    setMenuOpen(false);
  };

  return (
    <div className="bg-white rounded-card border border-hairline-gray p-4 flex gap-4 transition-colors hover:border-stone-gray">
      {/* Thumbnail */}
      <Link href={`/properties/${property.id}`} className="shrink-0 block">
        <div className="relative w-30 h-22.5 rounded-[10px] overflow-hidden bg-soft-cloud">
          <img
            src={primaryImage}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          {property.isFeatured && (
            <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-400 rounded-full">
              <Star className="size-2.5 fill-white stroke-white" />
              <span className="text-[10px] font-semibold text-white leading-none">Nổi bật</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Top row: title + menu */}
        <div className="flex items-start justify-between gap-2">
          <Link href={`/properties/${property.id}`} className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink-black line-clamp-1 hover:text-rausch transition-colors leading-snug">
              {property.title}
            </p>
          </Link>

          {/* Action menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="size-7 flex items-center justify-center rounded-full hover:bg-soft-cloud transition-colors"
              aria-label="Tuỳ chọn"
            >
              <MoreVertical className="size-4 text-ash-gray" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-20 bg-white border border-hairline-gray rounded-[12px] min-w-39 py-1 overflow-hidden"
                style={{ boxShadow: 'rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0' }}
              >
                <Link
                  href={`/properties/${property.id}`}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-ink-black hover:bg-soft-cloud transition-colors"
                >
                  <Eye className="size-3.5 text-ash-gray" />
                  Xem trang
                </Link>
                <Link
                  href={`/hosting/listings/${property.id}/edit`}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-ink-black hover:bg-soft-cloud transition-colors"
                >
                  <Pencil className="size-3.5 text-ash-gray" />
                  Chỉnh sửa
                </Link>
                <div className="h-px bg-hairline-gray mx-3 my-1" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(property); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-rausch hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="size-3.5" />
                  Xoá tin
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Address + type */}
        <div className="mt-1 flex items-center gap-1 text-xs font-medium text-ash-gray">
          <MapPin className="size-3 shrink-0" />
          <span className="line-clamp-1">{address}</span>
          <span className="text-hairline-gray mx-0.5">·</span>
          <span className="shrink-0">{TYPE_LABEL[property.type]}</span>
        </div>

        {/* Specs */}
        <div className="mt-1 flex items-center gap-3 text-xs font-medium text-ash-gray">
          <span className="flex items-center gap-1">
            <Maximize2 className="size-3" />
            {property.area} m²
          </span>
          {property.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <BedDouble className="size-3" />
              {property.bedrooms} phòng ngủ
            </span>
          )}
          {property.bathrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bath className="size-3" />
              {property.bathrooms} phòng tắm
            </span>
          )}
        </div>

        {/* Price + status */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink-black">
            {formatVnd(property.price)}
            <span className="text-xs font-medium text-ash-gray">/tháng</span>
          </p>
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', statusCfg.cls)}>
            {statusCfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filter }: { filter: StatusFilter }) {
  const isAll = filter === 'all';
  const filterLabel = STATUS_FILTERS.find((f) => f.key === filter)?.label ?? '';

  return (
    <div className="flex flex-col items-center py-20 text-center bg-white rounded-card border border-hairline-gray">
      <div className="size-14 rounded-full bg-soft-cloud flex items-center justify-center mb-4">
        <Building2 className="size-7 text-stone-gray" />
      </div>
      <h2 className="text-base font-semibold text-ink-black mb-2">
        {isAll ? 'Chưa có tin đăng nào' : `Không có tin "${filterLabel}"`}
      </h2>
      <p className="text-sm font-medium text-ash-gray mb-6 max-w-xs leading-relaxed">
        {isAll
          ? 'Bắt đầu đăng tin để tiếp cận hàng nghìn người thuê.'
          : 'Thử chọn bộ lọc khác hoặc tạo tin đăng mới.'}
      </p>
      {isAll && (
        <Link
          href="/hosting/listings/new"
          className="px-5 py-2.5 text-sm font-semibold text-white bg-rausch hover:bg-deep-rausch rounded-lg transition-all active:scale-95"
        >
          Đăng tin đầu tiên
        </Link>
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function HostingListingsPage() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError } = useMyProperties();
  const { mutate: deleteProperty, isPending: isDeleting } = useDeleteProperty();

  const allProperties: Property[] = Array.isArray(data?.data)
    ? (data.data as Property[])
    : [];

  const filtered =
    activeFilter === 'all'
      ? allProperties
      : allProperties.filter((p) => p.status === activeFilter);

  const countOf = (key: StatusFilter) =>
    key === 'all'
      ? allProperties.length
      : allProperties.filter((p) => p.status === key).length;

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProperty(deleteTarget.id, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: propertyKeys.mine() });
        setDeleteTarget(null);
      },
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink-black">Tin đăng của tôi</h1>
          <Link
            href="/hosting/listings/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rausch hover:bg-deep-rausch rounded-lg transition-all active:scale-95"
          >
            <Plus className="size-4" />
            Đăng tin mới
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(({ key, label }) => {
            const active = activeFilter === key;
            const count = countOf(key);
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full border transition-colors',
                  active
                    ? 'bg-ink-black text-white border-ink-black'
                    : 'bg-white text-ash-gray border-hairline-gray hover:border-ink-black hover:text-ink-black',
                )}
              >
                {label}
                {!isLoading && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[11px] font-semibold rounded-full',
                      active ? 'bg-white/20 text-white' : 'bg-soft-cloud text-ash-gray',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <ListingSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center py-20 text-center bg-white rounded-card border border-hairline-gray">
            <p className="text-sm font-medium text-ash-gray">
              Không thể tải danh sách. Vui lòng thử lại.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <div className="space-y-3">
            {filtered.map((property) => (
              <ListingCard
                key={property.id}
                property={property}
                onDelete={setDeleteTarget}
              />
            ))}
            <p className="text-xs font-medium text-ash-gray text-center pt-2">
              {filtered.length} tin đăng
            </p>
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <DeleteModal
          property={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={isDeleting}
        />
      )}
    </>
  );
}
