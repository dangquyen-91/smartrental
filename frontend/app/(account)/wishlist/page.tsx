'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import { getWishlistApi } from '@/lib/api/users.api';
import { PropertyCard } from '@/components/shared/property-card';

function WishlistSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-4/3 rounded-card bg-[#ebebeb]" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-3/4 bg-[#ebebeb] rounded" />
            <div className="h-3 w-1/2 bg-[#ebebeb] rounded" />
            <div className="h-3 w-1/3 bg-[#ebebeb] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ['wishlist-full'],
    queryFn: getWishlistApi,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">Yêu thích</h1>
        <p className="text-sm text-[#6a6a6a] mt-1">
          {isLoading
            ? 'Đang tải...'
            : properties && properties.length > 0
            ? `${properties.length} bất động sản đã lưu`
            : 'Chưa có bất động sản nào'}
        </p>
      </div>

      {isLoading ? (
        <WishlistSkeleton />
      ) : properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="size-16 bg-[#f7f7f7] rounded-full flex items-center justify-center mb-5">
            <Heart className="size-7 text-[#929292]" />
          </div>
          <h2 className="text-lg font-bold text-[#222222] mb-2">
            Chưa có bất động sản yêu thích
          </h2>
          <p className="text-sm text-[#6a6a6a] max-w-xs leading-relaxed mb-6">
            Nhấn vào biểu tượng trái tim trên bất kỳ tin đăng nào để lưu vào danh sách yêu thích.
          </p>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#222222] hover:bg-[#3a3a3a] rounded-lg transition-colors"
          >
            Khám phá bất động sản
            <ArrowRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
