'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Maximize2,
  BedDouble,
  Bath,
  Wifi,
  Car,
  Shield,
  Wind,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
  Phone,
  User,
  Sofa,
  Camera,
  ShoppingCart,
  Flame,
  Droplets,
  Zap,
  Dog,
  Dumbbell,
  Tv,
  UtensilsCrossed,
  Sun,
  Package,
  Lock,
  AirVent,
  WashingMachine,
  ParkingCircle,
  ArrowUpDown,
} from 'lucide-react';
import AppNavbar from '@/components/layout/app-navbar';
import { PriceDisplay } from '@/components/ui/price-display';
import { useProperty } from '@/hooks/use-properties';
import { useCreateBooking } from '@/hooks/use-bookings';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import type { Property } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<Property['type'], string> = {
  room: 'Phòng trọ',
  apartment: 'Căn hộ',
  house: 'Nhà nguyên căn',
  studio: 'Studio',
};

const STATUS_CONFIG: Record<
  Property['status'],
  { label: string; color: string }
> = {
  available: { label: 'Còn trống', color: 'bg-emerald-50 text-emerald-700' },
  rented: { label: 'Đã thuê', color: 'bg-stone-100 text-stone-500' },
  maintenance: { label: 'Đang bảo trì', color: 'bg-amber-50 text-amber-700' },
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  // wifi
  wifi: Wifi,
  'wi-fi': Wifi,
  'wi fi': Wifi,
  // air con
  ac: AirVent,
  'air conditioning': AirVent,
  'điều hòa': AirVent,
  'máy lạnh': AirVent,
  'may lanh': AirVent,
  // parking
  parking: ParkingCircle,
  'bãi đỗ xe': ParkingCircle,
  'đỗ xe': ParkingCircle,
  'chỗ để xe': ParkingCircle,
  // security / camera
  security: Shield,
  'bảo vệ': Shield,
  'an ninh': Shield,
  'camera an ninh': Camera,
  camera: Camera,
  // furniture
  'nội thất': Sofa,
  'nội thất đầy đủ': Sofa,
  'fully furnished': Sofa,
  furnished: Sofa,
  // laundry
  'máy giặt': WashingMachine,
  'giặt sấy': WashingMachine,
  laundry: WashingMachine,
  // drying yard
  'sân phơi': Sun,
  'phơi đồ': Sun,
  // kitchen
  bếp: UtensilsCrossed,
  'nhà bếp': UtensilsCrossed,
  kitchen: UtensilsCrossed,
  // tv
  tv: Tv,
  tivi: Tv,
  'truyền hình': Tv,
  // hot water
  'nước nóng': Droplets,
  'water heater': Droplets,
  // electricity
  điện: Zap,
  electricity: Zap,
  // gas
  gas: Flame,
  'bình gas': Flame,
  // elevator
  'thang máy': ArrowUpDown,
  elevator: ArrowUpDown,
  lift: ArrowUpDown,
  // gym
  gym: Dumbbell,
  'phòng gym': Dumbbell,
  fitness: Dumbbell,
  // pet
  'thú cưng': Dog,
  pet: Dog,
  'chó mèo': Dog,
  // market / supermarket
  'gần chợ': ShoppingCart,
  'siêu thị': ShoppingCart,
  'gần chợ/siêu thị': ShoppingCart,
  chợ: ShoppingCart,
  supermarket: ShoppingCart,
  // storage
  kho: Package,
  'kho chứa': Package,
  storage: Package,
  // lock / private
  'khóa cửa': Lock,
  private: Lock,
  'riêng tư': Lock,
  // balcony / outdoor
  'ban công': Wind,
  balcony: Wind,
  default: Maximize2,
};

