'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Search, MapPin, SlidersHorizontal, Building2, Home, Hotel, Box } from 'lucide-react';
import AppNavbar from '@/components/layout/app-navbar';
import { PropertyCard } from '@/components/shared/property-card';
import { PropertyCardSkeleton } from '@/components/ui/skeleton';
import { useProperties } from '@/hooks/use-properties';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import type { Property } from '@/types';
import type { PropertyFilters } from '@/lib/api/properties.api';

// ─── constants ────────────────────────────────────────────────────────────────

const PRICE_RANGES = [
  { label: 'Tuỳ chọn', min: undefined, max: undefined },
  { label: 'Dưới 3 triệu', min: undefined, max: 3_000_000 },
  { label: '3 – 5 triệu', min: 3_000_000, max: 5_000_000 },
  { label: '5 – 10 triệu', min: 5_000_000, max: 10_000_000 },
  { label: '10 – 20 triệu', min: 10_000_000, max: 20_000_000 },
  { label: 'Trên 20 triệu', min: 20_000_000, max: undefined },
] as const;

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

const POPULAR_CITIES = [
  { city: 'TP. Hồ Chí Minh', subtitle: 'Cho thuê phòng' },
  { city: 'Hà Nội', subtitle: 'Cho thuê căn hộ' },
  { city: 'Đà Nẵng', subtitle: 'Nhà nguyên căn' },
  { city: 'Cần Thơ', subtitle: 'Phòng sinh viên' },
  { city: 'Bình Dương', subtitle: 'Phòng trọ KCN' },
  { city: 'Đồng Nai', subtitle: 'Nhà trọ công nhân' },
];

// ─── search bar ──────────────────────────────────────────────────────────────

interface SearchState {
  location: string;
  priceIndex: number;
  type: Property['type'] | 'all';
}

