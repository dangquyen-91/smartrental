'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useForm, type UseFormRegister, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users, UserCheck, Mail, Sparkles, Send, Check, X,
  ChevronLeft, ChevronRight, Loader2, Trash2, Star,
  Phone, AtSign, Eye, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMyRoommateProfile,
  useUpsertRoommateProfile,
  useDeleteRoommateProfile,
  useRoommateMatches,
  useExplainRoommateMatch,
  useSendRoommateRequest,
  useRespondRoommateRequest,
  useCancelRoommateRequest,
  useMyRoommateRequests,
  useRoommateUserProfile,
} from '@/hooks/use-roommate';
import type { RoommateProfile, RoommateRequest, Property } from '@/types';

// ─── constants ────────────────────────────────────────────────────────────────

const GENDER_LABELS: Record<RoommateProfile['gender'], string> = {
  male: 'Nam', female: 'Nữ', any: 'Không quan trọng',
};
const SCHEDULE_LABELS: Record<RoommateProfile['schedule'], string> = {
  early_bird: 'Dậy sớm', night_owl: 'Cú đêm', flexible: 'Linh hoạt',
};
const LIFESTYLE_LABELS: Record<RoommateProfile['lifestyle'], string> = {
  quiet: 'Yên tĩnh', active: 'Năng động', mixed: 'Cả hai',
};
const CLEANLINESS_LABELS: Record<RoommateProfile['cleanliness'], string> = {
  neat: 'Rất ngăn nắp', average: 'Bình thường', relaxed: 'Thoải mái',
};
const DURATION_LABELS: Record<RoommateProfile['duration'], string> = {
  short: 'Ngắn hạn (<6 tháng)', long: 'Dài hạn (>6 tháng)', flexible: 'Linh hoạt',
};
const PETS_LABELS: Record<RoommateProfile['pets'], string> = { ok: 'Được', no: 'Không' };
const SMOKING_LABELS: Record<RoommateProfile['smoking'], string> = { ok: 'Được', no: 'Không' };

