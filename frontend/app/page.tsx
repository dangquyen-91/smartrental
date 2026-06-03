'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, Building2, Home, Hotel, Box, LogOut, User, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';
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

// ─── User dropdown menu ─────────────────────────────────────────────────────

function UserMenu({ user }: { user: { name?: string | null; email?: string | null; avatar?: string | null; role?: string } | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-[#f7f7f7] transition-colors"
      >
        {user?.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name ?? 'Avatar'}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover border border-[#ddd]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#ff385c] text-white flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
        )}
        <ChevronDown className={cn('w-4 h-4 text-[#6A6A6A] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-xl shadow-lg border border-[#EEEEEE] z-50 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-[#EEEEEE]">
              <p className="text-sm font-semibold text-[#222222] truncate">{user?.name}</p>
              <p className="text-xs text-[#6A6A6A] truncate mt-0.5">{user?.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#222222] hover:bg-[#F6F8FB] transition-colors"
              >
                <User className="w-4 h-4" />
                Tài khoản của tôi
              </Link>

              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#2683EB] hover:bg-[#F6F8FB] transition-colors font-semibold"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Trang quản trị
                </Link>
              )}

              {user?.role === 'landlord' && (
                <Link
                  href="/hosting"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#222222] hover:bg-[#F6F8FB] transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Quản lý chỗ ở
                </Link>
              )}

              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#222222] hover:bg-[#F6F8FB] transition-colors"
              >
                <Settings className="w-4 h-4" />
                Cài đặt
              </Link>
            </div>

            {/* Logout */}
            <div className="py-1 border-t border-[#EEEEEE]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#c13515] hover:bg-[#F6F8FB] transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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
      {/* Yellow pill search */}
      <div className="flex items-stretch bg-[#FFF546] rounded-[40px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.10)]">
        {/* Location */}
        <div className="flex-1 px-8 py-4 border-r border-black/10 text-left min-w-0">
          <p className="text-[12px] font-bold text-black mb-0.5 flex items-center gap-1 uppercase tracking-wide">
            Địa điểm
          </p>
          <input
            type="text"
            value={state.location}
            onChange={(e) =>
              setState((s) => ({ ...s, location: e.target.value }))
            }
            placeholder="Tìm quận, thành phố..."
            className="w-full text-sm font-medium text-black placeholder:text-[#929292] outline-none bg-transparent"
          />
        </div>

        {/* Price range */}
        <div className="px-8 py-4 border-r border-black/10 text-left shrink-0">
          <p className="text-[12px] font-bold text-black mb-0.5 uppercase tracking-wide">
            Khoảng giá
          </p>
          <select
            value={state.priceIndex}
            onChange={(e) =>
              setState((s) => ({ ...s, priceIndex: Number(e.target.value) }))
            }
            className="text-sm font-medium text-black outline-none bg-transparent cursor-pointer"
          >
            {PRICE_RANGES.map((r, i) => (
              <option key={i} value={i}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Property type */}
        <div className="px-8 py-4 text-left shrink-0">
          <p className="text-[12px] font-bold text-black mb-0.5 uppercase tracking-wide">
            Loại phòng
          </p>
          <select
            value={state.type}
            onChange={(e) =>
              setState((s) => ({ ...s, type: e.target.value as SearchState['type'] }))
            }
            className="text-sm font-medium text-black outline-none bg-transparent cursor-pointer"
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
            className="w-12 h-12 bg-black hover:bg-[#3a3a3a] rounded-full flex items-center justify-center text-white transition-all active:scale-95"
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
        <p className="text-sm text-[#6A6A6A] mb-6">
          <span className="font-semibold text-[#222222]">{total}</span> bất động sản phù hợp với bạn
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
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
            className="px-6 py-3 text-sm font-semibold text-[#222222] border border-[#222222] rounded-[40px] hover:bg-[#FFF546] transition-colors disabled:opacity-50"
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
      <div className="size-16 bg-[#f7f7f7] rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="size-7 text-[#c1c1c1]" />
      </div>
      <h3 className="text-base font-semibold text-[#222222] mb-1">
        Không tìm thấy kết quả
      </h3>
      <p className="text-sm text-[#6A6A6A]">
        Thử thay đổi bộ lọc hoặc tìm kiếm ở khu vực khác.
      </p>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
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
      <main className="flex-1">
        {/* ── Hero ── */}
        <section
          className="relative bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
            paddingTop: 22,
            paddingBottom: 1,
          }}
        >
          {/* Top bar */}
          <div className="max-w-[1218px] mx-auto px-5 flex items-center justify-between mb-[160px]">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/logo/SmartRental_02.png"
                alt="SmartRental"
                width={182}
                height={26}
                className="w-auto h-auto object-contain"
                priority
              />
            </Link>

            {/* Auth buttons / User avatar */}
            <div className="flex items-center gap-2 relative z-10">
              {isAuthenticated ? (
                <UserMenu user={user} />
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-bold text-[#222222] hover:bg-[#f7f7f7] rounded-[20px] transition-colors"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-bold text-white bg-[#222222] hover:bg-[#3a3a3a] rounded-[20px] transition-colors"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Hero content */}
          <div className="max-w-[1218px] mx-auto px-5 flex flex-col items-center text-center mb-[137px]">
            <h1 className="text-[35px] font-bold text-black leading-tight mb-6">
              Tìm nhà trọ phù hợp,
              <br />
              dễ dàng và nhanh chóng
            </h1>
            <p className="text-[20px] text-black mb-[55px]">
              Hàng nghìn phòng trọ, căn hộ, nhà nguyên căn đang chờ bạn khám phá.
            </p>
            <HeroSearchBar onSearch={handleSearch} />
          </div>
        </section>

        {/* ── Listings ── */}
        <section className="max-w-[1218px] mx-auto px-6 py-10">
          <h2 className="text-[25px] font-bold text-[#222222] mb-6">
            03 bất động sản phù hợp với bạn
          </h2>

          <ListingSection
            key={`${activeCategory}-${JSON.stringify(apiFilters)}`}
            activeType={activeCategory}
            filters={apiFilters}
          />

          {/* View all button */}
          <div className="mt-10 text-center">
            <button className="px-6 py-3 text-[25px] font-medium text-black bg-[#FFF546] rounded-[40px] hover:brightness-95 transition-all active:scale-95">
              Xem thêm
            </button>
          </div>
        </section>

        {/* ── Trusted brand banner ── */}
        <section className="bg-black py-9 px-[208px] mb-[84px]">
          <p className="max-w-[1024px] mx-auto text-center text-white font-[family-name:var(--font-berkshire)] text-[clamp(1.75rem,4vw,3rem)] tracking-[0.05em]">
            Smart choice, smart life
          </p>
        </section>

        {/* ── Stats ── */}
        <section className="bg-[#F6F8FB] py-16 px-6 mb-[55px]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-[40px] font-bold text-black mb-3 leading-tight">
              Được tin dùng bởi hàng nghìn người
            </h2>
            <p className="text-[20px] text-[#6A6A6A] mb-12 leading-relaxed">
              Nền tảng thuê nhà thông minh, minh bạch từ đăng tin đến ký hợp đồng.
              <br />
              Tất cả trong một nơi.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
              {[
                { value: '10.000+', label: 'Tin đăng', sub: 'Trên toàn quốc' },
                { value: '2.500+', label: 'Chủ nhà đã xác minh', sub: 'Hồ sơ rõ ràng' },
                { value: '8.000+', label: 'Người thuê hài lòng', sub: 'Đánh giá 4.8/5' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[40px] font-bold text-[#2683EB] mb-1">{s.value}</p>
                  <p className="text-[18px] font-semibold text-[#222222]">{s.label}</p>
                  <p className="text-[15px] text-[#6A6A6A] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Popular cities ── */}
        <section className="max-w-[1232px] mx-auto px-6 py-10 mb-[56px]">
          <h2 className="text-[25px] font-bold text-[#222222] mb-7">
            Khám phá theo thành phố
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-5">
            {POPULAR_CITIES.map((c, i) => (
              <div key={c.city} className="flex flex-col items-start">
                <p className="text-base font-bold text-black leading-snug">{c.city}</p>
                <p className="text-sm text-[#6C6C6C] mt-0.5">{c.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="bg-[#F6F8FB] py-16 px-[208px] mb-[114px]">
          <h2 className="text-[40px] font-bold text-black mb-10 text-center">
            Cách Smart Rental hoạt động
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
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
                <div className="w-12 h-12 rounded-full bg-[#2683EB] text-white font-bold text-[18px] flex items-center justify-center mb-4">
                  {item.step}
                </div>
                <h3 className="text-[20px] font-semibold text-[#222222] mb-2">{item.title}</h3>
                <p className="text-[15px] text-[#6A6A6A] leading-relaxed whitespace-pre-line">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="max-w-[1218px] mx-auto px-6 py-10 mb-[137px] flex flex-col items-center gap-5">
          <h2 className="text-[50px] font-bold text-[#2683EB] leading-tight">
            Bắt đầu ngay hôm nay!
          </h2>
          <p className="text-[20px] text-[#6A6A6A]">
            Tạo tài khoản miễn phí để lưu tin yêu thích, đặt phòng và nhận thông báo mới nhất.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-5 py-4 text-base font-bold text-white bg-black hover:bg-[#3a3a3a] rounded-[8px] transition-colors"
            >
              Tạo tài khoản miễn phí
            </Link>
            <Link
              href="/login"
              className="px-5 py-4 text-base font-bold text-[#222222] border border-[#DDDDDD] rounded-[8px] hover:bg-[#f7f7f7] transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        </section>

        {/* ── Landlord CTA ── */}
        <section className="max-w-[1024px] mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-[#DDDDDD] mb-[90px]">
          <div>
            <h2 className="text-[25px] font-bold text-[#222222] mb-2">
              Bạn là chủ nhà?
            </h2>
            <p className="text-[15px] text-[#6A6A6A] max-w-md leading-relaxed">
              Đăng tin miễn phí, quản lý đặt phòng và hợp đồng điện tử.
              <br />
              Tất cả chỉ trong một dashboard!
            </p>
          </div>
          <Link
            href={isAuthenticated ? '/hosting' : '/register'}
            className="shrink-0 px-6 py-3 text-sm font-bold text-white bg-black hover:bg-[#3a3a3a] rounded-[8px] transition-colors whitespace-nowrap"
          >
            Đăng tin cho thuê
          </Link>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#FFF546] border-t border-[#DDDDDD] py-10 px-[80px]">
        <div className="max-w-[1218px] mx-auto">
          <div className="flex flex-col sm:flex-row gap-8 mb-8">
            {/* Brand */}
            <div className="flex-1">
              <Image
                src="/logo/SmartRental_02.png"
                alt="SmartRental"
                width={182}
                height={25}
                style={{ width: 'auto', height: 'auto' }}
                className="object-contain mb-3"
              />
              <p className="text-[14px] text-black leading-relaxed">
                Nền tảng thuê nhà thông minh cho thị trường Việt Nam.
              </p>
            </div>

            {/* Support */}
            <div className="flex-1 flex flex-col gap-3">
              <p className="text-[14px] font-bold text-black">Hỗ trợ</p>
              {['Trung tâm trợ giúp', 'Liên hệ', 'Chính sách bảo mật', 'Điều khoản sử dụng'].map((t) => (
                <p key={t} className="text-[14px] text-[#6A6A6A] cursor-pointer hover:text-black transition-colors">
                  {t}
                </p>
              ))}
            </div>

            {/* For landlords */}
            <div className="flex-1 flex flex-col gap-3">
              <p className="text-[14px] font-bold text-black">Dành cho chủ nhà</p>
              {['Đăng tin cho thuê', 'Quản lý đặt phòng', 'Hợp đồng điện tử', 'Gói dịch vụ'].map((t) => (
                <p key={t} className="text-[14px] text-[#6A6A6A] cursor-pointer hover:text-black transition-colors">
                  {t}
                </p>
              ))}
            </div>
          </div>

          <div className="border-t border-[#6C6C6C] pt-6 flex items-center justify-between">
            <p className="text-[12px] text-[#6C6C6C]">© 2026 Smart Rental. Nền tảng thuê nhà thông minh.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
