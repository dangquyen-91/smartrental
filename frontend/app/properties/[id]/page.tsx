'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin, Maximize2, BedDouble, Bath, Wifi, Shield, Wind,
  ChevronLeft, ChevronRight, X, CalendarDays, Phone, User,
  Sofa, Camera, Flame, Droplets, Zap, Dog, Dumbbell, Tv,
  UtensilsCrossed, Sun, Package, Lock, AirVent, WashingMachine,
  ParkingCircle, ArrowUpDown, LockKeyhole, Check, Star, ArrowLeft, Heart,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';
import { PriceDisplay } from '@/components/ui/price-display';
import { PropertyReviewSection } from '@/components/shared/review-list';
import { useProperty } from '@/hooks/use-properties';
import { useAllMyBookings } from '@/hooks/use-bookings';
import { useCreateBooking } from '@/hooks/use-bookings';
import { useAuth } from '@/hooks/use-auth';
import { useWishlist, useToggleWishlist } from '@/hooks/use-wishlist';
import { cn } from '@/lib/utils';
import type { Property } from '@/types';

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

const TYPE_LABEL: Record<Property['type'], string> = {
  room: 'Phòng trọ',
  apartment: 'Căn hộ',
  house: 'Nhà nguyên căn',
  studio: 'Studio',
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, 'wi-fi': Wifi, 'wi fi': Wifi,
  ac: AirVent, 'air conditioning': AirVent, 'điều hòa': AirVent, 'máy lạnh': AirVent,
  parking: ParkingCircle, 'bãi đỗ xe': ParkingCircle, 'đỗ xe': ParkingCircle,
  security: Shield, 'bảo vệ': Shield, 'an ninh': Shield, 'camera an ninh': Camera,
  'nội thất': Sofa, 'nội thất đầy đủ': Sofa, 'fully furnished': Sofa,
  'máy giặt': WashingMachine, 'giặt sấy': WashingMachine, laundry: WashingMachine,
  'sân phơi': Sun, 'phơi đồ': Sun,
  bếp: UtensilsCrossed, 'nhà bếp': UtensilsCrossed, kitchen: UtensilsCrossed,
  tv: Tv, tivi: Tv,
  'nước nóng': Droplets, 'water heater': Droplets,
  điện: Zap, electricity: Zap,
  gas: Flame, 'bình gas': Flame,
  'thang máy': ArrowUpDown, elevator: ArrowUpDown, lift: ArrowUpDown,
  gym: Dumbbell, 'phòng gym': Dumbbell, fitness: Dumbbell,
  'thú cưng': Dog, pet: Dog,
  'gần chợ': ShoppingCartIcon, 'siêu thị': ShoppingCartIcon, chợ: ShoppingCartIcon,
  kho: Package, 'kho chứa': Package, storage: Package,
  'khóa cửa': Lock, private: Lock,
  'ban công': Wind, balcony: Wind,
  default: Maximize2,
};

function ShoppingCartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

function getAmenityIcon(name: string): React.ElementType {
  const key = name.toLowerCase().trim();
  if (AMENITY_ICONS[key]) return AMENITY_ICONS[key];
  for (const [pattern, Icon] of Object.entries(AMENITY_ICONS)) {
    if (pattern !== 'default' && key.includes(pattern)) return Icon;
  }
  return AMENITY_ICONS.default;
}

