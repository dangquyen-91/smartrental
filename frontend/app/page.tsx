'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, LogOut, Building2, Heart, MapPin } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { logoutApi } from '@/lib/api/auth.api';

const LISTINGS = [
  { id: 1, district: 'Quận 1', city: 'TP. Hồ Chí Minh', type: 'Phòng trọ', price: '3.500.000', rating: 4.92, reviews: 38, bg: 'bg-[#f0ede8]' },
  { id: 2, district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh', type: 'Căn hộ mini', price: '5.000.000', rating: 4.85, reviews: 62, bg: 'bg-[#e8eeee]' },
  { id: 3, district: 'Thủ Đức', city: 'TP. Hồ Chí Minh', type: 'Phòng trọ', price: '2.800.000', rating: 4.78, reviews: 24, bg: 'bg-[#eeebe8]' },
  { id: 4, district: 'Gò Vấp', city: 'TP. Hồ Chí Minh', type: 'Nhà nguyên căn', price: '8.000.000', rating: 4.95, reviews: 15, bg: 'bg-[#e8ecf0]' },
  { id: 5, district: 'Quận 7', city: 'TP. Hồ Chí Minh', type: 'Căn hộ dịch vụ', price: '7.500.000', rating: 4.88, reviews: 43, bg: 'bg-[#f0ebe8]' },
  { id: 6, district: 'Quận 12', city: 'TP. Hồ Chí Minh', type: 'Phòng trọ', price: '2.500.000', rating: 4.71, reviews: 19, bg: 'bg-[#eaeef0]' },
];

const CATEGORIES = ['Phòng trọ', 'Căn hộ', 'Nhà nguyên căn'];

export default function HomePage() {
  const router = useRouter();
  const { user, accessToken, clearAuth } = useAuthStore();
  const isAuthenticated = !!accessToken;
  const [activeCategory, setActiveCategory] = useState('Phòng trọ');

  const handleLogout = async () => {
    try {
      await logoutApi();
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="bg-white border-b border-[#dddddd] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-bold text-xl tracking-tight">
              <span className="text-[#222222]">Smart</span>
              <span className="text-[#ff385c]">Rental</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <span className="text-sm font-medium text-[#222222] hidden sm:block mr-2">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#222222] border border-[#dddddd] rounded-[20px] hover:bg-[#f7f7f7] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[#222222] hover:bg-[#f7f7f7] rounded-[20px] transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#ff385c] rounded-[20px] hover:bg-[#e00b41] transition-all active:scale-95"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-[#f7f7f7] py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-[2.25rem] font-bold text-[#222222] leading-tight mb-4">
              Tìm nhà trọ phù hợp,
              <br />
              dễ dàng và nhanh chóng
            </h1>
            <p className="text-base font-medium text-[#6a6a6a] mb-10">
              Hàng nghìn phòng trọ, căn hộ, nhà nguyên căn đang chờ bạn khám phá.
            </p>

            {/* 3-segment search pill */}
            <div className="flex items-center bg-white border border-[#dddddd] rounded-[32px] shadow-[0_2px_6px_rgba(0,0,0,0.04)] overflow-hidden max-w-2xl mx-auto">
              <div className="flex-1 px-5 py-3.5 border-r border-[#dddddd] text-left min-w-0">
                <p className="text-xs font-semibold text-[#222222] mb-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Địa điểm
                </p>
                <input
                  type="text"
                  placeholder="Tìm quận, phường..."
                  className="w-full text-sm font-medium text-[#222222] placeholder:text-[#929292] outline-none bg-transparent"
                />
              </div>
              <div className="px-5 py-3.5 border-r border-[#dddddd] text-left flex-shrink-0">
                <p className="text-xs font-semibold text-[#222222] mb-0.5">Khoảng giá</p>
                <p className="text-sm font-medium text-[#929292]">Tuỳ chọn</p>
              </div>
              <div className="px-5 py-3.5 text-left flex-shrink-0">
                <p className="text-xs font-semibold text-[#222222] mb-0.5">Loại phòng</p>
                <p className="text-sm font-medium text-[#929292]">Tất cả</p>
              </div>
              <div className="p-2 flex-shrink-0">
                <button className="w-12 h-12 bg-[#ff385c] hover:bg-[#e00b41] rounded-full flex items-center justify-center text-white transition-all active:scale-95">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories + Listings */}
        <section className="max-w-7xl mx-auto px-6 py-10">
          {/* Category tabs */}
          <div className="flex gap-8 border-b border-[#dddddd] mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`pb-3 text-base font-medium transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? 'text-[#222222] border-b-2 border-[#222222] -mb-px'
                    : 'text-[#6a6a6a] hover:text-[#222222]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Listing grid — 3 cols desktop, 2 tablet, 1 mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
            {LISTINGS.map((listing) => (
              <div key={listing.id} className="cursor-pointer group">
                {/* Placeholder image — 4:3 aspect ratio */}
                <div
                  className={`aspect-[4/3] ${listing.bg} rounded-[14px] overflow-hidden mb-3 relative`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="w-14 h-14 text-[#c1c1c1]" />
                  </div>
                  {/* Favorite icon button — 50% radius per DESIGN.md */}
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
                    <Heart className="w-4 h-4 text-[#222222]" />
                  </button>
                </div>

                {/* Metadata — 4-8px gaps between rows */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-[#222222]">{listing.district}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-[#222222]">★</span>
                      <span className="text-sm font-medium text-[#222222]">{listing.rating}</span>
                      <span className="text-sm text-[#929292]">({listing.reviews})</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-[#6a6a6a]">{listing.type}</p>
                  <p className="text-base font-medium text-[#222222]">
                    {listing.price}₫
                    <span className="text-sm font-medium text-[#6a6a6a]"> / tháng</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <button className="px-6 py-3 text-sm font-medium text-[#222222] border border-[#dddddd] rounded-[8px] hover:bg-[#f7f7f7] transition-colors underline underline-offset-2">
              Xem tất cả tin đăng
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-[#f7f7f7] py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-[1.75rem] font-bold text-[#222222] mb-10">
              Được tin dùng bởi hàng nghìn người
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
              {[
                { value: '10.000+', label: 'Tin đăng' },
                { value: '2.500+', label: 'Chủ nhà đã xác minh' },
                { value: '8.000+', label: 'Người thuê hài lòng' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[2rem] font-bold text-[#ff385c] mb-1">{s.value}</p>
                  <p className="text-base font-medium text-[#6a6a6a]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — only when not authenticated */}
        {!isAuthenticated && (
          <section className="py-20 px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-[1.75rem] font-bold text-[#222222] mb-4">
                Bắt đầu ngay hôm nay
              </h2>
              <p className="text-base font-medium text-[#6a6a6a] mb-8">
                Tạo tài khoản miễn phí để lưu tin yêu thích và nhận thông báo phòng trọ mới.
              </p>
              <Link
                href="/register"
                className="inline-block px-8 py-4 text-base font-medium text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-[8px] transition-all active:scale-95"
              >
                Tạo tài khoản miễn phí
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dddddd] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-[#6a6a6a]">
            © 2026 SmartRental. Nền tảng thuê nhà thông minh.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-sm font-medium text-[#6a6a6a] hover:text-[#222222] transition-colors"
            >
              Điều khoản
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-medium text-[#6a6a6a] hover:text-[#222222] transition-colors"
            >
              Bảo mật
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
