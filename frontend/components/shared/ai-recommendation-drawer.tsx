'use client';

import { useState } from 'react';
import { X, Sparkles, Settings2, Trash2 } from 'lucide-react';
import { PropertyCard } from '@/components/shared/property-card';
import { PropertyCardSkeleton } from '@/components/ui/skeleton';
import { useRecommendations } from '@/hooks/use-properties';
import { useMyPreference, useUpsertPreference, useDeletePreference } from '@/hooks/use-preferences';
import { useAuth } from '@/hooks/use-auth';
import { type TenantPreference } from '@/lib/api/preferences.api';
import type { Property } from '@/types';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const AMENITY_OPTIONS = [
  'Wifi', 'Điều hòa', 'Bãi đỗ xe', 'Máy giặt', 'Bếp',
  'Phòng tắm riêng', 'Ban công', 'An ninh 24/7', 'Thang máy', 'Nội thất',
];

const TYPE_OPTIONS: { label: string; value: TenantPreference['preferredTypes'][number] }[] = [
  { label: 'Phòng trọ', value: 'room' },
  { label: 'Căn hộ', value: 'apartment' },
  { label: 'Nhà nguyên căn', value: 'house' },
  { label: 'Studio', value: 'studio' },
];

// ─── Preference form ──────────────────────────────────────────────────────────

function PreferenceForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: TenantPreference | null;
  onSave: (data: Omit<TenantPreference, 'id'>) => void;
  onCancel?: () => void;
  isSaving: boolean;
}) {
  const [budgetMax, setBudgetMax] = useState(String(initial?.budget?.max ?? ''));
  const [types, setTypes] = useState<TenantPreference['preferredTypes']>(initial?.preferredTypes ?? []);
  const [city, setCity] = useState(initial?.preferredCity ?? '');
  const [district, setDistrict] = useState(initial?.preferredDistrict ?? '');
  const [amenities, setAmenities] = useState<string[]>(initial?.requiredAmenities ?? []);

  const toggleType = (v: TenantPreference['preferredTypes'][number]) =>
    setTypes((t) => t.includes(v) ? t.filter((x) => x !== v) : [...t, v]);
  const toggleAmenity = (v: string) =>
    setAmenities((a) => a.includes(v) ? a.filter((x) => x !== v) : [...a, v]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetMax || Number(budgetMax) <= 0) return;
    onSave({
      budget: { min: 0, max: Number(budgetMax) },
      preferredTypes: types,
      preferredCity: city.trim(),
      preferredDistrict: district.trim(),
      requiredAmenities: amenities,
      minArea: null,
      maxArea: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-[#191c1d] mb-1.5 uppercase tracking-wide">
          Ngân sách tối đa (đ/tháng) *
        </label>
        <input
          type="number"
          required
          min={100000}
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
          placeholder="VD: 5000000"
          className="w-full h-11 px-4 rounded-xl border border-[#d0d0d0] text-sm focus:outline-none focus:border-[#676000] bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-[#191c1d] mb-1.5 uppercase tracking-wide">
          Loại phòng
        </label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleType(t.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                types.includes(t.value)
                  ? 'bg-[#676000] text-white border-[#676000]'
                  : 'bg-white text-[#4a4733] border-[#d0d0d0] hover:border-[#676000]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-bold text-[#191c1d] mb-1.5 uppercase tracking-wide">Thành phố</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="VD: TP. Hồ Chí Minh"
            className="w-full h-11 px-4 rounded-xl border border-[#d0d0d0] text-sm focus:outline-none focus:border-[#676000] bg-white"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-[#191c1d] mb-1.5 uppercase tracking-wide">Quận / Huyện</label>
          <input
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="VD: Bình Thạnh"
            className="w-full h-11 px-4 rounded-xl border border-[#d0d0d0] text-sm focus:outline-none focus:border-[#676000] bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#191c1d] mb-1.5 uppercase tracking-wide">Tiện nghi cần có</label>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                amenities.includes(a)
                  ? 'bg-[#191c1d] text-white border-[#191c1d]'
                  : 'bg-white text-[#4a4733] border-[#d0d0d0] hover:border-[#191c1d]',
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 h-11 bg-[#ffef3d] text-[#1f1c00] text-sm font-semibold rounded-full hover:shadow-md transition-all disabled:opacity-60"
        >
          {isSaving ? 'Đang lưu...' : 'Tìm phòng phù hợp'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 h-11 text-sm text-[#4a4733] border border-[#d0d0d0] rounded-full hover:border-[#676000] transition-colors"
          >
            Huỷ
          </button>
        )}
      </div>
    </form>
  );
}

// ─── Drawer content ───────────────────────────────────────────────────────────

function DrawerContent() {
  const { isAuthenticated, hasHydrated, user } = useAuth();
  const isTenant = user?.role === 'tenant';
  const enabled = hasHydrated && isAuthenticated && isTenant;

  const [editing, setEditing] = useState(false);

  const { data: prefData, isLoading: prefLoading } = useMyPreference(enabled);
  const preference = prefData?.data?.preference ?? null;

  const { data: recData, isLoading: recLoading } = useRecommendations(
    enabled && !prefLoading && !!preference && !editing,
  );
  const { mutate: upsert, isPending: isSaving } = useUpsertPreference();
  const { mutate: deletePreference, isPending: isDeleting } = useDeletePreference();

  const properties = (recData?.data?.properties ?? []) as (Property & { matchScore?: number })[];
  const explanation = recData?.data?.explanation ?? null;
  const isLoadingRec = prefLoading || (!!preference && !editing && recLoading);

  const handleSave = (data: Omit<TenantPreference, 'id'>) =>
    upsert(data, { onSuccess: () => setEditing(false) });

  if (!enabled) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6">
        <p className="text-sm text-[#4a4733]">Đăng nhập với tài khoản người thuê để xem gợi ý phòng.</p>
      </div>
    );
  }

  if (prefLoading) {
    return (
      <div className="flex-1 p-5 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
      </div>
    );
  }

  if (!preference || editing) {
    return (
      <div className="flex-1 overflow-y-auto p-5">
        <p className="text-xs text-[#4a4733] mb-5 leading-relaxed">
          {preference
            ? 'Cập nhật tiêu chí để AI tìm phòng phù hợp hơn.'
            : 'Nhập tiêu chí tìm phòng để AI gợi ý những lựa chọn tốt nhất cho bạn.'}
        </p>
        <PreferenceForm
          initial={preference}
          onSave={handleSave}
          onCancel={preference ? () => setEditing(false) : undefined}
          isSaving={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Profile summary bar */}
      <div className="px-5 py-3 bg-[#f3f4f5] border-b border-[#e0e0e0] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#191c1d] truncate">
            {preference.preferredCity || 'Tất cả khu vực'} · tối đa{' '}
            {preference.budget.max.toLocaleString('vi-VN')}đ
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#4a4733] border border-[#d0d0d0] rounded-full hover:border-[#676000] transition-colors"
          >
            <Settings2 className="size-3" />
            Sửa
          </button>
          <button
            onClick={() => deletePreference()}
            disabled={isDeleting}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="size-3" />
            Xoá
          </button>
        </div>
      </div>

      {/* AI explanation */}
      {explanation && !isLoadingRec && (
        <div className="mx-5 mt-4 p-4 bg-[#fffbea] border border-[#ffef3d] rounded-2xl">
          <p className="text-xs text-[#4a4733] leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Results */}
      <div className="p-5 space-y-4">
        {isLoadingRec ? (
          Array.from({ length: 3 }).map((_, i) => <PropertyCardSkeleton key={i} />)
        ) : properties.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#4a4733] mb-3">Chưa tìm thấy phòng phù hợp với hồ sơ.</p>
            <button onClick={() => setEditing(true)} className="text-sm font-semibold text-[#676000] underline">
              Điều chỉnh tiêu chí
            </button>
          </div>
        ) : (
          properties.map((p, i) => (
            <PropertyCard
              key={p.id ?? `rec-${i}`}
              property={p}
              matchScore={p.matchScore}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Exported drawer ──────────────────────────────────────────────────────────

export function AIRecommendationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-screen w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#e0e0e0] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#676000]" />
            <span className="text-sm font-bold text-[#191c1d]">AI Gợi ý phòng</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#f3f4f5] transition-colors"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        <DrawerContent />
      </div>
    </>
  );
}