function getAmenityIcon(name: string): React.ElementType {
  const key = name.toLowerCase().trim();
  if (AMENITY_ICONS[key]) return AMENITY_ICONS[key];
  // partial match fallback
  for (const [pattern, Icon] of Object.entries(AMENITY_ICONS)) {
    if (pattern !== 'default' && key.includes(pattern)) return Icon;
  }
  return AMENITY_ICONS.default;
}

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + '₫';
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function PropertyDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <AppNavbar />
      <div className="max-w-6xl mx-auto px-6 pt-6 pb-12">
        <div className="h-5 w-48 bg-hairline-gray rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.45fr] gap-2 h-[420px]">
          <div className="bg-hairline-gray rounded-panel h-full" />
          <div className="hidden lg:grid grid-rows-2 gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-hairline-gray rounded-panel" />
              <div className="bg-hairline-gray rounded-panel" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-hairline-gray rounded-panel" />
              <div className="bg-hairline-gray rounded-panel" />
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-12">
          <div className="space-y-4">
            <div className="h-7 w-3/4 bg-hairline-gray rounded" />
            <div className="h-4 w-1/2 bg-hairline-gray rounded" />
            <div className="h-4 w-full bg-hairline-gray rounded" />
            <div className="h-4 w-5/6 bg-hairline-gray rounded" />
          </div>
          <div className="h-64 bg-hairline-gray rounded-panel" />
        </div>
      </div>
    </div>
  );
}

// ─── image grid ──────────────────────────────────────────────────────────────

function ImageGrid({
  images,
  title,
}: {
  images: { url: string }[];
  title: string;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const urls = images.length > 0 ? images.map((i) => i.url) : ['/placeholder.jpg'];
  const count = urls.length;

  const open = (i: number) => setLightbox(i);
  const close = () => setLightbox(null);
  const prev = () => setLightbox((n) => (n! === 0 ? urls.length - 1 : n! - 1));
  const next = () => setLightbox((n) => (n! === urls.length - 1 ? 0 : n! + 1));

  const Img = ({ idx, className }: { idx: number; className?: string }) => (
    <button
      onClick={() => open(idx)}
      className={cn('relative overflow-hidden group/img', className)}
    >
      <img
        src={urls[idx]}
        alt={idx === 0 ? title : ''}
        className="w-full h-full object-cover group-hover/img:brightness-90 transition-[filter] duration-200"
        loading={idx === 0 ? 'eager' : 'lazy'}
      />
      {/* overlay for extra images */}
      {idx === 4 && count > 5 && (
        <div className="absolute inset-0 bg-ink-black/50 flex items-center justify-center pointer-events-none">
          <span className="text-white font-semibold text-lg">+{count - 5}</span>
        </div>
      )}
    </button>
  );

  return (
    <>
      {/* outer wrapper: clips rounded corners for the whole grid */}
      <div className="relative h-[400px] lg:h-[480px] rounded-panel overflow-hidden">
        {count === 1 ? (
          /* ── 1 image: full width ── */
          <Img idx={0} className="w-full h-full" />
        ) : count === 2 ? (
          /* ── 2 images: 60/40 split ── */
          <div className="grid grid-cols-[1.5fr_1fr] gap-2 h-full">
            <Img idx={0} className="h-full" />
            <Img idx={1} className="h-full" />
          </div>
        ) : count === 3 ? (
          /* ── 3 images: large left + 2 stacked right ── */
          <div className="grid grid-cols-2 gap-2 h-full">
            <Img idx={0} className="h-full" />
            <div className="grid grid-rows-2 gap-2 h-full">
              <Img idx={1} className="h-full" />
              <Img idx={2} className="h-full" />
            </div>
          </div>
        ) : count === 4 ? (
          /* ── 4 images: large left + 3 stacked right ── */
          <div className="grid grid-cols-2 gap-2 h-full">
            <Img idx={0} className="h-full" />
            <div className="grid grid-rows-3 gap-2 h-full">
              <Img idx={1} className="h-full" />
              <Img idx={2} className="h-full" />
              <Img idx={3} className="h-full" />
            </div>
          </div>
        ) : (
          /* ── 5+ images: Airbnb-style large left + 2×2 right ── */
          <div className="grid grid-cols-2 gap-2 h-full">
            <Img idx={0} className="h-full" />
            <div className="grid grid-rows-2 gap-2 h-full">
              <div className="grid grid-cols-2 gap-2">
                <Img idx={1} className="h-full" />
                <Img idx={2} className="h-full" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Img idx={3} className="h-full" />
                <Img idx={4} className="h-full" />
              </div>
            </div>
          </div>
        )}

        {/* Show all button */}
        <button
          onClick={() => open(0)}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white border border-hairline-gray rounded-lg px-3 py-1.5 text-sm font-semibold text-ink-black hover:bg-soft-cloud transition-colors shadow-sm"
        >
          <Maximize2 className="size-3.5" />
          Xem tất cả ảnh
        </button>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={close}
        >
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="size-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 size-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="size-6" />
          </button>
          <img
            src={urls[lightbox]}
            alt={title}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 size-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="size-6" />
          </button>
          <span className="absolute bottom-4 text-white/70 text-sm">
            {lightbox + 1} / {urls.length}
          </span>
        </div>
      )}
    </>
  );
}