// ─── image gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images, title }: { images: { url: string }[]; title: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const urls = images.length > 0 ? images.map((i) => i.url) : ['/placeholder.jpg'];
  const count = urls.length;

  const open = (i: number) => setLightbox(i);
  const close = () => setLightbox(null);
  const prev = () => setLightbox((n) => (n! === 0 ? urls.length - 1 : n! - 1));
  const next = () => setLightbox((n) => (n! === urls.length - 1 ? 0 : n! + 1));

  // 1–2 images: full-width hero
  if (count <= 2) {
    return (
      <>
        <div className="grid grid-cols-1 gap-4">
          <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-[#f0f0f0]">
            <img src={urls[0]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(0)} />
            {count > 1 && (
              <button onClick={() => open(1)} className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-black/70 transition-colors">
                1 / {count}
              </button>
            )}
          </div>
          {count === 2 && (
            <div className="relative w-full h-[280px] md:h-[360px] rounded-2xl overflow-hidden bg-[#f0f0f0]">
              <img src={urls[1]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(1)} />
            </div>
          )}
        </div>

        {lightbox !== null && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={close}>
            <button onClick={(e) => { e.stopPropagation(); close(); }} className="absolute top-4 right-4 text-white text-3xl">&times;</button>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 text-white text-4xl">&#8249;</button>
            <img src={urls[lightbox]} alt={title} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 text-white text-4xl">&#8250;</button>
            <span className="absolute bottom-4 text-white/70 text-sm">{lightbox + 1} / {urls.length}</span>
          </div>
        )}
      </>
    );
  }

  // 3+ images: masonry-style grid
  return (
    <>
      {/* Mobile: single image */}
      <div className="md:hidden relative w-full h-[280px] rounded-2xl overflow-hidden bg-[#f0f0f0]">
        <img src={urls[0]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(0)} />
        {count > 1 && (
          <button
            onClick={() => open(0)}
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-[#222] text-sm font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-white transition-colors"
          >
            Xem tất cả {count} ảnh
          </button>
        )}
      </div>

      {/* Desktop: masonry grid */}
      <div className="hidden md:grid grid-cols-3 gap-4">
        {/* Left: large image (spans 2 cols + 2 rows) */}
        <div className="col-span-2 row-span-2 relative h-[500px] rounded-2xl overflow-hidden bg-[#f0f0f0]">
          <img src={urls[0]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(0)} />
        </div>

        {/* Right: top small image */}
        <div className="relative h-[245px] rounded-2xl overflow-hidden bg-[#f0f0f0]">
          <img src={urls[1]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(1)} />
        </div>

        {/* Right: bottom small image with overlay */}
        <div className="relative h-[245px] rounded-2xl overflow-hidden bg-[#f0f0f0]">
          <img src={urls[2]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(2)} />
          {count > 3 && (
            <div
              className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors"
              onClick={() => open(3)}
            >
              <span className="text-white text-lg font-bold">+{count - 3}</span>
            </div>
          )}
          {count > 3 && (
            <button
              onClick={() => open(3)}
              className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-[#222] text-sm font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-white transition-colors"
            >
              Xem tất cả {count} ảnh
            </button>
          )}
          {count === 3 && (
            <button
              onClick={() => open(0)}
              className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-[#222] text-sm font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-white transition-colors"
            >
              Xem tất cả {count} ảnh
            </button>
          )}
        </div>
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={close}>
          <button onClick={(e) => { e.stopPropagation(); close(); }} className="absolute top-4 right-4 text-white text-3xl">&times;</button>
          <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 text-white text-4xl">&#8249;</button>
          <img src={urls[lightbox]} alt={title} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 text-white text-4xl">&#8250;</button>
          <span className="absolute bottom-4 text-white/70 text-sm">{lightbox + 1} / {urls.length}</span>
        </div>
      )}
    </>
  );
}

// ─── booking panel ────────────────────────────────────────────────────────────

