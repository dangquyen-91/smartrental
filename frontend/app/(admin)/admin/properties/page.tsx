'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Star } from 'lucide-react';
import { useAdminProperties, useTogglePropertyFeatured, useUpdatePropertyStatusAdmin } from '@/hooks/use-admin';
import type { Property, PropertyImage, User } from '@/types';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  room: 'Phòng trọ',
  apartment: 'Căn hộ',
  house: 'Nhà nguyên căn',
  studio: 'Studio',
};

const STATUS_LABEL: Record<string, string> = {
  available: 'Trống',
  rented: 'Đang thuê',
  maintenance: 'Bảo trì',
};

const STATUS_COLOR: Record<string, string> = {
  available: 'bg-[#f0fdf4] text-[#16a34a]',
  rented: 'bg-[#eff6ff] text-[#2563eb]',
  maintenance: 'bg-[#fefce8] text-[#ca8a04]',
};

const STATUS_SELECT_COLOR: Record<string, string> = {
  available:   'border-[#16a34a] text-[#16a34a]',
  rented:      'border-[#2563eb] text-[#2563eb]',
  maintenance: 'border-[#ca8a04] text-[#ca8a04]',
};

const getPrimaryImage = (images: PropertyImage[]) =>
  images.find((img) => img.isPrimary)?.url ?? images[0]?.url;

const getOwnerName = (owner: Property['owner']) => {
  if (owner == null) return '—';
  if (typeof owner === 'string') return '—';
  return (owner as User).name ?? '—';
};

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + '₫';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPropertiesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleStatusChange = useCallback((v: string) => { setStatus(v); setPage(1); }, []);
  const handleTypeChange = useCallback((v: string) => { setType(v); setPage(1); }, []);

  const { data, isLoading, isFetching } = useAdminProperties({ page, limit: 20, status, type, search });
  const properties: Property[] = data?.data ?? [];
  const pagination = data?.pagination;

  const toggleFeatured = useTogglePropertyFeatured();
  const updateStatus = useUpdatePropertyStatusAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222222]">Tin đăng</h1>
          <p className="text-sm text-[#6a6a6a] mt-0.5">
            {pagination ? `${pagination.total} tin đăng` : 'Đang tải...'}
          </p>
        </div>
        {isFetching && !isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-[#929292]" />
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-card border border-[#dddddd] p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" />
          <input
            type="text"
            placeholder="Tìm tiêu đề, thành phố, quận..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[8px] border border-[#dddddd] text-sm text-[#222222] placeholder:text-[#929292] focus:outline-none focus:border-[#222222] transition-colors"
          />
        </div>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-9 px-3 rounded-[8px] border border-[#dddddd] text-sm text-[#222222] focus:outline-none focus:border-[#222222] bg-white transition-colors"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="available">Trống</option>
          <option value="rented">Đang thuê</option>
          <option value="maintenance">Bảo trì</option>
        </select>

        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="h-9 px-3 rounded-[8px] border border-[#dddddd] text-sm text-[#222222] focus:outline-none focus:border-[#222222] bg-white transition-colors"
        >
          <option value="">Tất cả loại</option>
          <option value="room">Phòng trọ</option>
          <option value="apartment">Căn hộ</option>
          <option value="house">Nhà nguyên căn</option>
          <option value="studio">Studio</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-card border border-[#dddddd] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-[#ff385c]" />
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <p className="text-sm text-[#6a6a6a]">Không tìm thấy tin đăng nào.</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden lg:grid grid-cols-[2fr_120px_120px_1fr_100px_80px] gap-4 px-5 py-2.5 border-b border-[#dddddd] bg-[#f7f7f7]">
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Tin đăng</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Loại</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Trạng thái</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Chủ nhà</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Giá/tháng</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider text-center">Nổi bật</p>
            </div>

            {properties.map((property, i) => {
              const thumb = getPrimaryImage(property.images);
              const ownerName = getOwnerName(property.owner);
              const isPending = updateStatus.isPending || toggleFeatured.isPending;

              return (
                <div
                  key={property.id}
                  className={cn(
                    'flex items-center gap-3 lg:grid lg:grid-cols-[2fr_120px_120px_1fr_100px_80px] lg:gap-4 lg:items-center px-5 py-4',
                    i < properties.length - 1 ? 'border-b border-[#dddddd]' : '',
                  )}
                >
                  {/* Cell 1: Thumbnail + title */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-initial">
                    <div className="w-14 h-14 rounded-[10px] bg-[#f7f7f7] shrink-0 overflow-hidden border border-[#dddddd]">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#929292] text-xs">N/A</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#222222] truncate">{property.title}</p>
                      <p className="text-xs text-[#6a6a6a] truncate">
                        {property.address.district}, {property.address.city}
                      </p>
                      <p className="text-xs text-[#929292]">{property.views ?? 0} lượt xem</p>
                    </div>
                  </div>

                  {/* Cell 2: Type */}
                  <span className="hidden lg:inline-flex w-fit text-xs font-medium px-2 py-0.5 rounded-[4px] bg-[#f7f7f7] text-[#6a6a6a]">
                    {TYPE_LABEL[property.type]}
                  </span>

                  {/* Cell 3: Status */}
                  <select
                    value={property.status}
                    onChange={(e) => updateStatus.mutate({ id: property.id, status: e.target.value })}
                    disabled={isPending}
                    className={cn(
                      'hidden lg:block h-7 px-2 rounded-[6px] border text-xs bg-white focus:outline-none focus:border-[#222222] transition-colors disabled:opacity-50',
                      STATUS_SELECT_COLOR[property.status] ?? 'border-[#dddddd] text-[#222222]',
                    )}
                  >
                    <option value="available">Trống</option>
                    <option value="rented">Đang thuê</option>
                    <option value="maintenance">Bảo trì</option>
                  </select>

                  {/* Cell 4: Owner */}
                  <p className="hidden lg:block text-xs text-[#6a6a6a] truncate">
                    {ownerName}
                  </p>

                  {/* Cell 5: Price */}
                  <p className="text-xs font-semibold text-[#222222] shrink-0 text-right lg:text-left">
                    {fmtPrice(property.price)}
                  </p>

                  {/* Cell 6: Featured */}
                  <div className="flex lg:justify-center shrink-0">
                    <button
                      onClick={() => toggleFeatured.mutate(property.id)}
                      disabled={isPending}
                      title={property.isFeatured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-50',
                        property.isFeatured
                          ? 'bg-[#fefce8] text-[#ca8a04] hover:bg-[#fef9c3]'
                          : 'bg-[#f7f7f7] text-[#929292] hover:bg-[#f0fdf4] hover:text-[#16a34a]',
                      )}
                    >
                      <Star className="w-4 h-4" fill={property.isFeatured ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#dddddd] bg-[#f7f7f7]">
                <p className="text-xs text-[#6a6a6a]">
                  {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} / {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-[8px] border border-[#dddddd] text-xs text-[#222222] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1.5 text-xs text-[#6a6a6a]">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="px-3 py-1.5 rounded-[8px] border border-[#dddddd] text-xs text-[#222222] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
