'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Building2,
  Home,
  Hotel,
  Box,
  Search,
} from 'lucide-react';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';
import { PropertyCard } from '@/components/shared/property-card';
import { PropertyCardSkeleton } from '@/components/ui/skeleton';
import { useProperties } from '@/hooks/use-properties';
import { useMyBookings, useAllMyBookings } from '@/hooks/use-bookings';
import { useAuth } from '@/hooks/use-auth';
import { WaveText } from '@/components/shared/wave-text';
import type { Property } from '@/types';
import type { PropertyFilters } from '@/lib/api/properties.api';
import { gsap } from 'gsap';

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
  { city: 'Hải Phòng', subtitle: 'Căn hộ mini' },
  { city: 'Nha Trang', subtitle: 'Phòng view biển' },
  { city: 'Hạ Long', subtitle: 'Căn hộ du lịch' },
  { city: 'Đà Lạt', subtitle: 'Phòng nghỉ dưỡng' },
  { city: 'Vũng Tàu', subtitle: 'Căn hộ gần bãi biển' },
  { city: 'Cần Thơ', subtitle: 'Phòng sinh viên' },
  { city: 'Buôn Ma Thuột', subtitle: 'Nhà trọ giá rẻ' },
  { city: 'Thanh Hoá', subtitle: 'Phòng trọ thành phố' },
  { city: 'Nam Định', subtitle: 'Cho thuê phòng' },
  { city: 'Huế', subtitle: 'Căn hộ sinh viên' },
  { city: 'Quy Nhơn', subtitle: 'Phòng du lịch' },
  { city: 'Vinh', subtitle: 'Nhà nguyên căn' },
  { city: 'Bắc Ninh', subtitle: 'Phòng trọ KCN' },
  { city: 'Hải Dương', subtitle: 'Căn hộ giá rẻ' },
  { city: 'Thái Nguyên', subtitle: 'Phòng sinh viên' },
  { city: 'Bến Tre', subtitle: 'Cho thuê phòng' },
  { city: 'Long An', subtitle: 'Nhà trọ công nhân' },
  { city: 'Tiền Giang', subtitle: 'Phòng trọ giá rẻ' },
  { city: 'An Giang', subtitle: 'Căn hộ cho thuê' },
  { city: 'Khánh Hoà', subtitle: 'Phòng nghỉ dưỡng' },
  { city: 'Phú Quốc', subtitle: 'Căn hộ du lịch' },
  { city: 'Pleiku', subtitle: 'Nhà trọ thành phố' },
  { city: 'Kon Tum', subtitle: 'Phòng cho thuê' },
  { city: 'Lâm Đồng', subtitle: 'Căn hộ nghỉ dưỡng' },
];

// ─── Search bar ──────────────────────────────────────────────────────────────

interface SearchState {
  location: string;
  priceIndex: number;
  type: Property['type'] | 'all';
}