// ─── booking panel ────────────────────────────────────────────────────────────

function BookingPanel({ property }: { property: Property }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { mutate: createBooking, isPending, error } = useCreateBooking();

  const [startDate, setStartDate] = useState(todayStr());
  const [duration, setDuration] = useState(1);
  const [success, setSuccess] = useState(false);

  const isOwner =
    typeof property.owner === 'object'
      ? property.owner.id === user?.id
      : property.owner === user?.id;

  const unavailable = property.status !== 'available';

  const totalRent = duration * property.price;
  const platformFee = Math.round(property.price * 0.1);
  const initialPayment = property.price; // tháng đầu tiên (platform giữ 10%, chuyển 90% cho chủ)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    createBooking(
      { property: property.id, startDate, duration },
      {
        onSuccess: () => setSuccess(true),
      }
    );
  };

  if (success) {
    return (
      <div className="border border-hairline-gray rounded-panel p-6 shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_4px_8px_0]">
        <div className="text-center py-4">
          <div className="size-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <CalendarDays className="size-6 text-emerald-600" />
          </div>
          <h3 className="text-base font-semibold text-ink-black mb-1">Đã gửi yêu cầu đặt phòng!</h3>
          <p className="text-sm text-ash-gray mb-4">Chủ nhà sẽ xác nhận trong vòng 24h.</p>
          <Link
            href="/trips"
            className="inline-block w-full text-center py-3 bg-rausch hover:bg-deep-rausch text-white font-semibold rounded-lg transition-colors"
          >
            Xem chuyến đi của tôi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-hairline-gray rounded-panel p-6 shadow-[rgba(0,0,0,0.02)_0_0_0_1px,rgba(0,0,0,0.04)_0_2px_6px_0,rgba(0,0,0,0.1)_0_4px_8px_0]">
      {/* Price */}
      <div className="mb-5">
        <PriceDisplay amount={property.price} period="month" size="lg" />
      </div>

      {isOwner ? (
        <div className="text-center py-4 text-sm text-ash-gray border border-hairline-gray rounded-lg">
          Đây là bất động sản của bạn
        </div>
      ) : unavailable ? (
        <div className="text-center py-4 text-sm text-ash-gray border border-hairline-gray rounded-lg">
          Phòng này hiện {(STATUS_CONFIG[property.status]?.label ?? property.status).toLowerCase()}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Date + duration row */}
          <div className="border border-hairline-gray rounded-lg overflow-hidden divide-y divide-hairline-gray">
            <div className="px-4 py-3">
              <label className="block text-[11px] font-semibold text-ink-black uppercase tracking-wide mb-1">
                Ngày vào
              </label>
              <input
                type="date"
                value={startDate}
                min={todayStr()}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm font-medium text-ink-black outline-none bg-transparent"
                required
              />
            </div>
            <div className="px-4 py-3">
              <label className="block text-[11px] font-semibold text-ink-black uppercase tracking-wide mb-1">
                Thời hạn thuê
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full text-sm font-medium text-ink-black outline-none bg-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m} tháng
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-sm">
              <span className="text-ash-gray underline decoration-dotted">
                {formatVnd(property.price)} × {duration} tháng
              </span>
              <span className="text-ink-black font-medium">{formatVnd(totalRent)}</span>
            </div>
            <div className="flex justify-between text-sm text-ash-gray">
              <span className="underline decoration-dotted">Phí dịch vụ (10%)</span>
              <span>{formatVnd(platformFee)}</span>
            </div>
            <div className="border-t border-hairline-gray pt-2 flex justify-between text-sm font-semibold text-ink-black">
              <span>Thanh toán tháng đầu</span>
              <span>{formatVnd(initialPayment)}</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-error-red">
              Không thể đặt phòng. Vui lòng thử lại.
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 bg-rausch hover:bg-deep-rausch disabled:opacity-60 text-white font-semibold rounded-lg transition-all active:scale-[0.98]"
          >
            {isPending ? 'Đang gửi...' : isAuthenticated ? 'Đặt phòng' : 'Đăng nhập để đặt phòng'}
          </button>

          {isAuthenticated && (
            <p className="text-center text-xs text-ash-gray">
              Bạn chưa bị tính phí vào lúc này
            </p>
          )}
        </form>
      )}

      {/* Contact */}
      {property.contact?.phone && (
        <div className="mt-4 pt-4 border-t border-hairline-gray flex items-center gap-2 text-sm text-ash-gray">
          <Phone className="size-4 shrink-0" />
          <span>{property.contact.name ?? 'Liên hệ'}: </span>
          <a href={`tel:${property.contact.phone}`} className="font-medium text-ink-black hover:text-rausch transition-colors">
            {property.contact.phone}
          </a>
        </div>
      )}
    </div>
  );
}