const REQUEST_STATUS_CONFIG: Record<RoommateRequest['status'], { label: string; className: string }> = {
  pending:   { label: 'Chờ phản hồi',  className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  accepted:  { label: 'Đã chấp nhận', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  rejected:  { label: 'Đã từ chối',   className: 'bg-red-50 text-[#c13515] border border-red-100' },
  cancelled: { label: 'Đã thu hồi',   className: 'bg-stone-100 text-stone-500 border border-stone-200' },
};

type TabId = 'profile' | 'matches' | 'requests';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profile',  label: 'Hồ sơ của tôi',         icon: <UserCheck size={16} /> },
  { id: 'matches',  label: 'Tìm bạn cùng phòng',    icon: <Users size={16} /> },
  { id: 'requests', label: 'Lời mời',                icon: <Mail size={16} /> },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
}

function getAvatarFallback(name?: string) {
  return name ? name.slice(0, 2).toUpperCase() : '??';
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : score >= 40 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-[#6a6a6a] bg-[#f7f7f7] border-[#dddddd]';
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border', color)}>
      <Star size={11} fill="currentColor" />
      {score}%
    </span>
  );
}

// ─── profile form ─────────────────────────────────────────────────────────────

const profileSchema = z.object({
  gender:      z.enum(['male', 'female', 'any']),
  budgetMin:   z.preprocess((v) => (typeof v === 'number' && isNaN(v) ? undefined : v), z.number({ message: 'Nhập ngân sách tối thiểu' }).min(500_000, 'Tối thiểu 500.000₫')),
  budgetMax:   z.preprocess((v) => (typeof v === 'number' && isNaN(v) ? undefined : v), z.number({ message: 'Nhập ngân sách tối đa' }).min(500_000, 'Tối thiểu 500.000₫')),
  schedule:    z.enum(['early_bird', 'night_owl', 'flexible']),
  lifestyle:   z.enum(['quiet', 'active', 'mixed']),
  cleanliness: z.enum(['neat', 'average', 'relaxed']),
  duration:    z.enum(['short', 'long', 'flexible']),
  pets:        z.enum(['ok', 'no']),
  smoking:     z.enum(['ok', 'no']),
  looking:     z.boolean(),
  bio:         z.string()
                 .trim()
                 .min(20, 'Giới thiệu phải có ít nhất 20 ký tự')
                 .max(500, 'Giới thiệu tối đa 500 ký tự'),
  city:        z.string()
                 .trim()
                 .min(2, 'Vui lòng nhập thành phố')
                 .max(100, 'Tên thành phố tối đa 100 ký tự'),
}).refine((d) => d.budgetMax >= d.budgetMin, {
  message: 'Ngân sách tối đa phải lớn hơn tối thiểu',
  path: ['budgetMax'],
});

type ProfileForm = z.infer<typeof profileSchema>;

const DEFAULT_PROFILE_VALUES: ProfileForm = {
  gender: 'any', schedule: 'flexible', lifestyle: 'mixed',
  cleanliness: 'average', duration: 'flexible',
  pets: 'no', smoking: 'no', looking: true,
  budgetMin: 2_000_000, budgetMax: 6_000_000,
  bio: '', city: '',
};

function ProfileTab() {
  const { data: profile, isLoading } = useMyRoommateProfile();
  const upsert = useUpsertRoommateProfile();
  const remove = useDeleteRoommateProfile();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileForm>,
    defaultValues: DEFAULT_PROFILE_VALUES,
  });

  const bioValue  = watch('bio') ?? '';
  const budgetMin = watch('budgetMin');
  const budgetMax = watch('budgetMax');

  useEffect(() => {
    if (profile?.budget) {
      reset(
        {
          gender:      profile.gender,
          budgetMin:   profile.budget.min,
          budgetMax:   profile.budget.max,
          schedule:    profile.schedule,
          lifestyle:   profile.lifestyle,
          cleanliness: profile.cleanliness ?? 'average',
          duration:    profile.duration    ?? 'flexible',
          pets:        profile.pets,
          smoking:     profile.smoking,
          looking:     profile.looking,
          bio:         profile.bio  ?? '',
          city:        profile.city ?? '',
        },
        { keepDirtyValues: true }
      );
    }
  }, [profile, reset]);

  const onSubmit = (values: ProfileForm) => {
    upsert.mutate({
      gender:      values.gender,
      budget:      { min: values.budgetMin, max: values.budgetMax },
      schedule:    values.schedule,
      lifestyle:   values.lifestyle,
      cleanliness: values.cleanliness,
      duration:    values.duration,
      pets:        values.pets,
      smoking:     values.smoking,
      looking:     values.looking,
      bio:         values.bio  || undefined,
      city:        values.city || undefined,
    });
  };

  if (isLoading) return <FormSkeleton />;

  return (
    <div className="space-y-5 max-w-xl">
      {/* ── Status preview card ────────────────────────────────────────── */}
      {profile ? (
        <div className="border border-[#dddddd] rounded-card p-4 bg-white flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#f7f7f7] border border-[#dddddd] overflow-hidden flex items-center justify-center shrink-0">
            {profile.user?.avatar ? (
              <Image src={profile.user.avatar} alt={profile.user.name} width={48} height={48} className="object-cover w-full h-full" />
            ) : (
              <span className="text-sm font-semibold text-[#6a6a6a]">{getAvatarFallback(profile.user?.name)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-[#222222]">{profile.user?.name}</p>
              {profile.looking ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Đang tìm kiếm
                </span>
              ) : (
                <span className="text-xs font-medium bg-[#f7f7f7] text-[#6a6a6a] border border-[#dddddd] px-2 py-0.5 rounded-full">
                  Đã ẩn hồ sơ
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.budget && <Chip>{formatVnd(profile.budget.min)} – {formatVnd(profile.budget.max)}</Chip>}
              {profile.schedule    && <Chip>{SCHEDULE_LABELS[profile.schedule]}</Chip>}
              {profile.cleanliness && <Chip>{CLEANLINESS_LABELS[profile.cleanliness]}</Chip>}
              {profile.city        && <Chip>{profile.city}</Chip>}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-[#dddddd] rounded-card px-4 py-4 bg-[#f7f7f7]">
          <p className="text-sm font-semibold text-[#222222] mb-0.5">Bạn chưa có hồ sơ</p>
          <p className="text-sm text-[#6a6a6a]">Điền thông tin bên dưới để bắt đầu tìm bạn cùng phòng.</p>
        </div>
      )}

      {/* ── Form — flat sections với border-t dividers (Airbnb settings pattern) */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">

        {/* Section: visibility toggle */}
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-semibold text-[#222222]">Hiển thị hồ sơ</p>
            <p className="text-xs text-[#6a6a6a] mt-0.5">Bật để xuất hiện trong gợi ý tìm bạn cùng phòng</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
            <input type="checkbox" {...register('looking')} className="sr-only peer" />
            <div className="w-10 h-5 bg-[#dddddd] rounded-full peer peer-checked:bg-[#ffef3d] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        {/* Section: basic preferences */}
        <div className="border-t border-[#dddddd] py-5 space-y-4">
          <p className="text-xs font-semibold text-[#6a6a6a] uppercase tracking-wide">Thông tin tìm kiếm</p>

          <FieldGroup label="Giới tính" error={errors.gender?.message}>
            <PillRadioGroup
              name="gender"
              options={Object.entries(GENDER_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              register={register}
              currentValue={watch('gender')}
            />
          </FieldGroup>

          <FieldGroup label={
            <span>Thành phố <span className="text-[#c13515]">*</span></span>
          } error={errors.city?.message}>
            <input
              {...register('city')}
              className={inputCls(!!errors.city)}
              placeholder="VD: Hồ Chí Minh, Hà Nội..."
            />
            <p className="text-xs text-[#6a6a6a] mt-1">Chỉ hiển thị bạn cùng phòng trong cùng thành phố.</p>
          </FieldGroup>

          <FieldGroup label="Thời gian thuê" error={errors.duration?.message}>
            <PillRadioGroup
              name="duration"
              options={Object.entries(DURATION_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              register={register}
              currentValue={watch('duration')}
            />
          </FieldGroup>
        </div>

        {/* Section: budget */}
        <div className="border-t border-[#dddddd] py-5 space-y-3">
          <p className="text-xs font-semibold text-[#6a6a6a] uppercase tracking-wide">Ngân sách / tháng</p>
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-[#6a6a6a]">Từ</label>
              <input
                type="number" step={100_000} min={500_000}
                {...register('budgetMin', { valueAsNumber: true })}
                className={inputCls(!!errors.budgetMin)}
              />
              {errors.budgetMin && <p className="text-xs text-[#c13515]">{errors.budgetMin.message}</p>}
            </div>
            <span className="text-[#6a6a6a] mt-7">—</span>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-[#6a6a6a]">Đến</label>
              <input
                type="number" step={100_000} min={500_000}
                {...register('budgetMax', { valueAsNumber: true })}
                className={inputCls(!!errors.budgetMax)}
              />
              {errors.budgetMax && <p className="text-xs text-[#c13515]">{errors.budgetMax.message}</p>}
            </div>
          </div>
          {budgetMin > 0 && budgetMax > 0 && (
            <p className="text-xs text-[#6a6a6a]">{formatVnd(budgetMin)} – {formatVnd(budgetMax)}</p>
          )}
        </div>

        {/* Section: lifestyle */}
        <div className="border-t border-[#dddddd] py-5 space-y-4">
          <p className="text-xs font-semibold text-[#6a6a6a] uppercase tracking-wide">Thói quen sinh hoạt</p>

          <FieldGroup label="Lịch sinh hoạt" error={errors.schedule?.message}>
            <PillRadioGroup
              name="schedule"
              options={Object.entries(SCHEDULE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              register={register}
              currentValue={watch('schedule')}
            />
          </FieldGroup>

          <FieldGroup label="Lối sống" error={errors.lifestyle?.message}>
            <PillRadioGroup
              name="lifestyle"
              options={Object.entries(LIFESTYLE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              register={register}
              currentValue={watch('lifestyle')}
            />
          </FieldGroup>

          <FieldGroup label="Mức độ ngăn nắp" error={errors.cleanliness?.message}>
            <PillRadioGroup
              name="cleanliness"
              options={Object.entries(CLEANLINESS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
              register={register}
              currentValue={watch('cleanliness')}
            />
          </FieldGroup>
        </div>

        {/* Section: house rules */}
        <div className="border-t border-[#dddddd] py-5 space-y-4">
          <p className="text-xs font-semibold text-[#6a6a6a] uppercase tracking-wide">Nội quy phòng</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Thú cưng" error={errors.pets?.message}>
              <PillRadioGroup
                name="pets"
                options={Object.entries(PETS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                register={register}
                currentValue={watch('pets')}
              />
            </FieldGroup>
            <FieldGroup label="Hút thuốc" error={errors.smoking?.message}>
              <PillRadioGroup
                name="smoking"
                options={Object.entries(SMOKING_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                register={register}
                currentValue={watch('smoking')}
              />
            </FieldGroup>
          </div>
        </div>

        {/* Section: bio */}
        <div className="border-t border-[#dddddd] py-5 space-y-2">
          <p className="text-xs font-semibold text-[#6a6a6a] uppercase tracking-wide">
            Giới thiệu bản thân <span className="text-[#c13515]">*</span>
          </p>
          <textarea
            {...register('bio')}
            rows={3}
            maxLength={500}
            className={cn(inputCls(!!errors.bio), 'resize-none')}
            placeholder="Mô tả ngắn về bản thân, thói quen, điều bạn mong muốn ở người ở ghép (tối thiểu 20 ký tự)..."
          />
          {errors.bio && <p className="text-xs text-[#c13515]">{errors.bio.message}</p>}
          <p className={cn('text-xs text-right', bioValue.length > 450 ? 'text-amber-600' : 'text-[#6a6a6a]')}>
            {bioValue.length}/500
          </p>
        </div>

        {/* Actions */}
        <div className="border-t border-[#dddddd] pt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={upsert.isPending || (!isDirty && !!profile)}
            className="flex items-center gap-2 bg-[#ffef3d] text-[#1f1c00] text-sm font-medium px-6 py-2.5 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {upsert.isPending && <Loader2 size={15} className="animate-spin" />}
            {profile ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ'}
          </button>

          {profile && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-sm text-[#c13515] border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Xoá hồ sơ
            </button>
          )}
          {confirmDelete && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#222222]">Chắc chắn xoá?</span>
              <button
                type="button"
                onClick={() => { remove.mutate(); setConfirmDelete(false); }}
                disabled={remove.isPending}
                className="text-sm text-white bg-[#c13515] px-3 py-1.5 rounded-lg disabled:opacity-60"
              >
                Xoá
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-[#6a6a6a] px-3 py-1.5"
              >
                Huỷ
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── matches tab ──────────────────────────────────────────────────────────────

function MatchesTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useRoommateMatches(page);
  const send = useSendRoommateRequest();
  const [explainId, setExplainId] = useState<string | null>(null);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [sentUserIds, setSentUserIds] = useState<Set<string>>(new Set());
  const [inviteTarget, setInviteTarget] = useState<{ userId: string; userName: string } | null>(null);

  const matches = data?.data ?? [];
  const pagination = data?.pagination;

  const handleSend = (userId: string, message?: string) => {
    send.mutate(
      { userId, message },
      {
        onSuccess: () => {
          setSentUserIds((prev) => new Set(prev).add(userId));
        },
      }
    );
  };

  const isSending = (userId: string) => send.isPending && send.variables?.userId === userId;

  if (isLoading) return <MatchSkeleton />;

  if (error) {
    const msg = (error as { response?: { data?: { message?: string } } })
      ?.response?.data?.message ?? 'Không thể tải danh sách gợi ý.';
    return (
      <div className="text-center py-16 text-[#6a6a6a]">
        <Users size={40} className="mx-auto mb-3 text-[#dddddd]" />
        <p className="font-medium text-[#222222]">{msg}</p>
        <p className="text-sm mt-1">
          Vào tab <strong>Hồ sơ của tôi</strong> để tạo hồ sơ và bật trạng thái tìm kiếm.
        </p>
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className="text-center py-16 text-[#6a6a6a]">
        <Users size={40} className="mx-auto mb-3 text-[#dddddd]" />
        <p className="font-medium text-[#222222]">Chưa có kết quả phù hợp</p>
        <p className="text-sm mt-1">Hãy đảm bảo hồ sơ của bạn đang ở trạng thái "Tìm kiếm".</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewProfileId && (
        <ProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />
      )}
      {inviteTarget && (
        <InviteModal
          userId={inviteTarget.userId}
          userName={inviteTarget.userName}
          onSend={(userId) => {
            handleSend(userId);
            setInviteTarget(null);
          }}
          onClose={() => setInviteTarget(null)}
        />
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            profile={m}
            onInvite={(userId, userName) => setInviteTarget({ userId, userName })}
            isSending={isSending(m.user.id)}
            isSent={sentUserIds.has(m.user.id)}
            onExplain={(userId) => setExplainId(explainId === userId ? null : userId)}
            isExplaining={explainId === m.user.id}
            onViewProfile={(userId) => setViewProfileId(userId)}
          />
        ))}
      </div>

      {/* Explain panel */}
      {explainId && (
        <ExplainPanel userId={explainId} onClose={() => setExplainId(null)} />
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="p-2 rounded-full border border-[#dddddd] hover:bg-[#f7f7f7] disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[#222222]">
            Trang {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === pagination.totalPages}
            className="p-2 rounded-full border border-[#dddddd] hover:bg-[#f7f7f7] disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function MatchCard({
  profile, onInvite, isSending, isSent, onExplain, isExplaining, onViewProfile,
}: {
  profile: RoommateProfile;
  onInvite: (userId: string, userName: string) => void;
  isSending: boolean;
  isSent: boolean;
  onExplain: (userId: string) => void;
  isExplaining: boolean;
  onViewProfile: (userId: string) => void;
}) {
  const user = profile.user;
  const requestStatus = profile.requestStatus;
  const isPending   = requestStatus === 'pending' || isSent;
  const isAccepted  = requestStatus === 'accepted';
  const canSend     = !requestStatus && !isSent;

  return (
    <div className="bg-white border border-[#dddddd] rounded-card p-4 space-y-3 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onViewProfile(user.id)}
          className="w-11 h-11 rounded-full bg-[#f7f7f7] border border-[#dddddd] overflow-hidden flex items-center justify-center shrink-0 hover:ring-2 hover:ring-[#ff385c]/30 transition-all"
        >
          {user.avatar ? (
            <Image src={user.avatar} alt={user.name} width={44} height={44} className="object-cover w-full h-full" />
          ) : (
            <span className="text-sm font-semibold text-[#6a6a6a]">{getAvatarFallback(user.name)}</span>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => onViewProfile(user.id)} className="font-semibold text-[#222222] text-sm truncate hover:underline text-left w-full">
            {user.name}
          </button>
          {profile.city && (
            <p className="text-xs text-[#6a6a6a] truncate">{profile.city}</p>
          )}
        </div>
        {profile.matchScore !== undefined && <ScoreBadge score={profile.matchScore} />}
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-1.5">
        <Chip>{formatVnd(profile.budget.min)} – {formatVnd(profile.budget.max)}</Chip>
        <Chip>{SCHEDULE_LABELS[profile.schedule]}</Chip>
        <Chip>{LIFESTYLE_LABELS[profile.lifestyle]}</Chip>
        {profile.pets === 'ok' && <Chip>🐾 Thú cưng OK</Chip>}
        {profile.smoking === 'no' && <Chip>🚭 Không hút thuốc</Chip>}
      </div>

      {profile.bio && (
        <p className="text-xs text-[#6a6a6a] line-clamp-2">{profile.bio}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => canSend && onInvite(user.id, user.name)}
          disabled={isSending || !canSend}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-colors',
            isAccepted
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
              : isPending
              ? 'bg-amber-50 text-amber-700 border border-amber-200 cursor-default'
              : 'bg-[#ffef3d] text-[#1f1c00] hover:shadow-lg disabled:opacity-60'
          )}
        >
          {isAccepted ? <Check size={13} /> : isPending ? <Loader2 size={13} /> : <Send size={13} />}
          {isAccepted ? 'Đã kết nối' : isPending ? 'Đã gửi' : 'Gửi lời mời'}
        </button>
        <button
          onClick={() => onViewProfile(user.id)}
          className="flex items-center gap-1 text-xs font-medium border border-[#dddddd] text-[#6a6a6a] px-2.5 py-2 rounded-lg hover:bg-[#f7f7f7] transition-colors"
          title="Xem hồ sơ"
        >
          <Eye size={13} />
        </button>
        <button
          onClick={() => onExplain(user.id)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium border px-3 py-2 rounded-lg transition-colors',
            isExplaining
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'border-[#dddddd] text-[#6a6a6a] hover:bg-[#f7f7f7]'
          )}
        >
          <Sparkles size={13} />
          AI
        </button>
      </div>
    </div>
  );
}

function ExplainPanel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, isLoading, error } = useExplainRoommateMatch(userId, true);
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-card p-4 relative">
      <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-amber-100">
        <X size={14} className="text-amber-700" />
      </button>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={15} className="text-amber-600" />
        <span className="text-sm font-semibold text-amber-800">Phân tích AI</span>
      </div>
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-amber-700">
          <Loader2 size={14} className="animate-spin" />
          Đang phân tích...
        </div>
      )}
      {error && <p className="text-sm text-[#c13515]">Không thể tải phân tích. Vui lòng thử lại.</p>}
      {data?.data && (
        <div className="space-y-1">
          <p className="text-sm text-[#222222] leading-relaxed">{data.data.explanation}</p>
          <p className="text-xs text-amber-600 mt-2">Điểm tương thích: {data.data.score}/100</p>
        </div>
      )}
    </div>
  );
}

// ─── profile modal ────────────────────────────────────────────────────────────

function ProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: profile, isLoading } = useRoommateUserProfile(userId, true);
  const property = profile?.property && typeof profile.property === 'object'
    ? profile.property as Property
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dddddd]">
          <span className="font-semibold text-[#222222]">Hồ sơ tìm bạn cùng phòng</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f7f7f7] transition-colors">
            <X size={16} className="text-[#6a6a6a]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-[#f7f7f7]" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-[#f7f7f7] rounded" />
                  <div className="h-3 w-20 bg-[#f7f7f7] rounded" />
                </div>
              </div>
              {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-[#f7f7f7] rounded-lg" />)}
            </div>
          )}

          {profile && (
            <>
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#f7f7f7] border border-[#dddddd] overflow-hidden flex items-center justify-center shrink-0">
                  {profile.user?.avatar ? (
                    <Image src={profile.user.avatar} alt={profile.user.name} width={56} height={56} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-base font-semibold text-[#6a6a6a]">{getAvatarFallback(profile.user?.name)}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#222222]">{profile.user?.name}</p>
                  <p className="text-sm text-[#6a6a6a]">{GENDER_LABELS[profile.gender]}</p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow label="Ngân sách" value={`${formatVnd(profile.budget.min)} – ${formatVnd(profile.budget.max)}`} />
                <InfoRow label="Lịch sinh hoạt" value={SCHEDULE_LABELS[profile.schedule]} />
                <InfoRow label="Lối sống" value={LIFESTYLE_LABELS[profile.lifestyle]} />
                <InfoRow label="Thú cưng" value={PETS_LABELS[profile.pets]} />
                <InfoRow label="Hút thuốc" value={SMOKING_LABELS[profile.smoking]} />
                {profile.city && (
                  <InfoRow label="Thành phố" value={profile.city} />
                )}
              </div>

              {/* Contact — only shown when request is accepted */}
              {profile.contactRevealed && (
                <div className="border border-emerald-200 rounded-xl bg-emerald-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                    <Phone size={12} />
                    Thông tin liên hệ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.user?.phone && (
                      <a
                        href={`tel:${profile.user.phone}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <Phone size={11} />
                        {profile.user.phone}
                      </a>
                    )}
                    {profile.user?.email && (
                      <a
                        href={`mailto:${profile.user.email}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-[#dddddd] text-[#6a6a6a] px-3 py-1.5 rounded-lg hover:bg-[#f7f7f7] transition-colors"
                      >
                        <AtSign size={11} />
                        {profile.user.email}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {profile.bio && (
                <div>
                  <p className="text-xs font-medium text-[#6a6a6a] mb-1">Giới thiệu</p>
                  <p className="text-sm text-[#222222] leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Property */}
              {property && (
                <div className="border border-[#dddddd] rounded-xl p-3 flex items-start gap-3">
                  <Building2 size={16} className="text-[#6a6a6a] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#222222] truncate">{property.title}</p>
                    {property.address && (
                      <p className="text-xs text-[#6a6a6a] truncate mt-0.5">
                        {typeof property.address === 'object'
                          ? [property.address.street, property.address.district, property.address.city].filter(Boolean).join(', ')
                          : property.address}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/properties/${property.id}`}
                    target="_blank"
                    className="shrink-0 text-xs font-medium text-[#ff385c] border border-[#ff385c]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#ff385c]/5 transition-colors"
                  >
                    Xem phòng
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f7f7f7] rounded-lg px-3 py-2">
      <p className="text-[10px] text-[#6a6a6a] font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-[#222222] font-medium mt-0.5">{value}</p>
    </div>
  );
}

// ─── invite modal ────────────────────────────────────────────────────────────

function InviteModal({
  userId,
  userName,
  onSend,
  onClose,
}: {
  userId: string;
  userName: string;
  onSend: (userId: string, message?: string) => void;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onSend(userId, message.trim() || undefined);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dddddd]">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-[#ff385c]" />
            <span className="font-semibold text-[#222222]">Gửi lời mời</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f7f7f7] transition-colors">
            <X size={16} className="text-[#6a6a6a]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-[#6a6a6a]">
            Gửi lời mời kết nối đến <span className="font-semibold text-[#222222]">{userName}</span>.
            Bạn có thể thêm lời nhắn để tăng khả năng được chấp nhận.
          </p>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#222222]">
              Lời nhắn <span className="text-[#6a6a6a] font-normal">(tuỳ chọn)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={300}
              className={cn(inputCls(false), 'resize-none')}
              placeholder="VD: Chào bạn, mình thấy hồ sơ của bạn rất phù hợp với mình..."
              autoFocus
            />
            <p className="text-xs text-right text-[#6a6a6a]">{message.length}/300</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium border border-[#dddddd] text-[#6a6a6a] py-2.5 rounded-lg hover:bg-[#f7f7f7] disabled:opacity-50 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold bg-[#ffef3d] text-[#1f1c00] py-2.5 rounded-lg hover:shadow-lg disabled:opacity-60 transition-all"
            >
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Gửi lời mời
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── requests tab ─────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return 'Vừa xong';
  if (mins  < 60) return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
}

function RequestCard({
  req, direction,
  onRespond, onCancel, isResponding, isCancelling,
  onViewProfile,
}: {
  req: RoommateRequest;
  direction: 'received' | 'sent';
  onRespond: (action: 'accepted' | 'rejected') => void;
  onCancel: () => void;
  isResponding: boolean;
  isCancelling: boolean;
  onViewProfile: (userId: string) => void;
}) {
  const other     = direction === 'received' ? req.sender : req.receiver;
  const isPending  = req.status === 'pending';
  const isAccepted = req.status === 'accepted';
  const isDone     = req.status === 'rejected' || req.status === 'cancelled';

  /* ── Accepted ── */
  if (isAccepted) {
    return (
      <div className="border border-emerald-200 rounded-card bg-white overflow-hidden">
        {/* success banner */}
        <div className="bg-emerald-50 px-4 py-2.5 flex items-center gap-2 border-b border-emerald-100">
          <Check size={13} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-emerald-700">Kết nối thành công</span>
          <span className="ml-auto text-xs text-emerald-600/70">{formatRelativeTime(req.createdAt)}</span>
        </div>
        <div className="px-4 py-3 space-y-3">
          {/* avatar + name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onViewProfile(other.id)}
              className="w-10 h-10 rounded-full bg-[#f7f7f7] border border-[#dddddd] overflow-hidden flex items-center justify-center shrink-0 hover:ring-2 hover:ring-emerald-300 transition-all"
            >
              {other.avatar
                ? <Image src={other.avatar} alt={other.name} width={40} height={40} className="object-cover w-full h-full" />
                : <span className="text-xs font-semibold text-[#6a6a6a]">{getAvatarFallback(other.name)}</span>}
            </button>
            <button onClick={() => onViewProfile(other.id)} className="font-semibold text-sm text-[#222222] hover:underline text-left">
              {other.name}
            </button>
          </div>
          {/* contact */}
          <div className="flex flex-wrap gap-2">
            {other.phone && (
              <a href={`tel:${other.phone}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Phone size={11} />{other.phone}
              </a>
            )}
            {other.email && (
              <a href={`mailto:${other.email}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white border border-[#dddddd] text-[#6a6a6a] px-3 py-1.5 rounded-lg hover:bg-[#f7f7f7] transition-colors"
              >
                <AtSign size={11} />{other.email}
              </a>
            )}
          </div>
          <button
            onClick={() => onViewProfile(other.id)}
            className="inline-flex items-center gap-1.5 text-xs font-medium border border-[#dddddd] text-[#6a6a6a] px-3 py-1.5 rounded-lg hover:bg-[#f7f7f7] transition-colors"
          >
            <Eye size={12} />Xem hồ sơ
          </button>
        </div>
      </div>
    );
  }

  /* ── Pending received ── */
  if (isPending && direction === 'received') {
    return (
      <div className="border-2 border-[#222222] rounded-card bg-white overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f7f7f7] border border-[#dddddd] overflow-hidden flex items-center justify-center shrink-0">
            {other.avatar
              ? <Image src={other.avatar} alt={other.name} width={40} height={40} className="object-cover w-full h-full" />
              : <span className="text-xs font-semibold text-[#6a6a6a]">{getAvatarFallback(other.name)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-[#222222]">{other.name}</p>
            <p className="text-xs text-[#6a6a6a]">{formatRelativeTime(req.createdAt)}</p>
          </div>
        </div>
        {req.message && (
          <div className="px-4 pb-3">
            <p className="text-xs text-[#6a6a6a] bg-[#f7f7f7] rounded-lg px-3 py-2 italic">"{req.message}"</p>
          </div>
        )}
        {/* footer actions */}
        <div className="border-t border-[#dddddd] px-4 py-2.5 flex gap-2">
          <button
            onClick={() => onRespond('accepted')}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#ffef3d] text-[#1f1c00] py-2 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {isResponding ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Chấp nhận
          </button>
          <button
            onClick={() => onRespond('rejected')}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-[#dddddd] text-[#6a6a6a] py-2 rounded-lg hover:bg-[#f7f7f7] disabled:opacity-50 transition-colors"
          >
            <X size={13} />
            Từ chối
          </button>
        </div>
      </div>
    );
  }

  /* ── Pending sent ── */
  if (isPending && direction === 'sent') {
    return (
      <div className="border border-[#dddddd] rounded-card bg-white overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f7f7f7] border border-[#dddddd] overflow-hidden flex items-center justify-center shrink-0">
            {other.avatar
              ? <Image src={other.avatar} alt={other.name} width={40} height={40} className="object-cover w-full h-full" />
              : <span className="text-xs font-semibold text-[#6a6a6a]">{getAvatarFallback(other.name)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-[#222222]">{other.name}</p>
            <p className="text-xs text-[#6a6a6a]">{formatRelativeTime(req.createdAt)}</p>
          </div>
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shrink-0">
            Chờ phản hồi
          </span>
        </div>
        {req.message && (
          <div className="px-4 pb-3">
            <p className="text-xs text-[#6a6a6a] bg-[#f7f7f7] rounded-lg px-3 py-2 italic">"{req.message}"</p>
          </div>
        )}
        <div className="border-t border-[#dddddd] px-4 py-2.5">
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="flex items-center gap-1.5 text-xs font-medium text-[#c13515] border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {isCancelling ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
            Thu hồi lời mời
          </button>
        </div>
      </div>
    );
  }

  /* ── Rejected / Cancelled ── */
  return (
    <div className={cn('border rounded-card bg-white px-4 py-3 flex items-center gap-3 opacity-60', 'border-[#dddddd]')}>
      <div className="w-10 h-10 rounded-full bg-[#f7f7f7] border border-[#dddddd] overflow-hidden flex items-center justify-center shrink-0">
        {other.avatar
          ? <Image src={other.avatar} alt={other.name} width={40} height={40} className="object-cover w-full h-full" />
          : <span className="text-xs font-semibold text-[#6a6a6a]">{getAvatarFallback(other.name)}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[#6a6a6a]">{other.name}</p>
        <p className="text-xs text-[#6a6a6a]">{formatRelativeTime(req.createdAt)}</p>
      </div>
      <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full shrink-0', REQUEST_STATUS_CONFIG[req.status].className)}>
        {REQUEST_STATUS_CONFIG[req.status].label}
      </span>
    </div>
  );
}

function RequestsTab() {
  const [type, setType] = useState<'received' | 'sent'>('received');
  const { data, isLoading }           = useMyRoommateRequests(type);
  const { data: pendingReceivedRes }  = useMyRoommateRequests('received', 'pending');
  const { data: pendingSentRes }      = useMyRoommateRequests('sent',     'pending');
  const respond = useRespondRoommateRequest();
  const cancel  = useCancelRoommateRequest();
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [pendingRespond, setPendingRespond] = useState<Record<string, 'accepted' | 'rejected' | null>>({});
  const [pendingCancel, setPendingCancel]   = useState<Set<string>>(new Set());

  const pendingReceivedCount = pendingReceivedRes?.pagination?.total ?? 0;
  const pendingSentCount     = pendingSentRes?.pagination?.total     ?? 0;

  const raw      = data?.data ?? [];
  // sort: pending first, then by createdAt desc
  const requests = [...raw].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return  1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const SUBTABS = [
    { id: 'received' as const, label: 'Nhận được', count: pendingReceivedCount },
    { id: 'sent'     as const, label: 'Đã gửi',    count: pendingSentCount     },
  ];

  const handleRespond = (id: string, action: 'accepted' | 'rejected') => {
    setPendingRespond((prev) => ({ ...prev, [id]: action }));
    respond.mutate(
      { id, action },
      {
        onSettled: () => {
          setPendingRespond((prev) => ({ ...prev, [id]: null }));
        },
      }
    );
  };

  const handleCancel = (id: string) => {
    setPendingCancel((prev) => new Set(prev).add(id));
    cancel.mutate(id, {
      onSettled: () => {
        setPendingCancel((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
    });
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {viewProfileId && (
        <ProfileModal userId={viewProfileId} onClose={() => setViewProfileId(null)} />
      )}

      {/* Sub tabs */}
      <div className="flex gap-1 bg-[#f7f7f7] p-1 rounded-lg w-fit">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id)}
            className={cn(
              'flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-md font-medium transition-colors',
              type === t.id ? 'bg-white text-[#222222] shadow-sm' : 'text-[#6a6a6a] hover:text-[#222222]'
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold bg-[#ff385c] text-white rounded-full">
                {t.count > 9 ? '9+' : t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <RequestSkeleton />}

      {!isLoading && !requests.length && (
        <div className="text-center py-12 text-[#6a6a6a]">
          <Mail size={36} className="mx-auto mb-3 text-[#dddddd]" />
          <p className="font-medium text-[#222222] mb-1">
            {type === 'received' ? 'Chưa có ai gửi lời mời' : 'Bạn chưa gửi lời mời nào'}
          </p>
          <p className="text-sm">
            {type === 'received'
              ? 'Khi ai đó muốn kết nối với bạn, lời mời sẽ xuất hiện ở đây.'
              : 'Khám phá tab "Tìm bạn cùng phòng" để gửi lời mời đến các hồ sơ phù hợp.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {requests.map((req) => (
          <RequestCard
            key={req.id}
            req={req}
            direction={type}
            onRespond={(action) => handleRespond(req.id, action)}
            onCancel={() => handleCancel(req.id)}
            isResponding={!!pendingRespond[req.id]}
            isCancelling={pendingCancel.has(req.id)}
            onViewProfile={setViewProfileId}
          />
        ))}
      </div>
    </div>
  );
}

// ─── small ui helpers ─────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs text-[#6a6a6a] bg-[#f7f7f7] border border-[#dddddd] px-2 py-0.5 rounded-full">
      {children}
    </span>
  );
}

function FieldGroup({ label, error, children }: { label: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#222222]">{label}</label>
      {children}
      {error && <p className="text-xs text-[#c13515]">{error}</p>}
    </div>
  );
}

function PillRadioGroup({ name, options, register, currentValue }: {
  name: string;
  options: { value: string; label: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  currentValue: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            'cursor-pointer px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all select-none',
            currentValue === opt.value
              ? 'bg-[#222222] text-white border-[#222222]'
              : 'bg-white border-[#dddddd] text-[#6a6a6a] hover:border-[#aaaaaa] hover:text-[#222222]'
          )}
        >
          <input type="radio" value={opt.value} {...register(name)} className="sr-only" />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

const inputCls = (hasError: boolean) =>
  cn(
    'w-full text-sm border rounded-lg px-3 py-2.5 outline-none transition-colors',
    hasError
      ? 'border-[#c13515] focus:ring-2 focus:ring-[#c13515]/20'
      : 'border-[#dddddd] focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/10',
  );

function FormSkeleton() {
  return (
    <div className="space-y-6 max-w-xl animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 bg-[#f7f7f7] rounded" />
          <div className="h-10 bg-[#f7f7f7] rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function MatchSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="border border-[#dddddd] rounded-card p-4 space-y-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#f7f7f7]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 bg-[#f7f7f7] rounded" />
              <div className="h-3 w-16 bg-[#f7f7f7] rounded" />
            </div>
          </div>
          <div className="flex gap-1.5">
            {[...Array(3)].map((_, j) => <div key={j} className="h-5 w-16 bg-[#f7f7f7] rounded-full" />)}
          </div>
          <div className="h-8 bg-[#f7f7f7] rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function RequestSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-[#dddddd] rounded-card p-4 flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-[#f7f7f7]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 bg-[#f7f7f7] rounded" />
            <div className="h-3 w-20 bg-[#f7f7f7] rounded" />
          </div>
          <div className="h-6 w-20 bg-[#f7f7f7] rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function RoommatePage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const { data: requestsRes } = useMyRoommateRequests('received', 'pending');
  const pendingCount = requestsRes?.pagination?.total ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#222222]">Tìm bạn cùng phòng</h1>
        <p className="text-sm text-[#6a6a6a] mt-1">
          Tạo hồ sơ, xem các gợi ý phù hợp và kết nối với người ở ghép tiềm năng.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#dddddd] mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 text-sm font-medium px-4 py-3 border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-[#222222] text-[#222222]'
                : 'border-transparent text-[#6a6a6a] hover:text-[#222222]'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'requests' && pendingCount > 0 && (
              <span className="flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold bg-[#ff385c] text-white rounded-full">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile'  && <ProfileTab />}
      {activeTab === 'matches'  && <MatchesTab />}
      {activeTab === 'requests' && <RequestsTab />}
    </div>
  );
}
