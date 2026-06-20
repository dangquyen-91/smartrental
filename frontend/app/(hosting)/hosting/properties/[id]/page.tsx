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
} from 'lucide-react';
import { toast } from 'sonner';
import { PriceDisplay } from '@/components/ui/price-display';
import { PropertyReviewSection } from '@/components/shared/review-list';
import { useProperty } from '@/hooks/use-properties';
import { useCreateBooking } from '@/hooks/use-bookings';
import { useAuth } from '@/hooks/use-auth';
import { useWishlist, useToggleWishlist } from '@/hooks/use-wishlist';
import { cn } from '@/lib/utils';
import type { Property } from '@/types';
import { PublicFooter } from '@/components/layout/public-navbar';

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

  return (
    <>
      <div className="flex gap-2 rounded-[20px] overflow-hidden">
        <div className="flex-1 relative aspect-[548/480] bg-[#f0f0f0]">
          {count > 0 ? (
            <img src={urls[0]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(0)} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#ccc]">No image</div>
          )}
        </div>
        <div className="hidden md:flex flex-col gap-2 w-[548px]">
          <div className="flex gap-2 flex-1">
            {count > 1 && <div className="flex-1 relative bg-[#f0f0f0]"><img src={urls[1]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(1)} /></div>}
            {count > 2 && <div className="flex-1 relative bg-[#f0f0f0]"><img src={urls[2]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(2)} /></div>}
          </div>
          <div className="relative bg-[#f0f0f0] h-[154px]">
            {count > 3 ? (
              <>
                <img src={urls[3]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(3)} />
                {count > 5 && <div className="absolute inset-0 bg-[#00000066] flex items-center justify-center cursor-pointer" onClick={() => open(4)}><span className="text-white text-[15px] font-bold">+{count - 4} ảnh</span></div>}
              </>
            ) : count > 3 ? (
              <img src={urls[3]} alt={title} className="w-full h-full object-cover cursor-pointer" onClick={() => open(3)} />
            ) : <div className="w-full h-full" />}
            <button onClick={() => open(0)} className="absolute bottom-3 right-3 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold text-[#222222] shadow-sm hover:bg-[#f7f7f7] transition-colors">Xem tất cả ảnh</button>
          </div>
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

function BookingPanel({ property, contactRevealed }: { property: Property; contactRevealed: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { mutate: createBooking, isPending, error } = useCreateBooking();

  const [startDate, setStartDate] = useState(todayStr());
  const [duration, setDuration] = useState(1);
  const [success, setSuccess] = useState(false);

  const isOwner = typeof property.owner === 'object' ? property.owner.id === user?.id : property.owner === user?.id;
  const unavailable = property.status !== 'available';
  const totalRent = duration * property.price;
  const platformFee = Math.round(property.price * 0.1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push('/login'); return; }
    createBooking({ property: property.id, startDate, duration }, { onSuccess: () => setSuccess(true) });
  };

  if (success) {
    return (
      <div className="flex flex-col shrink-0 items-start p-6 rounded-[20px] border border-solid border-[#DDDDDD]">
        <div className="flex items-center mb-4">
          <span className="text-[#222222] text-lg mr-0.5">{formatVnd(property.price)}</span>
          <span className="text-[#6A6A6A] text-sm mr-1">/tháng</span>
        </div>
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="w-6 h-6 text-emerald-600" /></div>
          <h3 className="text-base font-semibold text-[#222222] mb-1">Đã gửi yêu cầu đặt phòng!</h3>
          <p className="text-sm text-[#6A6A6A] mb-4">Chủ nhà sẽ xác nhận trong vòng 24h.</p>
          <Link href="/trips" className="inline-block w-full text-center py-3 bg-[#2683EB] hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">Xem đơn thuê của tôi</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col shrink-0 items-start p-6 rounded-[20px] border border-solid border-[#DDDDDD]">
      <div className="flex items-center mb-[15px]">
        <span className="text-[#222222] text-lg mr-0.5">{formatVnd(property.price)}</span>
        <span className="text-[#6A6A6A] text-sm mr-1">/tháng</span>
      </div>

      {isOwner ? (
        <div className="text-center py-4 text-sm text-[#6A6A6A] border border-[#DDDDDD] rounded-lg w-full">Đây là bất động sản của bạn</div>
      ) : unavailable ? (
        <div className="text-center py-4 text-sm text-[#6A6A6A] border border-[#DDDDDD] rounded-lg w-full">Phòng này hiện đang {property.status === 'rented' ? 'đã thuê' : 'bảo trì'}</div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col items-center pt-1 mb-[17px] gap-3">
            <div className="flex flex-col items-start p-[1px] gap-[1px] rounded-lg border border-solid border-[#DDDDDD] w-full">
              <div className="flex flex-col items-start py-3 px-4 gap-1.5 border-b border-solid border-b-[#DDDDDD]">
                <span className="text-[#222222] text-xs font-bold">NGÀY VÀO</span>
                <input type="date" value={startDate} min={todayStr()} onChange={(e) => setStartDate(e.target.value)} className="w-full text-sm text-[#222222] outline-none bg-transparent" required />
              </div>
              <div className="flex flex-col items-start py-[13px] px-4 gap-1.5">
                <span className="text-[#222222] text-xs font-bold">THỜI HẠN THUÊ</span>
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full text-sm text-[#222222] outline-none bg-transparent">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m} tháng</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col items-center pt-1 gap-[7px] w-full">
              <div className="flex items-center w-full">
                <span className="text-[#6A6A6A] text-[15px] flex-1">{formatVnd(property.price)} × {duration} tháng</span>
                <span className="text-[#222222] text-[15px]">{formatVnd(totalRent)}</span>
              </div>
              <div className="flex items-center w-full">
                <span className="text-[#6A6A6A] text-[15px] flex-1">Phí dịch vụ (10%)</span>
                <span className="text-[#6A6A6A] text-[15px]">{formatVnd(platformFee)}</span>
              </div>
              <div className="flex items-center py-[9px] border-t border-solid border-t-[#DDDDDD] w-full">
                <span className="text-[#222222] text-[15px] font-bold flex-1">Thanh toán tháng đầu</span>
                <span className="text-[#222222] text-[15px] font-bold">{formatVnd(property.price)}</span>
              </div>
            </div>
            {error && <p className="text-xs text-red-500 w-full">Không thể đặt phòng. Vui lòng thử lại.</p>}
            <button type="submit" disabled={isPending} className="flex flex-col items-start bg-[#2683EB] text-left py-[13px] px-[81px] rounded-lg border-0 w-full justify-center disabled:opacity-60">
              <span className="text-white text-[15px] font-bold w-full text-center">{isPending ? 'Đang gửi...' : isAuthenticated ? 'Đặt phòng' : 'Đăng nhập để đặt phòng'}</span>
            </button>
          </div>
          {isAuthenticated && <p className="text-center text-xs text-[#6A6A6A]">Bạn chưa bị tính phí vào lúc này</p>}
        </form>
      )}
      <div className="flex flex-col items-center pt-[17px] border-t border-solid border-t-[#DDDDDD] w-full mt-4">
        <div className="flex items-center"><LockKeyhole className="w-4 h-4 mr-[7px] text-[#6A6A6A]" /><span className="text-[#6A6A6A] text-[15px]">SĐT hiển thị sau khi đặt phòng và thanh toán</span></div>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useProperty(id);
  const { isAuthenticated, user } = useAuth();
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
        <Link href="/" className="px-5 py-2.5 bg-[#2683EB] text-white font-semibold rounded-lg text-sm hover:bg-blue-600 transition-colors">Về trang chủ</Link>
      </div>
    );
  }

  const p = data.data.property;
  const contactRevealed = data.data.contactRevealed ?? false;
  const ownerUser = typeof p.owner === 'object' ? p.owner : null;
  const address = [p.address?.street, p.address?.ward, p.address?.district, p.address?.city].filter(Boolean).join(', ');
  const statusLabel = p.status === 'available' ? 'Còn trống' : p.status === 'rented' ? 'Đã thuê' : 'Bảo trì';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="self-stretch bg-white pb-[1px]">
        {/* Header */}
        <div className="self-stretch bg-cover bg-center py-6 px-4 md:px-20" style={{ backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/30ac8eae-07ac-4021-b386-ee5d8a4d8a53)' }}>
          <div className="flex justify-between items-center self-stretch">
            <Link href="/"><img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/a949daa0-a417-4cbf-91d7-3ac6756bb215" className="w-[182px] h-[26px] object-fill cursor-pointer" /></Link>
            <div className="flex shrink-0 items-center px-2 gap-2">
              {isAuthenticated ? (
                <Link href="/profile" className="flex flex-col shrink-0 items-start bg-[#222222] text-left py-2 px-4 rounded-[20px] border-0"><span className="text-white text-sm font-bold">{user?.name?.charAt(0)?.toUpperCase() ?? 'N'}</span></Link>
              ) : (
                <><Link href="/login" className="flex flex-col shrink-0 items-start py-2 px-4 rounded-[20px]"><span className="text-[#222222] text-sm font-bold">Đăng nhập</span></Link><Link href="/register" className="flex flex-col shrink-0 items-start bg-[#222222] text-left py-2 px-4 rounded-[20px] border-0"><span className="text-white text-sm font-bold">Đăng ký</span></Link></>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="self-stretch max-w-[1104px] mb-8 mx-auto px-6">
          <div className="flex justify-between items-center self-stretch mb-2">
            <Link href="/" className="flex shrink-0 items-center gap-1.5 hover:opacity-80 transition-opacity"><img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/14b739cb-da37-494f-9d45-6266b1ef9ea6" className="w-4 h-4" /><span className="text-[#222222] text-[15px]">Quay lại</span></Link>
            <div className="flex shrink-0 items-center gap-[9px]">
              <button className="flex shrink-0 items-center bg-transparent text-left py-1.5 px-[13px] gap-[5px] rounded-lg border border-solid border-[#DDDDDD] hover:bg-[#f7f7f7] transition-colors"><img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5fce7812-788a-4412-b4ac-2a3641cc4662" className="w-4 h-4" /><span className="text-[#222222] text-sm">Chia sẻ</span></button>
              <button onClick={toggleSaved} className={cn("flex shrink-0 items-center bg-transparent text-left py-1.5 px-[13px] gap-[5px] rounded-lg border border-solid border-[#DDDDDD] hover:bg-[#f7f7f7] transition-colors", heartAnim && "scale-110")}><Heart className={cn("w-4 h-4", saved ? "fill-red-500 text-red-500" : "text-[#222222]")} /><span className="text-[#222222] text-sm">{saved ? 'Đã lưu' : 'Lưu'}</span></button>
            </div>
          </div>

          <div className="flex flex-col items-start self-stretch pt-3 mb-2"><span className="text-[#222222] text-[25px] font-bold">{p.title}</span></div>

          <div className="flex items-center self-stretch mb-[7px] gap-2 flex-wrap">
            <div className="flex shrink-0 items-center gap-1"><img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/09083633-fdc4-468d-8ea1-cbd03c1eec93" className="w-3.5 h-3.5" /><span className="text-[#6A6A6A] text-[15px]">{address}</span></div>
            <span className="text-[#DDDDDD] text-base">·</span>
            <span className="text-[#6A6A6A] text-[15px]">{TYPE_LABEL[p.type]}</span>
            <div className="flex flex-col shrink-0 items-start bg-[#FFF546] py-[1px] px-2 rounded-full"><span className="text-black text-[13px] font-bold">{statusLabel}</span></div>
          </div>

          <div className="flex items-center self-stretch pt-3 gap-2 rounded-[20px]"><ImageGallery images={p.images ?? []} title={p.title} /></div>
        </div>

        <div className="flex flex-col md:flex-row items-start self-stretch max-w-[1106px] mb-[1px] mx-auto gap-6 md:gap-12 px-4 md:px-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-start self-stretch border-b border-solid border-b-[#DDDDDD] pb-5 gap-y-3">
              <div className="flex shrink-0 items-center py-0.5 mb-7 mr-5 gap-2.5"><img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d027e3b0-765a-43c9-9150-83cd79b69cff" className="w-5 h-5" /><div className="flex flex-col shrink-0 items-center"><span className="text-black text-[15px]">Diện tích</span><span className="text-[#222222] text-[15px] font-bold">{p.area} m²</span></div></div>
              {p.bedrooms !== undefined && <div className="flex shrink-0 items-center py-0.5 mr-5 gap-2.5"><img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/0f0db104-5c14-4ced-a8a4-e81d72ca3610" className="w-5 h-5" /><div className="flex flex-col shrink-0 items-center"><span className="text-black text-[15px]">Phòng ngủ</span><span className="text-[#222222] text-[15px] font-bold">{p.bedrooms}</span></div></div>}
              <img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/8cc350da-f861-4d41-8357-4c73e2dd418e" className="w-5 h-5 mt-2.5 mr-2.5" />
              {p.bathrooms !== undefined && <div className="flex flex-col shrink-0 items-center mt-0.5 mr-4"><span className="text-black text-[15px]">Phòng tắm</span><span className="text-[#222222] text-[15px] font-bold">{p.bathrooms}</span></div>}
              {p.pricePerM2 && <><img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/8390c653-26b3-43a3-b252-f227e3175e53" className="w-4 h-[11px] mt-4 mr-2" /><div className="flex flex-col shrink-0 items-center mt-0.5"><span className="text-black text-[15px]">Giá/m²</span><span className="text-[#222222] text-[15px] font-bold">{formatVnd(p.pricePerM2)}</span></div></>}
            </div>

            {p.description && <div className="flex flex-col self-stretch py-[27px] gap-[11px] border-b border-solid border-b-[#DDDDDD]"><span className="text-[#222222] text-xl font-bold">Mô tả</span><span className="text-[#3F3F3F] text-[15px] whitespace-pre-line">{p.description}</span></div>}

            {(p.amenities ?? []).length > 0 && (
              <div className="flex flex-col self-stretch py-[27px] mb-[1px] gap-[19px] border-b border-solid border-b-[#DDDDDD]">
                <span className="text-[#222222] text-xl font-bold">Tiện nghi</span>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  {(p.amenities ?? []).map((a) => { const Icon = getAmenityIcon(a); return <div key={a} className="flex items-center gap-3"><Icon className="w-5 h-5 text-[#222222] shrink-0" /><span className="text-[#222222] text-[15px] capitalize">{a}</span></div>; })}
                </div>
              </div>
            )}

            {ownerUser && (
              <div className="flex flex-col self-stretch py-7 gap-[15px] border-b border-solid border-b-[#DDDDDD]">
                <span className="text-[#222222] text-xl font-bold">Chủ nhà</span>
                <div className="flex items-center self-stretch gap-4">
                  <div className="flex flex-col shrink-0 items-center bg-[#222222] rounded-full">{ownerUser.avatar ? <img src={ownerUser.avatar} alt={ownerUser.name ?? ''} className="w-14 h-14 rounded-full object-cover" /> : <span className="w-14 h-14 flex items-center justify-center text-white text-xl font-bold">{ownerUser.name?.charAt(0)?.toUpperCase() ?? '?'}</span>}</div>
                  <div className="flex flex-col shrink-0 items-center gap-[1px]">
                    <span className="text-[#222222] text-lg font-bold">{ownerUser.name}</span>
                    <div className="flex items-center gap-1.5"><img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/1dbfcd7e-40d1-467d-a9ea-f59ac7751e4f" className="w-3.5 h-3.5" /><span className="text-[#6A6A6A] text-[15px]">{contactRevealed && ownerUser.phone ? ownerUser.phone : 'Thông tin sẽ hiển thị sau khi đặt phòng và thanh toán'}</span></div>
                    <div className="flex items-center py-0.5"><img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9da1cc90-056b-457b-957b-bf4adfa8e51f" className="w-3 h-3 mr-1.5" /><span className="text-[#C1C1C1] text-[15px]">Chủ nhà này đã được xác minh</span></div>
                  </div>
                </div>
              </div>
            )}

            <PropertyReviewSection propertyId={p.id} />

            <span className="text-[#222222] text-xl font-bold mb-[19px] block">Những điều biết trước khi thuê</span>
            <div className="flex flex-wrap items-start mb-[94px] gap-6">
              <div className="flex flex-col shrink-0 items-center pb-[19px] gap-[7px]"><span className="text-[#222222] text-base font-bold">Quy định</span><div className="flex flex-col items-center gap-[5px]"><div className="flex items-center"><div className="bg-[#DDDDDD] w-1 h-1 mr-1.5 rounded-full" /><span className="text-[#6A6A6A] text-[15px]">Không hút thuốc trong nhà</span></div><div className="flex items-center"><div className="bg-[#DDDDDD] w-1 h-1 mr-1.5 rounded-full" /><span className="text-[#6A6A6A] text-[15px]">Không nuôi thú cưng (hỏi chủ nhà)</span></div><div className="flex items-center"><div className="bg-[#DDDDDD] w-1 h-1 mr-1.5 rounded-full" /><span className="text-[#6A6A6A] text-[15px]">Giữ gìn vệ sinh chung</span></div></div></div>
              <div className="flex flex-col shrink-0 items-center pb-[39px] gap-[7px]"><span className="text-[#222222] text-base font-bold">An toàn</span><div className="flex flex-col items-center gap-[5px]"><div className="flex items-center"><div className="bg-[#DDDDDD] w-1 h-1 mr-1.5 rounded-full" /><span className="text-[#6A6A6A] text-[15px]">Có khóa cửa an toàn</span></div><div className="flex items-center"><div className="bg-[#DDDDDD] w-1 h-1 mr-1.5 rounded-full" /><span className="text-[#6A6A6A] text-[15px]">Hệ thống camera an ninh</span></div><div className="flex items-center"><div className="bg-[#DDDDDD] w-1 h-1 mr-1.5 rounded-full" /><span className="text-[#6A6A6A] text-[15px]">Phòng cháy chữa cháy</span></div></div></div>
              <div className="flex flex-col shrink-0 items-start"><span className="text-[#222222] text-base font-bold mb-2">Chính sách thanh toán</span><div className="flex items-start mb-1.5 gap-1.5"><div className="bg-[#DDDDDD] w-1 h-1 rounded-full mt-1.5 shrink-0" /><span className="text-[#6A6A6A] text-[15px]">Thanh toán tháng đầu qua nền tảng ({formatVnd(p.price)})</span></div><div className="flex items-center mb-1.5 gap-1.5"><div className="bg-[#DDDDDD] w-1 h-1 rounded-full shrink-0" /><span className="text-[#6A6A6A] text-[15px]">Phí dịch vụ 10% ({formatVnd(Math.round(p.price * 0.1))})</span></div><div className="flex items-start gap-1.5"><div className="bg-[#DDDDDD] w-1 h-1 rounded-full mt-1.5 shrink-0" /><span className="text-[#6A6A6A] text-[15px]">Các tháng tiếp theo thanh toán trực tiếp cho chủ nhà</span></div></div>
            </div>
          </div>

          <div className="w-full md:w-[320px] md:shrink-0">
            <BookingPanel property={p} contactRevealed={contactRevealed} />
          </div>
        </div>

        <PublicFooter />
      </div>
    </div>
  );
}