// ─── mobile sticky bottom bar ─────────────────────────────────────────────────

function MobileReserveBar({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  if (property.status !== 'available') return null;
  return (
    <>
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-hairline-gray px-6 py-4 flex items-center justify-between">
        <div>
          <PriceDisplay amount={property.price} period="month" size="md" />
        </div>
        <button
          onClick={() => setOpen(true)}
          className="px-6 py-3 bg-rausch hover:bg-deep-rausch text-white font-semibold rounded-lg transition-all active:scale-95 text-sm"
        >
          Đặt phòng
        </button>
      </div>
      {/* bottom sheet */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full bg-white rounded-t-2xl p-6 shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-soft-cloud"
            >
              <X className="size-4 text-ink-black" />
            </button>
            <h3 className="text-base font-semibold text-ink-black mb-4">{property.title}</h3>
            <BookingPanel property={property} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError } = useProperty(id);
  const [wishlist, setWishlist] = useState(false);

  if (isLoading) return <PropertyDetailSkeleton />;

  if (isError || !data?.data?.property) {
    return (
      <>
        <AppNavbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <h2 className="text-xl font-semibold text-ink-black mb-2">Không tìm thấy bất động sản</h2>
          <p className="text-ash-gray text-sm mb-6">Tin đăng này có thể đã bị xoá hoặc không tồn tại.</p>
          <Link href="/" className="px-5 py-2.5 bg-rausch text-white font-semibold rounded-lg text-sm hover:bg-deep-rausch transition-colors">
            Về trang chủ
          </Link>
        </div>
      </>
    );
  }

  const p = data.data.property;
  const statusCfg = STATUS_CONFIG[p.status] ?? { label: p.status, color: 'bg-stone-100 text-stone-500' };
  const ownerUser = typeof p.owner === 'object' ? p.owner : null;
  const address = [p.address?.street, p.address?.ward, p.address?.district, p.address?.city]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <AppNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-ink-black hover:text-rausch transition-colors"
          >
            <ArrowLeft className="size-4" />
            Quay lại
          </Link>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-ink-black border border-hairline-gray rounded-lg hover:bg-soft-cloud transition-colors">
              <Share2 className="size-4" />
              <span className="hidden sm:inline">Chia sẻ</span>
            </button>
            <button
              onClick={() => setWishlist((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-ink-black border border-hairline-gray rounded-lg hover:bg-soft-cloud transition-colors"
            >
              <Heart className={cn('size-4', wishlist && 'fill-rausch stroke-rausch')} />
              <span className="hidden sm:inline">Lưu</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-[1.5rem] font-bold text-ink-black leading-tight mb-2">{p.title}</h1>
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="flex items-center gap-1 text-sm text-ash-gray">
            <MapPin className="size-3.5 shrink-0" />
            {address}
          </span>
          <span className="text-hairline-gray">·</span>
          <span className="text-sm text-ash-gray">{TYPE_LABEL[p.type]}</span>
          <span
            className={cn(
              'text-xs font-semibold px-2 py-0.5 rounded-full',
              statusCfg.color
            )}
          >
            {statusCfg.label}
          </span>
          {p.isFeatured && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              Nổi bật
            </span>
          )}
        </div>

        {/* Image grid */}
        <ImageGrid images={p.images ?? []} title={p.title} />

        {/* Two-column layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-12">
          {/* ── Left: property info ── */}
          <div>
            {/* Key stats */}
            <div className="flex flex-wrap gap-5 pb-7 border-b border-hairline-gray">
              <Stat icon={Maximize2} label="Diện tích" value={`${p.area} m²`} />
              {p.bedrooms !== undefined && (
                <Stat icon={BedDouble} label="Phòng ngủ" value={String(p.bedrooms)} />
              )}
              {p.bathrooms !== undefined && (
                <Stat icon={Bath} label="Phòng tắm" value={String(p.bathrooms)} />
              )}
              {p.pricePerM2 !== undefined && (
                <Stat icon={null} label="Giá / m²" value={formatVnd(p.pricePerM2)} />
              )}
            </div>

            {/* Description */}
            {p.description && (
              <section className="py-7 border-b border-hairline-gray">
                <h2 className="text-lg font-semibold text-ink-black mb-3">Mô tả</h2>
                <p className="text-sm font-medium text-charcoal leading-relaxed whitespace-pre-line">
                  {p.description}
                </p>
              </section>
            )}

            {/* Amenities */}
            {(p.amenities ?? []).length > 0 && (
              <section id="amenities" className="py-7 border-b border-hairline-gray">
                <h2 className="text-lg font-semibold text-ink-black mb-5">Tiện nghi</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                  {(p.amenities ?? []).map((a) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <div key={a} className="flex items-center gap-3">
                        <Icon className="size-5 text-ink-black shrink-0" />
                        <span className="text-sm font-medium text-ink-black capitalize">{a}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Host info */}
            {ownerUser && (
              <section id="host" className="py-7 border-b border-hairline-gray">
                <h2 className="text-lg font-semibold text-ink-black mb-4">Chủ nhà</h2>
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-full bg-ink-black flex items-center justify-center text-white text-xl font-semibold shrink-0 overflow-hidden">
                    {ownerUser.avatar ? (
                      <img src={ownerUser.avatar} alt={ownerUser.name} className="size-full object-cover" />
                    ) : (
                      ownerUser.name?.charAt(0).toUpperCase() ?? '?'
                    )}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-ink-black">{ownerUser.name}</p>
                    {ownerUser.phone && (
                      <p className="text-sm text-ash-gray flex items-center gap-1 mt-0.5">
                        <Phone className="size-3.5" />
                        {ownerUser.phone}
                      </p>
                    )}
                    <p className="text-xs text-stone-gray mt-1 flex items-center gap-1">
                      <User className="size-3" />
                      Chủ nhà đã xác minh
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Things to know */}
            <section className="py-7">
              <h2 className="text-lg font-semibold text-ink-black mb-5">Cần biết trước khi thuê</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <ThingsToKnow
                  title="Quy định"
                  items={['Không hút thuốc trong nhà', 'Không nuôi thú cưng (hỏi chủ nhà)', 'Giữ gìn vệ sinh chung']}
                />
                <ThingsToKnow
                  title="An toàn"
                  items={['Có khóa cửa an toàn', 'Hệ thống camera an ninh', 'Phòng cháy chữa cháy']}
                />
                <ThingsToKnow
                  title="Chính sách thanh toán"
                  items={[`Thanh toán tháng đầu qua nền tảng (${formatVnd(p.price)})`, `Phí dịch vụ 10% (${formatVnd(Math.round(p.price * 0.1))})`, 'Các tháng tiếp theo thanh toán trực tiếp cho chủ nhà']}
                />
              </div>
            </section>
          </div>

          {/* ── Right: booking panel (desktop sticky) ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <BookingPanel property={p} />
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <MobileReserveBar property={p} />
    </div>
  );
}

// ─── small sub-components ─────────────────────────────────────────────────────

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType | null;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {Icon && <Icon className="size-5 text-ash-gray shrink-0" />}
      <div>
        <p className="text-xs text-ash-gray">{label}</p>
        <p className="text-sm font-semibold text-ink-black">{value}</p>
      </div>
    </div>
  );
}

function ThingsToKnow({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink-black mb-2">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="text-sm text-ash-gray flex items-start gap-1.5">
            <span className="mt-1.5 size-1 rounded-full bg-hairline-gray shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