function BookingPanel({ property, effectiveStatus, contactRevealed, hasPendingBooking }: { property: Property; effectiveStatus: string; contactRevealed: boolean; hasPendingBooking: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { mutate: createBooking, isPending, error } = useCreateBooking();
  const [justBooked, setJustBooked] = useState(false);

  const isOwner = typeof property.owner === 'object' ? property.owner.id === user?.id : property.owner === user?.id;
  const unavailable = effectiveStatus !== 'available';

  const handleBook = () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    createBooking({ property: property.id, startDate: todayStr(), duration: 1 }, { onSuccess: () => setJustBooked(true) });
  };

  if (justBooked || hasPendingBooking) {
    return (
      <div className="w-full p-6 rounded-2xl border border-gray-100 shadow-lg shadow-black/5 bg-white">
        <div className="text-center py-6">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-emerald-500" />
          </div>
          <h3 className="text-base font-semibold text-ink-black mb-1">Đã gửi yêu cầu!</h3>
          <p className="text-sm text-ash-gray mb-6 leading-relaxed">
            Chủ nhà sẽ liên hệ và xác nhận trong vòng 24h.
          </p>
          <Link
            href="/trips"
            className="block w-full text-center py-3 bg-[#ffef3d] hover:shadow-lg text-[#1f1c00] font-semibold rounded-xl transition-all text-sm"
          >
            Xem đơn thuê của tôi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-gray-100 shadow-lg shadow-black/5 bg-white overflow-hidden">
      {/* Price header */}
      <div className="px-6 pt-6 pb-5 border-b border-gray-100">
        <div className="flex items-baseline gap-1.5">
          <PriceDisplay amount={property.price} size="lg" />
          <span className="text-ash-gray text-sm">/ tháng</span>
        </div>

        {/* First month total */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm font-semibold text-ink-black">Thanh toán tháng đầu</span>
          <span className="text-sm font-semibold text-ink-black">{formatVnd(property.price)}</span>
        </div>
        <p className="text-xs text-stone-gray mt-1">
          Các tháng tiếp theo thanh toán trực tiếp cho chủ nhà
        </p>
      </div>

      {/* CTA area */}
      <div className="px-6 py-5 flex flex-col gap-3">
        {isOwner ? (
          <div className="text-center py-3 text-sm text-ash-gray bg-soft-cloud rounded-xl">
            Đây là tin đăng của bạn
          </div>
        ) : unavailable ? (
          <div className="text-center py-3 text-sm text-ash-gray bg-soft-cloud rounded-xl">
            Phòng đang {effectiveStatus === 'rented' ? 'có người thuê' : 'bảo trì'}
          </div>
        ) : (
          <>
            {error && (
              <p className="text-xs text-red-500 text-center">Không thể đặt phòng. Vui lòng thử lại.</p>
            )}
            <button
              onClick={handleBook}
              disabled={isPending}
              className="w-full py-3.5 bg-[#ffef3d] text-[#1f1c00] font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-60 active:scale-[0.98] text-sm"
            >
              {isPending ? 'Đang gửi...' : isAuthenticated ? 'Gửi yêu cầu thuê' : 'Đăng nhập để đặt phòng'}
            </button>
            <p className="text-center text-xs text-stone-gray">
              Bạn chưa bị tính phí — chủ nhà xác nhận trước
            </p>
          </>
        )}

        <div className="flex items-center gap-2 pt-1">
          <LockKeyhole className="w-3.5 h-3.5 text-stone-gray shrink-0" />
          <span className="text-xs text-stone-gray leading-relaxed">
            SĐT hiển thị sau khi đặt phòng và thanh toán
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── quick info strip ─────────────────────────────────────────────────────────

function QuickInfo({ property }: { property: Property }) {
  const items = [
    { icon: Maximize2, label: 'Diện tích', value: `${property.area} m²` },
    ...(property.bedrooms !== undefined ? [{ icon: BedDouble, label: 'Phòng ngủ', value: String(property.bedrooms) }] : []),
    ...(property.bathrooms !== undefined ? [{ icon: Bath, label: 'Phòng tắm', value: String(property.bathrooms) }] : []),
    ...(property.pricePerM2 ? [{ icon: MapPin, label: 'Giá/m²', value: formatVnd(property.pricePerM2) }] : []),
  ];

  return (
    <div className="flex items-center justify-between w-full py-4 border-b border-gray-100">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[#6A6A6A] shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs text-[#6A6A6A]">{label}</span>
            <span className="text-base font-semibold text-[#222222]">{value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useProperty(id);
  const { isAuthenticated, hasHydrated, user } = useAuth();
  const { data: myBookingsData } = useAllMyBookings(hasHydrated && isAuthenticated);
  const { data: savedIds = [] } = useWishlist();
  const { mutate: toggleWishlist } = useToggleWishlist(id);
  const [heartAnim, setHeartAnim] = useState(false);
  const saved = savedIds.includes(id);
  const router = useRouter();

  const toggleSaved = () => {
    if (!isAuthenticated) {
      toast('Đăng nhập để lưu tin đăng yêu thích', { action: { label: 'Đăng nhập', onClick: () => router.push('/login') } });
      return;
    }
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 400);
    toggleWishlist();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="self-stretch bg-white pb-[1px]">
          <div className="self-stretch bg-cover bg-center py-6 px-4 md:px-20 mb-[68px] bg-[#f0f0f0] animate-pulse" />
          <div className="max-w-[1104px] mb-8 mx-auto px-6">
            <div className="h-8 w-64 bg-[#f0f0f0] rounded animate-pulse mb-4" />
            <div className="h-48 bg-[#f0f0f0] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.data?.property) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-[#222222] mb-2">Không tìm thấy bất động sản</h2>
        <p className="text-[#6A6A6A] text-sm mb-6">Tin đăng này có thể đã bị xoá hoặc không tồn tại.</p>
        <Link href="/" className="px-5 py-2.5 bg-[#ffef3d] text-[#1f1c00] font-semibold rounded-xl text-sm hover:shadow-lg transition-all">Về trang chủ</Link>
      </div>
    );
  }

  const p = data.data.property;
  const contactRevealed = data.data.contactRevealed ?? false;
  const ownerUser = typeof p.owner === 'object' ? p.owner : null;
  const address = [p.address?.street, p.address?.ward, p.address?.district, p.address?.city].filter(Boolean).join(', ');

  const allBookings = myBookingsData?.data ?? [];

  // Build set of property IDs that the tenant has a confirmed/active booking for
  const rentedPropertyIds = new Set(
    allBookings
      .filter((b: any) => ['confirmed', 'active'].includes(b.status))
      .map((b: any) => b.property?.id ?? b.property)
  );
  const effectiveStatus = rentedPropertyIds.has(id) ? 'rented' : p.status;

  // Check if already has a pending booking for this property (survives page nav)
  const hasPendingBooking = allBookings.some(
    (b: any) => b.status === 'pending' && (b.property?.id ?? b.property) === id
  );
  const statusLabel = effectiveStatus === 'available' ? 'Còn trống' : effectiveStatus === 'rented' ? 'Đã thuê' : 'Bảo trì';
  const statusCls = effectiveStatus === 'available'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    : effectiveStatus === 'rented'
    ? 'bg-blue-50 text-blue-700 border border-blue-200'
    : 'bg-amber-50 text-amber-700 border border-amber-200';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNavbar activeLink="search" />

      <div className="max-w-[1280px] mx-auto px-6 w-full">
        {/* Back + Actions */}
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center gap-1.5 text-[#222222] text-sm hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 py-2 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              <Camera className="w-4 h-4 text-[#222222]" />
              <span className="text-[#222222] text-sm">Chia sẻ</span>
            </button>
            <button
              onClick={toggleSaved}
              className={cn("flex items-center gap-2 py-2 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors", heartAnim && "scale-105")}
            >
              <Heart className={cn("w-4 h-4", saved ? "fill-red-500 text-red-500" : "text-[#222222]")} />
              <span className="text-[#222222] text-sm">{saved ? 'Đã lưu' : 'Lưu'}</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-[28px] font-bold text-[#222222] mb-3 leading-tight">{p.title}</h1>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#6A6A6A]" />
            <span className="text-[#6A6A6A] text-sm">{address}</span>
          </div>
          <span className="text-gray-300">·</span>
          <span className="text-[#6A6A6A] text-sm">{TYPE_LABEL[p.type]}</span>
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
        </div>

        {/* Gallery */}
        <div className="mb-10">
          <ImageGallery images={p.images ?? []} title={p.title} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 w-full flex flex-col md:flex-row gap-8 md:gap-12 mt-8">
        {/* Left: main content */}
        <div className="flex-1 min-w-0">
          {/* Quick info strip */}
          <QuickInfo property={p} />

          {/* Description */}
          {p.description && (
            <div className="py-8 border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#222222] mb-3">Mô tả</h2>
              <p className="text-[#3F3F3F] text-[15px] leading-relaxed whitespace-pre-line">{p.description}</p>
            </div>
          )}

          {/* Amenities */}
          {(p.amenities ?? []).length > 0 && (
            <div className="py-8 border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#222222] mb-4">Tiện nghi</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                {(p.amenities ?? []).map((a) => {
                  const Icon = getAmenityIcon(a);
                  return (
                    <div key={a} className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-[#222222] shrink-0" />
                      <span className="text-[#222222] text-sm capitalize">{a}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Owner */}
          {ownerUser && (
            <div className="py-8 border-b border-gray-100">
              <h2 className="text-xl font-bold text-[#222222] mb-4">Chủ nhà</h2>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#222222] rounded-full flex items-center justify-center shrink-0 overflow-hidden relative">
                  {ownerUser.avatar ? (
                    <img
                      src={ownerUser.avatar}
                      alt={ownerUser.name ?? ''}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={`text-white text-xl font-bold ${ownerUser.avatar ? 'hidden' : ''}`}>
                    {ownerUser.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#222222] text-lg font-bold">{ownerUser.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#6A6A6A]" />
                    <span className="text-[#6A6A6A] text-sm">
                      {contactRevealed && ownerUser.phone ? ownerUser.phone : 'Thông tin sẽ hiển thị sau khi đặt phòng và thanh toán'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-[#C1C1C1] text-sm">Chủ nhà đã được xác minh</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mt-8">
            <PropertyReviewSection propertyId={p.id} />
          </div>

          {/* Things to know */}
          <div className="mt-16 mb-24">
            <h2 className="text-xl font-bold text-[#222222] mb-6">Những điều biết trước khi thuê</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Quy định */}
              <div>
                <h3 className="text-base font-semibold text-[#222222] mb-4">Quy định</h3>
                <ul className="space-y-2.5">
                  {['Không hút thuốc trong nhà', 'Không nuôi thú cưng (hỏi chủ nhà)', 'Giữ gìn vệ sinh chung', 'Không phá hoại tài sản'].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#222222] mt-0.5 shrink-0" />
                      <span className="text-[#6A6A6A] text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* An toàn */}
              <div>
                <h3 className="text-base font-semibold text-[#222222] mb-4">An toàn</h3>
                <ul className="space-y-2.5">
                  {['Có khóa cửa an toàn', 'Hệ thống camera an ninh', 'Phòng cháy chữa cháy', 'Khu vực yên tĩnh, an ninh'].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#222222] mt-0.5 shrink-0" />
                      <span className="text-[#6A6A6A] text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chính sách thanh toán */}
              <div>
                <h3 className="text-base font-semibold text-[#222222] mb-4">Chính sách thanh toán</h3>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#222222] mt-0.5 shrink-0" />
                    <span className="text-[#6A6A6A] text-sm leading-relaxed">Thanh toán tháng đầu qua nền tảng ({formatVnd(p.price)})</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#222222] mt-0.5 shrink-0" />
                    <span className="text-[#6A6A6A] text-sm leading-relaxed">Phí dịch vụ 10% ({formatVnd(Math.round(p.price * 0.1))})</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#222222] mt-0.5 shrink-0" />
                    <span className="text-[#6A6A6A] text-sm leading-relaxed">Các tháng tiếp theo thanh toán trực tiếp cho chủ nhà</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right: booking panel */}
        <div className="w-full md:w-[320px] md:shrink-0">
          <div className="sticky top-24">
            <BookingPanel property={p} effectiveStatus={effectiveStatus} contactRevealed={contactRevealed} hasPendingBooking={hasPendingBooking} />
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
