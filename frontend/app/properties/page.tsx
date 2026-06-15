'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Link from 'next/link';
import {
  Building2,
  Home,
  Hotel,
  Box,
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';
import { PropertyCard } from '@/components/shared/property-card';
import { PropertyCardSkeleton } from '@/components/ui/skeleton';
import { useProperties } from '@/hooks/use-properties';
import { useAllMyBookings } from '@/hooks/use-bookings';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import type { Property } from '@/types';
import type { PropertyFilters } from '@/lib/api/properties.api';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollToPlugin);
}

// ─── constants ────────────────────────────────────────────────────────────────

const CATEGORIES: {
  label: string;
  value: Property['type'] | 'all';
  icon: React.ElementType;
}[] = [
  { label: 'Tất cả', value: 'all', icon: Building2 },
  { label: 'Phòng trọ', value: 'room', icon: Home },
  { label: 'Căn hộ', value: 'apartment', icon: Hotel },
  { label: 'Nhà nguyên căn', value: 'house', icon: Building2 },
  { label: 'Studio', value: 'studio', icon: Box },
];

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 3 triệu', min: undefined, max: 3_000_000 },
  { label: '3 – 5 triệu', min: 3_000_000, max: 5_000_000 },
  { label: '5 – 10 triệu', min: 5_000_000, max: 10_000_000 },
  { label: '10 – 20 triệu', min: 10_000_000, max: 20_000_000 },
  { label: 'Trên 20 triệu', min: 20_000_000, max: undefined },
] as const;

const PAGE_SIZE = 12;

// ─── filter sidebar ───────────────────────────────────────────────────────────

