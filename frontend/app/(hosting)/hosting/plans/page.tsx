'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Check,
  X,
  Zap,
  BarChart2,
  ArrowUpCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/api-error';
import type { ApiResponse, Plan, Subscription } from '@/types';

// ─── API calls ────────────────────────────────────────────────────────────────

async function getPlansApi() {
  const res = await api.get<ApiResponse<{ plans: Plan[] }>>('/subscriptions/plans');
  return res.data;
}

async function getMySubscriptionApi() {
  const res = await api.get<ApiResponse<{ subscription: Subscription | null; currentPlan: Plan }>>(
    '/subscriptions/my',
  );
  return res.data;
}

// Two-step: create pending subscription → get PayOS payment link
async function subscribePlanApi(planId: string): Promise<string> {
  const subRes = await api.post<ApiResponse<{ subscription: { id: string } }>>(
    `/subscriptions/subscribe/${planId}`,
  );
  const subscriptionId = subRes.data.data.subscription.id;
  const payRes = await api.post<ApiResponse<{ paymentUrl: string }>>(
    `/payment/subscription/${subscriptionId}`,
  );
  return payRes.data.data.paymentUrl;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
}

function contractLabel(maxContracts: number): string {
  if (maxContracts === -1) return 'Hợp đồng không giới hạn';
  if (maxContracts === 0) return 'Không có hợp đồng';
  return `${maxContracts} hợp đồng dùng thử`;
}

function listingsLabel(maxListings: number): string {
  if (maxListings === -1) return 'Tin đăng không giới hạn';
  return `Tối đa ${maxListings} tin đăng`;
}

function featuredLabel(maxFeatured: number): string {
  if (maxFeatured === 0) return 'Không có tin nổi bật';
  return `${maxFeatured} tin nổi bật`;
}

function priorityLabel(level: number): string {
  if (level === 0) return '';
  if (level === 1) return 'Ưu tiên tìm kiếm (thấp)';
  return 'Ưu tiên tìm kiếm (cao)';
}

// ─── plan feature list ────────────────────────────────────────────────────────

function buildFeatures(plan: Plan): { text: string; included: boolean }[] {
  const features: { text: string; included: boolean }[] = [
    { text: listingsLabel(plan.maxListings), included: true },
    { text: featuredLabel(plan.maxFeatured), included: plan.maxFeatured > 0 },
    { text: contractLabel(plan.maxContracts), included: plan.maxContracts !== 0 },
  ];

  if (plan.priorityLevel > 0) {
    features.push({ text: priorityLabel(plan.priorityLevel), included: true });
  } else {
    features.push({ text: 'Không ưu tiên tìm kiếm', included: false });
  }

  if (plan.includesHighlight) {
    features.push({ text: 'Highlight tin đăng trong tìm kiếm', included: true });
  }

  if (plan.includesAnalytics) {
    features.push({ text: 'Phân tích & thống kê doanh thu', included: true });
    features.push({ text: 'Hỗ trợ ưu tiên cao', included: true });
  }

  return features;
}

// ─── plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
  isPopular,
  onUpgrade,
  isLoading,
}: {
  plan: Plan;
  isCurrent: boolean;
  isPopular: boolean;
  onUpgrade: (planId: string) => void;
  isLoading: boolean;
}) {
  const features = buildFeatures(plan);

  return (
    <div
      className={cn(
        'relative bg-white rounded-[16px] border-2 p-6 flex flex-col transition-shadow',
        isPopular
          ? 'border-[#ff385c] shadow-[rgba(255,56,92,0.12)_0_4px_24px]'
          : 'border-[#dddddd] hover:shadow-[rgba(0,0,0,0.08)_0_4px_16px]',
      )}
    >
      {isPopular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-[#ff385c] text-white text-xs font-semibold rounded-full whitespace-nowrap">
          <Sparkles className="size-3" />
          Phổ biến nhất
        </span>
      )}

      {/* Plan name + price */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6a6a6a]">{plan.name}</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-[#222222]">
            {plan.price === 0 ? 'Miễn phí' : formatVnd(plan.price)}
          </span>
          {plan.price > 0 && (
            <span className="text-sm text-[#6a6a6a]">/ {plan.durationDays} ngày</span>
          )}
        </div>
        {plan.description && (
          <p className="mt-2 text-xs text-[#6a6a6a] leading-relaxed">{plan.description}</p>
        )}
      </div>

      {/* Feature list */}
      <ul className="space-y-2.5 flex-1 mb-6">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5">
            {f.included ? (
              <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <X className="size-4 text-[#c1c1c1] shrink-0 mt-0.5" />
            )}
            <span
              className={cn(
                'text-sm',
                f.included ? 'text-[#222222]' : 'text-[#929292]',
              )}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <div className="w-full py-3 text-sm font-semibold text-center text-[#929292] bg-[#f7f7f7] rounded-lg">
          Gói hiện tại
        </div>
      ) : plan.slug === 'free' ? (
        <div className="w-full py-3 text-sm font-semibold text-center text-[#929292] bg-[#f7f7f7] rounded-lg">
          Gói mặc định
        </div>
      ) : (
        <button
          onClick={() => onUpgrade(plan.id)}
          disabled={isLoading}
          className={cn(
            'w-full py-3 text-sm font-semibold rounded-lg transition-all active:scale-95 disabled:opacity-60',
            isPopular
              ? 'bg-[#ff385c] hover:bg-[#e00b41] text-white'
              : 'bg-[#222222] hover:bg-[#3a3a3a] text-white',
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-1.5">
              <Loader2 className="size-4 animate-spin" />
              Đang xử lý...
            </span>
          ) : (
            `Nâng cấp ${plan.name}`
          )}
        </button>
      )}
    </div>
  );
}