function HeroSearchBar({
  onSearch,
}: {
  onSearch: (s: SearchState) => void;
}) {
  const [state, setState] = useState<SearchState>({
    location: '',
    priceIndex: 0,
    type: 'all',
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(state);
      }}
    >
      {/* 3-segment pill */}
      <div className="flex items-stretch bg-white border border-hairline-gray rounded-pill shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden max-w-2xl mx-auto">
        {/* Location */}
        <div className="flex-1 px-5 py-3.5 border-r border-hairline-gray text-left min-w-0">
          <p className="text-[11px] font-semibold text-ink-black mb-0.5 flex items-center gap-1 uppercase tracking-wide">
            <MapPin className="size-3 shrink-0" />
            Địa điểm
          </p>
          <input
            type="text"
            value={state.location}
            onChange={(e) =>
              setState((s) => ({ ...s, location: e.target.value }))
            }
            placeholder="Tìm quận, thành phố..."
            className="w-full text-sm font-medium text-ink-black placeholder:text-mute-gray outline-none bg-transparent"
          />
        </div>

        {/* Price range */}
        <div className="px-5 py-3.5 border-r border-hairline-gray text-left shrink-0">
          <p className="text-[11px] font-semibold text-ink-black mb-0.5 uppercase tracking-wide">
            Khoảng giá
          </p>
          <select
            value={state.priceIndex}
            onChange={(e) =>
              setState((s) => ({ ...s, priceIndex: Number(e.target.value) }))
            }
            className="text-sm font-medium text-ink-black outline-none bg-transparent cursor-pointer"
          >
            {PRICE_RANGES.map((r, i) => (
              <option key={i} value={i}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Property type */}
        <div className="px-5 py-3.5 text-left shrink-0">
          <p className="text-[11px] font-semibold text-ink-black mb-0.5 uppercase tracking-wide">
            Loại phòng
          </p>
          <select
            value={state.type}
            onChange={(e) =>
              setState((s) => ({ ...s, type: e.target.value as SearchState['type'] }))
            }
            className="text-sm font-medium text-ink-black outline-none bg-transparent cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="p-2 shrink-0 flex items-center">
          <button
            type="submit"
            className="size-12 bg-rausch hover:bg-deep-rausch rounded-full flex items-center justify-center text-white transition-all active:scale-95"
            aria-label="Tìm kiếm"
          >
            <Search className="size-5" />
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── listing grid ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

function ListingSection({
  activeType,
  filters,
}: {
  activeType: Property['type'] | 'all';
  filters: PropertyFilters;
}) {
  const [page, setPage] = useState(1);
  const [, startTransition] = useTransition();

  const apiFilters: PropertyFilters = {
    ...filters,
    type: activeType !== 'all' ? activeType : undefined,
    status: 'available',
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useProperties(apiFilters);

  const properties = data?.data ?? [];
  const pagination = data?.pagination;
  const hasMore = pagination ? page < pagination.totalPages : false;
  const total = pagination?.total ?? 0;

  return (
    <div>
      {/* Result count */}
      {!isLoading && total > 0 && (
        <p className="text-sm text-ash-gray mb-6">
          <span className="font-semibold text-ink-black">{total}</span> bất động sản phù hợp
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
          {properties.map((p, i) => (
            <PropertyCard key={p.id ?? `p-${i}`} property={p} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={() =>
              startTransition(() => setPage((n) => n + 1))
            }
            disabled={isFetching}
            className="px-6 py-3 text-sm font-semibold text-ink-black border border-ink-black rounded-lg hover:bg-soft-cloud transition-colors disabled:opacity-50 underline underline-offset-2"
          >
            {isFetching ? 'Đang tải...' : 'Xem thêm'}
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="size-16 bg-soft-cloud rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="size-7 text-stone-gray" />
      </div>
      <h3 className="text-base font-semibold text-ink-black mb-1">
        Không tìm thấy kết quả
      </h3>
      <p className="text-sm text-ash-gray">
        Thử thay đổi bộ lọc hoặc tìm kiếm ở khu vực khác.
      </p>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Property['type'] | 'all'>('all');
  const [apiFilters, setApiFilters] = useState<PropertyFilters>({});

  const handleSearch = (s: {
    location: string;
    priceIndex: number;
    type: Property['type'] | 'all';
  }) => {
    const pr = PRICE_RANGES[s.priceIndex];
    setActiveCategory(s.type);
    setApiFilters({
      search: s.location || undefined,
      minPrice: pr.min,
      maxPrice: pr.max,
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <AppNavbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-soft-cloud py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-[2.25rem] font-bold text-ink-black leading-tight mb-4 tracking-tight">
              Tìm nhà trọ phù hợp,
              <br />
              dễ dàng và nhanh chóng
            </h1>
            <p className="text-base font-medium text-ash-gray mb-10">
              Hàng nghìn phòng trọ, căn hộ, nhà nguyên căn đang chờ bạn khám phá.
            </p>
            <HeroSearchBar onSearch={handleSearch} />
          </div>
        </section>

        {/* ── Categories + Listings ── */}
        <section className="max-w-7xl mx-auto px-6 py-10">
          {/* Category tabs */}
          <div className="flex gap-6 border-b border-hairline-gray mb-8 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 pb-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0',
                    active
                      ? 'text-ink-black border-b-2 border-ink-black -mb-px'
                      : 'text-ash-gray hover:text-ink-black'
                  )}
                >
                  <Icon className={cn('size-5', active ? 'text-ink-black' : 'text-stone-gray')} />
                  {cat.label}
                </button>
              );
            })}

            {/* Advanced filter trigger (no-op placeholder for now) */}
            <div className="ml-auto flex items-center pb-3 shrink-0">
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-black border border-hairline-gray rounded-lg hover:bg-soft-cloud transition-colors">
                <SlidersHorizontal className="size-4" />
                Bộ lọc
              </button>
            </div>
          </div>

          <ListingSection
            key={`${activeCategory}-${JSON.stringify(apiFilters)}`}
            activeType={activeCategory}
            filters={apiFilters}
          />
        </section>

        {/* ── Stats ── */}
        <section className="bg-soft-cloud py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-[1.75rem] font-bold text-ink-black mb-2 tracking-tight">
              Được tin dùng bởi hàng nghìn người
            </h2>
            <p className="text-sm font-medium text-ash-gray mb-12">
              Nền tảng thuê nhà minh bạch — từ đăng tin đến ký hợp đồng, tất cả trong một nơi.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
              {[
                { value: '10.000+', label: 'Tin đăng', sub: 'Trên toàn quốc' },
                { value: '2.500+', label: 'Chủ nhà đã xác minh', sub: 'Hồ sơ rõ ràng' },
                { value: '8.000+', label: 'Người thuê hài lòng', sub: 'Đánh giá 4.8/5' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[2.25rem] font-bold text-rausch mb-1">{s.value}</p>
                  <p className="text-base font-semibold text-ink-black">{s.label}</p>
                  <p className="text-sm text-ash-gray mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Popular cities ── */}
        <section className="max-w-7xl mx-auto px-6 py-14">
          <h2 className="text-[1.38rem] font-semibold text-ink-black mb-7 tracking-tight">
            Khám phá theo thành phố
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-5">
            {POPULAR_CITIES.map((c) => (
              <button
                key={c.city}
                onClick={() =>
                  setApiFilters((f) => ({ ...f, search: c.city }))
                }
                className="text-left group"
              >
                <p className="text-base font-semibold text-ink-black group-hover:text-rausch transition-colors leading-snug">
                  {c.city}
                </p>
                <p className="text-sm text-ash-gray mt-0.5">{c.subtitle}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="bg-soft-cloud py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[1.38rem] font-semibold text-ink-black mb-10 text-center tracking-tight">
              Cách SmartRental hoạt động
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {[
                {
                  step: '1',
                  title: 'Tìm & đặt phòng',
                  desc: 'Lọc theo khu vực, giá, loại phòng. Gửi yêu cầu đặt phòng ngay trên app.',
                },
                {
                  step: '2',
                  title: 'Xác nhận & thanh toán',
                  desc: 'Chủ nhà xác nhận trong 24h. Thanh toán tiền cọc và tháng đầu an toàn.',
                },
                {
                  step: '3',
                  title: 'Ký hợp đồng điện tử',
                  desc: 'Hợp đồng số hóa, có hiệu lực pháp lý. Lưu trữ trên cloud, truy cập mọi lúc.',
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div className="size-12 rounded-full bg-rausch text-white font-bold text-lg flex items-center justify-center mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-base font-semibold text-ink-black mb-2">{item.title}</h3>
                  <p className="text-sm text-ash-gray leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA for non-auth ── */}
        {!isAuthenticated && (
          <section className="py-20 px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-[1.75rem] font-bold text-ink-black mb-4 tracking-tight">
                Bắt đầu ngay hôm nay
              </h2>
              <p className="text-base font-medium text-ash-gray mb-8">
                Tạo tài khoản miễn phí để lưu tin yêu thích, đặt phòng và nhận thông báo.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="px-8 py-4 text-base font-semibold text-white bg-rausch hover:bg-deep-rausch rounded-lg transition-all active:scale-95"
                >
                  Tạo tài khoản miễn phí
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 text-base font-semibold text-ink-black border border-hairline-gray rounded-lg hover:bg-soft-cloud transition-colors"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Landlord CTA ── */}
        <section className="border-t border-hairline-gray py-14 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-[1.38rem] font-semibold text-ink-black mb-2 tracking-tight">
                Bạn là chủ nhà?
              </h2>
              <p className="text-sm font-medium text-ash-gray max-w-md">
                Đăng tin miễn phí, quản lý đặt phòng và hợp đồng điện tử — tất cả trong một dashboard.
              </p>
            </div>
            <Link
              href={isAuthenticated ? '/hosting' : '/register'}
              className="shrink-0 px-6 py-3 text-sm font-semibold text-white bg-ink-black hover:bg-charcoal rounded-lg transition-colors whitespace-nowrap"
            >
              Đăng tin cho thuê
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-hairline-gray bg-soft-cloud py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-bold text-base text-ink-black mb-3">
                Smart<span className="text-rausch">Rental</span>
              </p>
              <p className="text-sm text-ash-gray leading-relaxed">
                Nền tảng thuê nhà thông minh cho thị trường Việt Nam.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-black mb-3">Hỗ trợ</p>
              <ul className="space-y-2">
                {['Trung tâm trợ giúp', 'Liên hệ', 'Chính sách bảo mật', 'Điều khoản sử dụng'].map((t) => (
                  <li key={t}>
                    <Link href="#" className="text-sm text-ash-gray hover:text-ink-black transition-colors">
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-black mb-3">Dành cho chủ nhà</p>
              <ul className="space-y-2">
                {['Đăng tin cho thuê', 'Quản lý đặt phòng', 'Hợp đồng điện tử', 'Gói dịch vụ'].map((t) => (
                  <li key={t}>
                    <Link href="#" className="text-sm text-ash-gray hover:text-ink-black transition-colors">
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-hairline-gray pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-ash-gray">© 2026 SmartRental. Nền tảng thuê nhà thông minh.</p>
            <p className="text-xs text-stone-gray">Dự án EXE201 — Học kỳ Xuân 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