function FilterSidebar({
  filters,
  onChange,
  onClear,
}: {
  filters: PropertyFilters;
  onChange: (f: PropertyFilters) => void;
  onClear: () => void;
}) {
  const [showMobile, setShowMobile] = useState(false);

  const update = (patch: Partial<PropertyFilters>) =>
    onChange({ ...filters, ...patch });

  const clear = () => onChange({ status: 'available' });

  const content = (
    <div className="space-y-6">
      {/* Type */}
      <div>
        <p className="text-sm font-semibold text-[#191c1d] mb-3">Loại phòng</p>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => update({ type: cat.value === 'all' ? undefined : cat.value })}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                (filters.type ?? 'all') === cat.value
                  ? 'bg-[#ffef3d] text-[#1f1c00] font-semibold'
                  : 'hover:bg-[#f3f4f5] text-[#4a4733]'
              )}
            >
              <cat.icon className="size-4 shrink-0" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="text-sm font-semibold text-[#191c1d] mb-3">Khoảng giá</p>
        <div className="space-y-1">
          {PRICE_RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() =>
                update({
                  minPrice: r.min,
                  maxPrice: r.max,
                })
              }
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                filters.minPrice === r.min && filters.maxPrice === r.max
                  ? 'bg-[#ffef3d] text-[#1f1c00] font-semibold'
                  : 'hover:bg-[#f3f4f5] text-[#4a4733]'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Area */}
      <div>
        <p className="text-sm font-semibold text-[#191c1d] mb-3">Diện tích</p>
        <div className="flex flex-col gap-2">
          <input
            type="number"
            placeholder="Từ (m²)"
            value={filters.minArea ?? ''}
            onChange={(e) => update({ minArea: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full h-10 px-3 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:border-[#676000]"
          />
          <input
            type="number"
            placeholder="Đến (m²)"
            value={filters.maxArea ?? ''}
            onChange={(e) => update({ maxArea: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full h-10 px-3 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:border-[#676000]"
          />
        </div>
      </div>

      {/* Clear */}
      <button
        onClick={clear}
        className="w-full py-2.5 text-sm text-[#c13515] border border-[#c13515] rounded-lg hover:bg-red-50 transition-colors"
      >
        Xoá bộ lọc
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="sticky top-24">
          <div className="bg-white rounded-2xl border border-[#e0e0e0] p-5 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#191c1d]">Bộ lọc</p>
              <button onClick={clear} className="text-xs text-[#c13515] hover:underline">
                Xoá
              </button>
            </div>
            {content}
          </div>
        </div>
      </aside>

      {/* Mobile trigger */}
      <button
        onClick={() => setShowMobile(true)}
        className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[#676000] text-white rounded-full shadow-xl text-sm font-semibold"
      >
        <SlidersHorizontal className="size-4" />
        Bộ lọc
      </button>

      {/* Mobile drawer */}
      {showMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobile(false)} />
          <div className="relative ml-auto w-[300px] h-full bg-white overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-6">
              <p className="text-base font-semibold text-[#191c1d]">Bộ lọc</p>
              <button onClick={() => setShowMobile(false)} className="p-1">
                <X className="size-5 text-[#4a4733]" />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}

// ─── search bar ─────────────────────────────────────────────────────────────

function SearchBar({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="flex items-stretch bg-[#ffef3d] rounded-full shadow-xl h-[60px] overflow-hidden">
      <div className="flex-1 px-5 flex items-center gap-3 min-w-0">
        <MapPin className="size-5 text-[#4a4733] shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="Tìm quận, thành phố..."
          className="flex-1 bg-transparent text-sm font-medium text-[#191c1d] placeholder:text-[#4a4733]/60 outline-none"
        />
      </div>
      <button
        onClick={onSearch}
        className="px-6 bg-[#676000] text-white text-sm font-semibold hover:bg-[#4a4733] transition-colors flex items-center gap-2"
      >
        <Search className="size-4" />
        Tìm kiếm
      </button>
    </div>
  );
}

// ─── property grid ──────────────────────────────────────────────────────────

function PropertyGrid({
  filters,
}: {
  filters: PropertyFilters;
}) {
  const [page, setPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);
  const rectsBeforeFetch = useRef<Map<string, DOMRect>>(new Map());
  const prevIsFetching = useRef(false);
  const isFetchingRef = useRef(false);

  const { isAuthenticated, hasHydrated } = useAuth();
  const { data: myBookings } = useAllMyBookings(hasHydrated && isAuthenticated);
  const rentedPropertyIds = new Set(
    (myBookings?.data ?? [])
      .filter((b) => ['confirmed', 'active', 'completed'].includes(b.status))
      .map((b) => (typeof b.property === 'string' ? b.property : b.property?.id))
      .filter(Boolean) as string[],
  );
  const excludedPropertyIds = Array.from(rentedPropertyIds);

  const apiFilters: PropertyFilters = {
    ...filters,
    status: 'available',
    page,
    limit: PAGE_SIZE,
    excludePropertyIds: excludedPropertyIds,
  };

  const { data, isLoading, isFetching } = useProperties(apiFilters);
  const properties = (data?.data ?? []).filter((p) => p.status === 'available');
  const pagination = data?.pagination;
  const hasMore = pagination ? page < pagination.totalPages : false;

  // Reset page when filters change
  const prevFiltersRef = useRef(apiFilters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const filterChanged =
      prev.type !== apiFilters.type ||
      prev.search !== apiFilters.search ||
      prev.minPrice !== apiFilters.minPrice ||
      prev.maxPrice !== apiFilters.maxPrice ||
      prev.minArea !== apiFilters.minArea ||
      prev.maxArea !== apiFilters.maxArea;
    if (filterChanged) {
      setPage(1);
      prevFiltersRef.current = apiFilters;
    }
  }, [apiFilters]);

  // FLIP animation: capture rects when fetch starts, animate when new data arrives
  useEffect(() => {
    const isFetching = isFetchingRef.current;
    isFetchingRef.current = isFetching;

    if (isFetching) {
      // Start of fetch — capture current card rects
      const grid = gridRef.current;
      if (!grid) return;
      rectsBeforeFetch.current = new Map();
      const cards = grid.querySelectorAll('[data-flip-id]');
      cards.forEach((card) => {
        const id = card.getAttribute('data-flip-id')!;
        rectsBeforeFetch.current.set(id, card.getBoundingClientRect());
      });
      prevIsFetching.current = true;
    } else if (prevIsFetching.current && !isFetching) {
      // Fetch completed — animate from old positions to new positions
      prevIsFetching.current = false;
      const grid = gridRef.current;
      if (!grid) return;
      const cards = grid.querySelectorAll('[data-flip-id]');
      cards.forEach((card) => {
        const id = card.getAttribute('data-flip-id')!;
        const prevRect = rectsBeforeFetch.current.get(id);
        if (!prevRect) return;
        const newRect = card.getBoundingClientRect();
        const dx = prevRect.left - newRect.left;
        const dy = prevRect.top - newRect.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        gsap.fromTo(
          card,
          { x: dx, y: dy, opacity: 0, scale: 0.95 },
          { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out', clearProps: 'transform' }
        );
      });
    }
  }, [isFetching]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="py-24 text-center">
        <div className="w-16 h-16 bg-[#f3f4f5] rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="size-7 text-[#c1c1c1]" />
        </div>
        <h3 className="text-base font-semibold text-[#191c1d] mb-1">Không tìm thấy kết quả</h3>
        <p className="text-sm text-[#4a4733]">Thử thay đổi bộ lọc hoặc tìm kiếm ở khu vực khác.</p>
      </div>
    );
  }

  return (
    <div>
      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((p) => (
          <div key={p.id} data-flip-id={p.id}>
            <PropertyCard property={p} rentedPropertyIds={rentedPropertyIds} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setPage((n) => n + 1)}
            disabled={isFetching}
            className="px-8 py-3 bg-white border border-[#e0e0e0] text-[#191c1d] text-sm font-semibold rounded-full hover:border-[#676000] hover:text-[#676000] transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isFetching ? 'Đang tải...' : 'Xem thêm'}
            {!isFetching && <ChevronRight className="size-4" />}
          </button>
          <p className="mt-3 text-xs text-[#4a4733]">
            Hiển thị {properties.length} / {pagination?.total ?? 0} bất động sản
          </p>
        </div>
      )}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialType = (searchParams.get('type') as Property['type']) || undefined;
  const initialSearch = searchParams.get('search') || '';
  const initialMinPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const initialMaxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

  const [activeType, setActiveType] = useState<Property['type'] | undefined>(initialType);
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState<PropertyFilters>(() => ({
    type: initialType,
    search: initialSearch || undefined,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
  }));

  const handleCategoryChange = useCallback((type: Property['type'] | 'all') => {
    setActiveType(type === 'all' ? undefined : type);
    setFilters((f) => ({ ...f, type: type === 'all' ? undefined : type }));
  }, []);

  const handleFilterChange = useCallback((f: PropertyFilters) => {
    setFilters(f);
    setActiveType(f.type ?? undefined);
    // sync URL
    const params = new URLSearchParams();
    if (f.type) params.set('type', f.type);
    if (f.search) params.set('search', f.search);
    if (f.minPrice != null) params.set('minPrice', String(f.minPrice));
    if (f.maxPrice != null) params.set('maxPrice', String(f.maxPrice));
    const qs = params.toString();
    router.replace(qs ? `/properties?${qs}` : '/properties', { scroll: false });
  }, [router]);

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, search: search || undefined }));
    const params = new URLSearchParams();
    if (activeType) params.set('type', activeType);
    if (search) params.set('search', search);
    if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
    const qs = params.toString();
    router.replace(qs ? `/properties?${qs}` : '/properties', { scroll: false });
  }, [search, activeType, filters.minPrice, filters.maxPrice, router]);

  const hasFilters =
    activeType !== undefined ||
    search !== '' ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minArea !== undefined ||
    filters.maxArea !== undefined;

  const totalFilters = [
    activeType,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.minArea !== undefined || filters.maxArea !== undefined,
    search,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <PublicNavbar activeLink="search" />

      <main className="flex-1">
        {/* ── Hero + search ── */}
        <section className="bg-white border-b border-[#e0e0e0] py-8 px-4 md:px-10">
          <div className="mx-auto" style={{ maxWidth: '900px' }}>
            <h1 className="text-2xl font-bold text-[#191c1d] mb-1">
              {hasFilters ? 'Kết quả tìm kiếm' : 'Khám phá bất động sản'}
            </h1>
            <p className="text-sm text-[#4a4733] mb-6">
              {hasFilters
                ? `${totalFilters} bộ lọc đang áp dụng`
                : 'Tất cả các bất động sản khả dụng'}
            </p>
            <SearchBar value={search} onChange={setSearch} onSearch={handleSearch} />
          </div>
        </section>

        {/* ── Category tabs ── */}
        <section className="bg-white border-b border-[#e0e0e0] px-4 md:px-10">
          <div className="flex items-center gap-1 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={cn(
                  'flex items-center gap-1.5 py-3 px-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0',
                  (activeType ?? 'all') === cat.value
                    ? 'border-[#676000] text-[#676000]'
                    : 'border-transparent text-[#4a4733] hover:text-[#191c1d]'
                )}
              >
                <cat.icon className="size-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Body ── */}
        <section className="mx-auto px-4 md:px-10 py-8" style={{ maxWidth: '1280px' }}>
          <div className="flex gap-8">
            <FilterSidebar
              filters={filters}
              onChange={handleFilterChange}
              onClear={() => {
                setFilters({ status: 'available' });
                setActiveType(undefined);
                setSearch('');
                router.replace('/properties', { scroll: false });
              }}
            />

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-[#4a4733]">
                  {hasFilters ? 'Đang hiển thị kết quả lọc' : 'Tất cả bất động sản khả dụng'}
                </p>
                {hasFilters && (
                  <Link href="/properties" className="text-xs text-[#c13515] hover:underline">
                    Xoá tất cả
                  </Link>
                )}
              </div>

              <PropertyGrid filters={filters} />
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
