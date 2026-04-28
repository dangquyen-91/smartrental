"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Property } from "@/types";
import { PriceDisplay } from "@/components/ui/price-display";
import { Badge } from "@/components/ui/badge";

const typeLabel: Record<Property["type"], string> = {
  room: "Phòng trọ",
  apartment: "Căn hộ",
  house: "Nhà nguyên căn",
  studio: "Studio",
};

interface PropertyCardProps {
  property: Property;
  className?: string;
}

export function PropertyCard({ property, className }: PropertyCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  const images = property.images.length > 0 ? property.images : ["/placeholder.jpg"];
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
    <Link href={`/properties/${property._id}`} className={cn("group block", className)}>
      {/* Image container — 4:3 ratio, 14px radius, no shadow */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-soft-cloud">
        <img
          src={images[imgIndex]}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />

        {/* Wishlist button — circular 50% per DESIGN.md */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setWishlisted((v) => !v);
          }}
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-transform active:scale-95 hover:bg-white"
          aria-label="Thêm vào yêu thích"
        >
          <Heart
            className={cn(
              "size-4",
              wishlisted ? "fill-rausch stroke-rausch" : "stroke-ink-black"
            )}
          />
        </button>

        {/* Featured badge */}
        {property.isFeatured && (
          <div className="absolute top-3 left-3">
            <Badge variant="featured">Nổi bật</Badge>
          </div>
        )}

        {/* Carousel controls — visible on hover */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="size-4 text-ink-black" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
              aria-label="Ảnh tiếp"
            >
              <ChevronRight className="size-4 text-ink-black" />
            </button>
            {/* Dot indicators */}
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

      {/* Metadata rows — 4-8px gap per DESIGN.md */}
      <div className="mt-3 flex flex-col gap-1">
        <p className="text-sm font-semibold text-ink-black line-clamp-1 leading-snug">
          {property.title}
        </p>
        <p className="flex items-center gap-1 text-sm text-ash-gray">
          <MapPin className="size-3.5 shrink-0" />
          <span className="line-clamp-1">{address}</span>
        </p>
        <p className="text-xs text-stone-gray">
          {typeLabel[property.type]} · {property.area} m²
        </p>
        <div className="mt-1">
          <PriceDisplay amount={property.price} period="month" />
        </div>
      </div>
    </Link>
  );
}
