'use client';

import { Check } from 'lucide-react';
import { usePlans, useMySubscription, useBuyPlan } from '@/hooks/use-subscription';
import { PriceDisplay } from '@/components/ui/price-display';
import type { Plan } from '@/types';

const PLAN_ORDER: Plan['key'][] = ['free', 'basic', 'premium'];

export default function PlansPage() {
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: summary, isLoading: subLoading }      = useMySubscription();
  const { mutate: buyPlan, isPending }                 = useBuyPlan();

  const currentPlanKey = summary?.plan?.key ?? 'free';
  const sorted = [...plans].sort(
    (a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key),
  );

  if (plansLoading || subLoading) {
    return <div className="py-20 text-center text-black/40 text-sm">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink-black mb-1">Gói đăng ký</h1>
        <p className="text-ash-gray text-sm">
          Nâng cấp để đăng thêm tin và giảm hoa hồng trên mỗi booking.
        </p>
      </div>

      {/* Current plan banner */}
      {summary && (
        <div className="flex items-center justify-between px-5 py-3.5 rounded-xl bg-soft-cloud border border-hairline-gray">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ash-gray">Gói hiện tại</span>
            <span className="w-1 h-1 rounded-full bg-stone-gray" />
            <span className="font-semibold text-ink-black">{summary.plan.name}</span>
            {summary.daysLeft !== null && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                summary.isExpiringSoon
                  ? 'bg-red-50 text-red-500'
                  : 'bg-soft-cloud text-ash-gray border border-hairline-gray'
              }`}>
                còn {summary.daysLeft} ngày
              </span>
            )}
          </div>
          <span className="text-sm text-ash-gray">
            <span className="font-semibold text-ink-black">{summary.activeListings}</span>
            &nbsp;/&nbsp;
            {summary.plan.listingLimit === -1 ? '∞' : summary.plan.listingLimit}
            &nbsp;tin đăng
          </span>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {sorted.map((plan) => {
          const isCurrent = plan.key === currentPlanKey;
          const isPremium = plan.key === 'premium';
          const canUpgrade = PLAN_ORDER.indexOf(plan.key) > PLAN_ORDER.indexOf(currentPlanKey);

          return (
            <div
              key={plan.key}
              className={`flex flex-col rounded-2xl overflow-hidden ${
                isPremium ? 'bg-[#111] text-white' : 'bg-white text-black border border-black/10'
              } ${isCurrent && !isPremium ? 'border-2 border-[#FFF546]' : ''}
              ${isCurrent && isPremium ? 'ring-2 ring-[#FFF546]' : ''}`}
            >
              {/* Plan header */}
              <div className={`px-6 pt-6 pb-5 border-b ${isPremium ? 'border-white/10' : 'border-black/6'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isPremium ? 'text-white/40' : 'text-black/40'}`}>
                    {plan.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold bg-[#FFF546] text-black px-2 py-0.5 rounded-full">
                      Đang dùng
                    </span>
                  )}
                  {!isCurrent && plan.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isPremium ? 'bg-[#FFF546] text-black' : 'bg-black/8 text-black/60'
                    }`}>
                      {plan.badge}
                    </span>
                  )}
                </div>

                {plan.price === 0 ? (
                  <p className="text-3xl font-bold">Miễn phí</p>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <PriceDisplay
                      amount={plan.price}
                      className={`text-3xl font-bold ${isPremium ? 'text-white' : 'text-black'}`}
                    />
                    <span className={`text-sm ${isPremium ? 'text-white/30' : 'text-black/30'}`}>/tháng</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-3.5 px-6 py-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={`size-4 shrink-0 mt-0.5 ${isPremium ? 'text-[#FFF546]' : 'text-black/50'}`} />
                    <span className={isPremium ? 'text-white/70' : 'text-black/65'}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="px-6 pb-6">
                <button
                  disabled={isCurrent || plan.key === 'free' || isPending}
                  onClick={() => canUpgrade && buyPlan(plan.key as 'basic' | 'premium')}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    isCurrent || plan.key === 'free'
                      ? `cursor-default ${isPremium ? 'bg-white/8 text-white/25' : 'bg-black/5 text-black/25'}`
                      : isPremium
                      ? 'bg-[#FFF546] text-black hover:bg-yellow-300'
                      : 'bg-black text-white hover:bg-black/80'
                  }`}
                >
                  {isCurrent ? 'Đang sử dụng'
                    : plan.key === 'free' ? 'Mặc định'
                    : isPending ? 'Đang xử lý...'
                    : `Nâng lên ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-mute-gray text-center">
        Hoa hồng dịch vụ luôn 10% · Gia hạn thủ công trước khi gói hết hạn
      </p>
    </div>
  );
}