// ─── add-on card ──────────────────────────────────────────────────────────────

function BoostAddonCard() {
  return (
    <div className="bg-white rounded-card border border-[#dddddd] p-5 flex items-start gap-4">
      <div className="size-10 bg-amber-50 rounded-full flex items-center justify-center shrink-0">
        <Zap className="size-5 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-[#222222]">Boost tin đăng</h3>
          <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Sắp ra mắt
          </span>
        </div>
        <p className="text-sm text-[#6a6a6a] leading-relaxed mb-3">
          Đẩy tin lên đầu kết quả tìm kiếm trong 24 giờ — áp dụng cho từng bất động sản riêng lẻ,
          không yêu cầu nâng gói.
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-[#222222]">50.000₫</span>
          <span className="text-sm text-[#6a6a6a]">/ 24 giờ / tin</span>
        </div>
      </div>
    </div>
  );
}

// ─── current plan badge ───────────────────────────────────────────────────────

function CurrentPlanBanner({ plan, subscription }: { plan: Plan; subscription: Subscription | null }) {
  if (plan.slug === 'free') return null;

  const endDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return (
    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-[12px]">
      <ArrowUpCircle className="size-5 text-emerald-600 shrink-0" />
      <div className="text-sm">
        <span className="font-semibold text-emerald-800">Gói {plan.name} đang hoạt động</span>
        {endDate && (
          <span className="text-emerald-700"> · Hết hạn {endDate}</span>
        )}
      </div>
    </div>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────

function PlanSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-[16px] border border-[#dddddd] p-6 flex flex-col gap-4">
      <div className="space-y-2">
        <div className="h-3 bg-[#ebebeb] rounded w-1/4" />
        <div className="h-8 bg-[#ebebeb] rounded w-1/2" />
        <div className="h-3 bg-[#ebebeb] rounded w-3/4" />
      </div>
      <div className="space-y-2.5 flex-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-[#ebebeb] rounded" />
        ))}
      </div>
      <div className="h-11 bg-[#ebebeb] rounded-lg" />
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function HostingPlansPage() {
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);

  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlansApi,
  });

  const { data: subData, isLoading: loadingSubscription } = useQuery({
    queryKey: ['subscription', 'my'],
    queryFn: getMySubscriptionApi,
  });

  const { mutate: subscribe } = useMutation({
    mutationFn: subscribePlanApi,
    onMutate: (planId) => setUpgradingPlanId(planId),
    onSuccess: (paymentUrl) => {
      setUpgradingPlanId(null);
      window.location.href = paymentUrl;
    },
    onError: (error) => {
      setUpgradingPlanId(null);
      toast.error(getApiErrorMessage(error, 'Không thể khởi tạo thanh toán. Vui lòng thử lại.'));
    },
  });

  // Backend trả { data: { plans: [...] } } — guard cả trường hợp cache lệch format
  const rawPlans = plansData?.data?.plans ?? plansData?.data;
  const plans: Plan[] = Array.isArray(rawPlans) ? rawPlans : [];
  const currentPlan = subData?.data?.currentPlan ?? null;
  const subscription = subData?.data?.subscription ?? null;

  const isLoading = loadingPlans || loadingSubscription;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">Gói đăng ký</h1>
        <p className="text-sm text-[#6a6a6a] mt-1">
          Chọn gói phù hợp để mở khoá thêm tính năng cho tài khoản của bạn.
        </p>
      </div>

      {/* Current plan banner */}
      {!isLoading && currentPlan && (
        <CurrentPlanBanner plan={currentPlan} subscription={subscription} />
      )}

      {/* Plan grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <PlanSkeleton key={i} />)
          : plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={currentPlan?.slug === plan.slug}
                isPopular={plan.slug === 'basic'}
                onUpgrade={(id) => subscribe(id)}
                isLoading={upgradingPlanId === plan.id}
              />
            ))}
      </div>

      {/* Add-ons section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-[#222222]">Tiện ích mở rộng</h2>
          <span className="text-xs font-semibold text-[#6a6a6a] bg-[#f7f7f7] border border-[#dddddd] px-2 py-0.5 rounded-full">
            Add-on
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BoostAddonCard />
          {/* Analytics card — only show when plan supports it */}
          {currentPlan?.includesAnalytics && (
            <div className="bg-white rounded-card border border-[#dddddd] p-5 flex items-start gap-4">
              <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <BarChart2 className="size-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-[#222222]">Phân tích doanh thu</h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Đã kích hoạt
                  </span>
                </div>
                <p className="text-sm text-[#6a6a6a] leading-relaxed">
                  Xem tổng doanh thu, tỷ lệ lấp đầy, và các chỉ số hiệu suất tin đăng trong trang
                  tổng quan của bạn.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan comparison note */}
      <p className="text-xs text-[#929292] text-center pb-4">
        Tất cả gói có thể gia hạn sau khi hết hạn · Thanh toán qua PayOS · Không tự động gia hạn
      </p>
    </div>
  );
}