function DropdownField({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { label: string; value: string; icon?: React.ElementType }[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="h-full px-6 flex flex-col justify-center text-left hover:bg-black/5 transition-colors gap-0.5"
      >
        <span className="text-[10px] font-bold text-black/40 uppercase tracking-wide leading-none">
          {label}
        </span>
        <span className="text-sm font-medium text-black leading-tight flex items-center gap-1">
          {value}
          <svg
            className={`size-3 text-black/40 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M6 8L1 3h10z" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-black/5 py-2 w-52 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-black/5 transition-colors flex items-center gap-2 ${
                value === opt.value
                  ? 'font-semibold text-black'
                  : 'font-medium text-black/60'
              }`}
            >
              {opt.icon && <opt.icon className="size-4 shrink-0" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HeroSearchBar({ onSearch }: { onSearch: (s: SearchState) => void }) {
  const [state, setState] = useState<SearchState>({
    location: '',
    priceIndex: 0,
    type: 'all',
  });

  return (
    <div className="flex items-stretch bg-[#ffef3d] rounded-full shadow-xl h-[72px]">
      {/* Địa điểm */}
      <div className="flex-1 px-6 flex flex-col justify-center text-left min-w-0 hover:bg-black/5 transition-colors cursor-text">
        <span className="text-[10px] font-bold text-black/40 uppercase tracking-wide leading-none mb-1">
          Địa điểm
        </span>
        <input
          type="text"
          value={state.location}
          onChange={(e) => setState((s) => ({ ...s, location: e.target.value }))}
          placeholder="Tìm quận, thành phố..."
          className="w-full text-sm font-medium text-black placeholder:text-black/40 outline-none bg-transparent leading-tight"
        />
      </div>

      {/* Divider */}
      <div className="flex items-center">
        <div className="w-px h-8 bg-black/10" />
      </div>

      {/* Khoảng giá */}
      <DropdownField
        label="Khoảng giá"
        value={PRICE_RANGES[state.priceIndex].label}
        options={PRICE_RANGES.map((r, i) => ({ label: r.label, value: String(i) }))}
        onSelect={(v) => setState((s) => ({ ...s, priceIndex: Number(v) }))}
      />

      {/* Divider */}
      <div className="flex items-center">
        <div className="w-px h-8 bg-black/10" />
      </div>

      {/* Loại phòng */}
      <DropdownField
        label="Loại phòng"
        value={CATEGORIES.find((c) => c.value === state.type)?.label ?? 'Tất cả'}
        options={CATEGORIES.map((c) => ({ label: c.label, value: c.value, icon: c.icon }))}
        onSelect={(v) => setState((s) => ({ ...s, type: v as SearchState['type'] }))}
      />

      {/* Nút tìm kiếm */}
      <div className="p-2 shrink-0 flex items-center">
        <button
          type="button"
          onClick={() => onSearch(state)}
          className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#4a4733] transition-all active:scale-95"
          aria-label="Tìm kiếm"
        >
          <Search className="size-5" />
        </button>
      </div>
    </div>
  );
}

// ─── listing grid ─────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

function PropertySection({
  activeType,
  filters,
  title,
  subtitle,
  showLoadMore = false,
  limit,
  excludePropertyIds,
  rentedPropertyIds,
}: {
  activeType: Property['type'] | 'all';
  filters: PropertyFilters;
  title?: string;
  subtitle?: string;
  showLoadMore?: boolean;
  limit?: number;
  excludePropertyIds?: string[];
  rentedPropertyIds?: Set<string>;
}) {
  const [page, setPage] = useState(1);

  const apiFilters: PropertyFilters = {
    ...filters,
    type: activeType !== 'all' ? activeType : undefined,
    status: 'available',
    page,
    limit: limit ?? PAGE_SIZE,
    excludePropertyIds,
  };

  const { data, isLoading } = useProperties(apiFilters);

  const properties = data?.data ?? [];
  const pagination = data?.pagination;
  const hasMore = showLoadMore && pagination ? page < pagination.totalPages : false;

  return (
    <div>
      {title && (
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-2xl font-semibold text-[#191c1d] mb-2">{title}</h2>
            {subtitle && <p className="text-[#4a4733]">{subtitle}</p>}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.slice(0, limit).map((p, i) => (
            <PropertyCard key={p.id ?? `p-${i}`} property={p} rentedPropertyIds={rentedPropertyIds} />
          ))}
        </div>
      )}

      {showLoadMore && hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setPage((n) => n + 1)}
            className="px-8 py-3 bg-[#ffef3d] text-[#1f1c00] text-sm font-semibold rounded-full hover:shadow-lg transition-all"
          >
            Xem thêm
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="w-16 h-16 bg-[#f3f4f5] rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="size-7 text-[#c1c1c1]" />
      </div>
      <h3 className="text-base font-semibold text-[#191c1d] mb-1">Không tìm thấy kết quả</h3>
      <p className="text-sm text-[#4a4733]">Thử thay đổi bộ lọc hoặc tìm kiếm ở khu vực khác.</p>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const heroImgRef = useRef<HTMLImageElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, hasHydrated, user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Property['type'] | 'all'>('all');
  const [apiFilters, setApiFilters] = useState<PropertyFilters>({});

  const { data: myBookings } = useAllMyBookings(hasHydrated && isAuthenticated);
  const rentedPropertyIds = new Set(
    (myBookings?.data ?? [])
      .filter((b) => ['confirmed', 'active', 'completed'].includes(b.status))
      .map((b) => (typeof b.property === 'string' ? b.property : b.property?.id))
      .filter(Boolean) as string[],
  );
  const excludedPropertyIds = Array.from(rentedPropertyIds);

  useEffect(() => {
    if (!heroImgRef.current) return;
    gsap.fromTo(
      heroImgRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    );
  }, []);

  useEffect(() => {
    if (!marqueeRef.current) return;
    const el = marqueeRef.current;
    const totalWidth = el.scrollWidth / 2;
    gsap.set(el, { x: 0 });
    gsap.to(el, {
      x: -totalWidth,
      duration: totalWidth / 60,
      ease: 'none',
      repeat: -1,
    });
  }, []);

  const handleSearch = (s: SearchState) => {
    const pr = PRICE_RANGES[s.priceIndex];
    setActiveCategory(s.type);
    setApiFilters({
      search: s.location || undefined,
      minPrice: pr.min,
      maxPrice: pr.max,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="hero-gradient pt-16 pb-32 px-4 md:px-10 text-center relative overflow-hidden">
          <div className="mx-auto mb-12" style={{ maxWidth: '768px' }}>
          <img
            ref={heroImgRef}
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d6a19a6c-fe0a-4c34-8af3-68d6a777b244"
            className="w-[943.67px] h-[113.01px] mb-12 object-fill opacity-0"
            alt=""
          />
          <WaveText
            text="Tìm nhà trọ phù hợp,<br>dễ dàng và nhanh chóng"
              className="text-4xl md:text-5xl font-bold text-[#191c1d] leading-tight mb-6"
            />
            <p className="text-lg text-[#4a4733]">
              Hàng nghìn phòng trọ, căn hộ, nhà nguyên căn đang chờ bạn khám phá.
            </p>
          </div>

          <div className="mx-auto" style={{ maxWidth: '896px' }}>
            <HeroSearchBar onSearch={handleSearch} />
          </div>
        </section>

        {/* ── Featured Properties ── */}
        <section className="py-24 px-4 md:px-10 mx-auto" style={{ maxWidth: '1280px' }}>
          <PropertySection
            key={`featured-${activeCategory}-${JSON.stringify(apiFilters)}`}
            activeType={activeCategory}
            filters={apiFilters}
            title="Bất động sản phù hợp với bạn"
            subtitle="Gợi ý những không gian sống tốt nhất dựa trên sở thích của bạn."
            limit={3}
            showLoadMore={false}
            excludePropertyIds={excludedPropertyIds}
            rentedPropertyIds={rentedPropertyIds}
          />

          <div className="mt-12 text-center">
          <Link
            href={`/properties${apiFilters.search || apiFilters.minPrice || apiFilters.maxPrice || activeCategory !== 'all'
              ? `?${[
                  apiFilters.search ? `search=${encodeURIComponent(apiFilters.search)}` : '',
                  apiFilters.minPrice ? `minPrice=${apiFilters.minPrice}` : '',
                  apiFilters.maxPrice ? `maxPrice=${apiFilters.maxPrice}` : '',
                  activeCategory !== 'all' ? `type=${activeCategory}` : '',
                ].filter(Boolean).join('&')}`
              : ''}`}
            className="px-8 py-3 bg-[#ffef3d] text-[#1f1c00] text-sm font-semibold rounded-full hover:shadow-lg transition-all inline-block"
          >
            Xem thêm
          </Link>
          </div>
        </section>

        {/* ── Banner ── */}
        <section className="w-full" style={{ height: '360px' }}>
          <img
            src="/background/ChatGPT Image Jun 14, 2026, 07_19_56 PM.png"
            alt="Smart choice, smart life"
            className="w-full h-full object-cover object-center"
            style={{ maxHeight: '360px' }}
          />
        </section>

        {/* ── Stats ── */}
        <section className="bg-[#edeeef] py-24 px-4 md:px-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl font-semibold text-[#191c1d] mb-4">
              Được tin dùng bởi hàng nghìn người
            </h2>
            <p className="text-[#4a4733] mb-16 max-w-2xl mx-auto leading-relaxed">
              Nền tảng thuê nhà thông minh, minh bạch từ đăng tin đến ký hợp đồng.
              <br />
              Tất cả trong một nơi.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { value: '10.000+', label: 'Tin đăng', sub: 'Trên toàn quốc' },
                { value: '2.500+', label: 'Chủ nhà đã xác minh', sub: 'Hồ sơ rõ ràng' },
                { value: '8.000+', label: 'Người thuê hài lòng', sub: 'Đánh giá 4.8/5' },
              ].map((s) => (
                <div key={s.label} className="p-8 rounded-3xl bg-white shadow-sm">
                  <p className="text-4xl font-bold text-[#676000] mb-2">{s.value}</p>
                  <p className="text-sm font-semibold text-[#191c1d]">{s.label}</p>
                  <p className="text-xs text-[#4a4733]">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="py-24 px-4 md:px-10 bg-[#f3f4f5]">
          <div className="mx-auto" style={{ maxWidth: '1280px' }}>
            <h2 className="text-2xl font-semibold text-[#191c1d] text-center mb-16">
              Cách Smart Rental hoạt động
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: '1',
                  title: 'Tìm & đặt phòng',
                  desc: 'Lọc theo khu vực, giá, loại phòng.\nGửi yêu cầu đặt phòng ngay trên app.',
                },
                {
                  step: '2',
                  title: 'Xác nhận & thanh toán',
                  desc: 'Chủ nhà xác nhận trong 24h.\nThanh toán tiền cọc và tháng đầu an toàn.',
                },
                {
                  step: '3',
                  title: 'Ký hợp đồng điện tử',
                  desc: 'Hợp đồng số hóa, có hiệu lực pháp lý.\nLưu trữ trên cloud, truy cập mọi lúc.',
                },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#676000] text-white font-bold text-xl flex items-center justify-center mb-6 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-[#191c1d] mb-3">{item.title}</h3>
                  <p className="text-[#4a4733] leading-relaxed whitespace-pre-line">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Popular Cities ── */}
        <section className="py-16 px-4 md:px-10 bg-[#f8f9fa] overflow-hidden">
          <div className="mx-auto" style={{ maxWidth: '1280px' }}>
            <h2 className="text-sm font-semibold text-[#191c1d] mb-8 uppercase tracking-widest text-center md:text-left">
              Khám phá theo thành phố
            </h2>
            <div className="relative">
              <div ref={marqueeRef} className="flex gap-6">
                {[...POPULAR_CITIES, ...POPULAR_CITIES].map((c, i) => (
                  <div key={`${c.city}-${i}`} className="cursor-pointer group shrink-0">
                    <p className="text-sm font-semibold text-[#191c1d] group-hover:text-[#676000] transition-all whitespace-nowrap">
                      {c.city}
                    </p>
                    <p className="text-xs text-[#4a4733] whitespace-nowrap">{c.subtitle}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 px-4 md:px-10 bg-white">
          <div className="mx-auto text-center" style={{ maxWidth: '896px' }}>
            <WaveText
              text="Bắt đầu ngay hôm nay!"
              className="text-4xl md:text-5xl font-bold text-[#676000] mb-6 leading-tight"
            />
            <p className="text-lg text-[#4a4733] mb-12">
              Tạo tài khoản miễn phí để lưu tin yêu thích, đặt phòng và nhận thông báo mới nhất.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full md:w-auto px-10 py-4 bg-[#ffef3d] text-[#1f1c00] text-sm font-semibold rounded-full hover:shadow-lg transition-all active:scale-95"
              >
                Tạo tài khoản miễn phí
              </Link>
              <Link
                href="/login"
                className="w-full md:w-auto px-10 py-4 border border-[#7b7861] text-[#191c1d] text-sm font-semibold rounded-full hover:bg-[#f3f4f5] transition-all active:scale-95"
              >
                Đăng nhập
              </Link>
            </div>

            <div className="mt-24 p-8 md:p-12 bg-[#f3f4f5] rounded-[40px] flex flex-col md:flex-row items-center justify-between text-left gap-8">
              <div>
                <h3 className="text-xl font-semibold text-[#191c1d] mb-2">Bạn là chủ nhà?</h3>
                <p className="text-[#4a4733] leading-relaxed">
                  Đăng tin miễn phí, quản lý đặt phòng và hợp đồng điện tử.
                  <br />
                  Tất cả chỉ trong một dashboard!
                </p>
              </div>
              <Link
                href={isAuthenticated ? '/hosting' : '/register'}
                className="shrink-0 px-8 py-4 bg-[#ffef3d] text-[#1f1c00] text-sm font-semibold rounded-full hover:shadow-xl transition-all active:scale-95"
              >
                Đăng tin cho thuê
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
