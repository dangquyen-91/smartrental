"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Property } from "@/types";
import { PriceDisplay } from "@/components/ui/price-display";
import { Badge } from "@/components/ui/badge";
import { useWishlist, useToggleWishlist } from "@/hooks/use-wishlist";
import { useAuth } from "@/hooks/use-auth";

const typeLabel: Record<Property["type"], string> = {
  room: "Phòng trọ",
  apartment: "Căn hộ",
  house: "Nhà nguyên căn",
  studio: "Studio",
};

interface PropertyCardProps {
  property: Property;
  className?: string;
  rentedPropertyIds?: Set<string>;
}

export function PropertyCard({ property, className, rentedPropertyIds }: PropertyCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: wishlistIds } = useWishlist();
  const { mutate: toggleWishlist, isPending } = useToggleWishlist(property.id);
  const wishlisted = wishlistIds?.includes(property.id) ?? false;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast('Đăng nhập để lưu tin đăng yêu thích', {
        action: { label: 'Đăng nhập', onClick: () => router.push('/login') },
      });
      return;
    }
    toggleWishlist();
  };

  const isRented = rentedPropertyIds?.has(property.id) ?? false;
  const effectiveStatus = isRented ? 'rented' : property.status;

  const images =
    property.images.length > 0
      ? property.images.map((img) => img.url)
      : ["/placeholder.jpg"];
  const address = `${property.address.district}, ${property.address.city}`;

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    setImgIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    setImgIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  return (
    <Link href={`/properties/${property.id}`} className={cn("group flex h-full flex-col rounded-2xl border border-[#e0e0e0] bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-[#c0c0c0] hover:-translate-y-1 transition-all duration-300", className)}>
      {/* Image container */}
      <div className="relative aspect-4/3 shrink-0 overflow-hidden bg-soft-cloud">
        <img
          src={images[imgIndex]}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />

        {/* Owner plan badge — top left */}
        {property.ownerBadge && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 bg-[#FFF546] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
              ★ {property.ownerBadge}
            </span>
          </div>
        )}

        {/* Featured badge — top left (khi không có owner badge) */}
        {property.isFeatured && !property.ownerBadge && (
          <div className="absolute top-3 left-3">
            <Badge variant="featured">Nổi bật</Badge>
          </div>
        )}

        {/* Status badge — top right, below wishlist button */}
        <div className="absolute bottom-3 right-3">
          <Badge variant={effectiveStatus === 'rented' ? 'rented' : effectiveStatus === 'available' ? 'available' : 'maintenance'}>
            {effectiveStatus === 'rented' ? 'Đã thuê' : effectiveStatus === 'available' ? 'Còn trống' : 'Bảo trì'}
          </Badge>
        </div>

        {/* Wishlist button — glassmorphism */}
        <button
          onClick={handleToggleWishlist}
          disabled={isPending}
          className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-black/20 backdrop-blur-md border border-white/20 transition-transform active:scale-95 hover:bg-black/30 disabled:opacity-70"
          aria-label="Thêm vào yêu thích"
        >
          <Heart
            className={cn(
              "size-4 transition-all",
              wishlisted ? "fill-red-500 stroke-red-500" : "fill-none stroke-white"
            )}
          />
        </button>

        {/* Carousel controls — visible on hover */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="size-4 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
              aria-label="Ảnh tiếp"
            >
              <ChevronRight className="size-4 text-white" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    i === imgIndex ? "w-3 bg-white" : "w-1.5 bg-white/60"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Body — breathing room + grouped info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title */}
        <p className="text-sm font-semibold text-ink-black line-clamp-2 leading-snug">
          {property.title}
        </p>

        {/* Location + specs — grouped together */}
        <div className="flex items-center gap-2">
          <MapPin className="size-3.5 shrink-0 text-ash-gray" />
          <span className="text-xs text-ash-gray line-clamp-1">{address}</span>
          <span className="text-xs text-stone-gray shrink-0">
            · {typeLabel[property.type]} · {property.area} m²
          </span>
        </div>

        {/* Price — prominent, navy accent, anchored to bottom */}
        <div className="mt-auto">
          <PriceDisplay amount={property.price} period="month" size="lg" highlight />
        </div>
      </div>
    </Link>
  );
}
