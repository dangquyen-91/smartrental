'use client';

import Link from 'next/link';
import {
  Users, Building2, CreditCard, ArrowRight,
  TrendingUp, TrendingDown, AlertCircle, Loader2,
} from 'lucide-react';
import { useAdminDashboard } from '@/hooks/use-admin';
import { cn } from '@/lib/utils';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const STATUS_COLOR_TEXT: Record<string, string> = {
  pending: 'text-[#ca8a04]',
  confirmed: 'text-[#2563eb]',
  active: 'text-[#16a34a]',
  completed: 'text-[#6a6a6a]',
  cancelled: 'text-[#c13515]',
  rejected: 'text-[#929292]',
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  confirmed: 'Đã xác nhận',
  active: 'Đang thuê',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
  rejected: 'Từ chối',
};

export default function AdminPage() {
  const { data, isLoading } = useAdminDashboard();
  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff385c]" />
      </div>
    );
  }

  const growth = stats?.revenue.growth;
  const isPositive = growth !== null && growth !== undefined && growth >= 0;
  const pending = stats?.pendingActions;
  const hasPending = pending && (pending.payouts > 0 || pending.refunds > 0 || pending.unassignedServiceOrders > 0);

  return (
    <div>
      {/* Page title */}
      <div className="flex flex-col items-start self-stretch mb-[31px]">
        <span className="text-[#222222] text-2xl font-bold">Tổng quan hệ thống</span>
      </div>

      {/* KPI Stats row */}
      <div className="flex items-center self-stretch mb-[33px]">
        {/* Users card */}
        <div className="flex flex-1 flex-col items-start bg-white py-5 pr-5 mr-4 rounded-[14px] border border-solid border-[#DDDDDD]">
          <div className="flex items-center gap-3 px-3 py-2 bg-[#FFF546] rounded-[10px] mb-[11px] ml-5">
            <Users className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col items-start self-stretch ml-5">
            <span className="text-[#222222] text-2xl font-bold">
              {stats?.users.total ?? '—'}
            </span>
          </div>
          <div className="self-stretch ml-5">
            <div className="flex flex-col items-start self-stretch pt-0.5">
              <span className="text-[#6A6A6A] text-xs">Người dùng</span>
            </div>
            <div className="flex flex-col items-start self-stretch">
              <span className="text-[#929292] text-xs">
                +{stats?.users.newThisMonth ?? 0} tháng này · {stats?.users.active ?? 0} đang hoạt động
              </span>
            </div>
          </div>
        </div>

        {/* Properties card */}
        <div className="flex flex-1 flex-col items-start bg-white py-5 pr-[21px] mr-[17px] rounded-[14px] border border-solid border-[#DDDDDD]">
          <div className="flex items-center gap-3 px-3 py-2 bg-[#FFF546] rounded-[10px] mb-[11px] ml-[21px]">
            <Building2 className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col items-start self-stretch pt-[11px] ml-[21px]">
            <span className="text-[#222222] text-2xl font-bold">
              {stats?.properties.total ?? '—'}
            </span>
          </div>
          <div className="self-stretch ml-[21px]">
            <div className="flex flex-col items-start self-stretch pt-0.5">
              <span className="text-[#6A6A6A] text-xs">Tin đăng</span>
            </div>
            <div className="flex flex-col items-start self-stretch">
              <span className="text-[#929292] text-xs">
                {stats?.properties.byStatus?.available ?? 0} trống · {stats?.properties.byStatus?.rented ?? 0} đang thuê
              </span>
            </div>
          </div>
        </div>

        {/* Revenue card */}
        <div className="flex flex-1 flex-col items-start bg-white py-5 pr-[21px] rounded-[14px] border border-solid border-[#DDDDDD]">
          <div className="flex items-center gap-3 px-3 py-2 bg-[#FFF546] rounded-[10px] mb-[11px] ml-[21px]">
            <CreditCard className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col items-start self-stretch pt-[11px] ml-[21px]">
            <span className="text-[#222222] text-2xl font-bold">
              {stats ? fmt(stats.revenue.thisMonth) : '—'}
            </span>
          </div>
          <div className="self-stretch ml-[21px]">
            <div className="flex flex-col items-start self-stretch pt-0.5">
              <span className="text-[#6A6A6A] text-xs">Doanh thu tháng này</span>
            </div>
            <div className="flex flex-col items-start self-stretch">
              {growth !== null && growth !== undefined ? (
                <div className="flex items-center gap-0.5">
                  {isPositive
                    ? <TrendingUp className={cn('w-3 h-3 text-[#16a34a]')} />
                    : <TrendingDown className={cn('w-3 h-3 text-[#c13515]')} />}
                  <span className={cn('text-xs', isPositive ? 'text-[#16a34a]' : 'text-[#c13515]')}>
                    {isPositive ? '+' : ''}{growth}% so với tháng trước
                  </span>
                </div>
              ) : (
                <span className="text-[#929292] text-xs">Tổng: {stats ? fmt(stats.revenue.total) : '—'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {hasPending && (
        <div className="flex flex-col self-stretch bg-white p-5 mb-[33px] gap-[15px] rounded-[14px] border border-solid border-[#FF5E00]">
          <div className="flex items-center self-stretch gap-[7px]">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[#222222] text-sm font-bold">Cần xử lý ngay</span>
          </div>
          <div className="flex items-center self-stretch gap-[13px]">
            {(pending?.payouts ?? 0) > 0 && (
              <div className="flex shrink-0 items-center bg-[#F7F7F7] py-3 rounded-[10px]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF5E00] text-white text-xs font-bold mx-3">
                  {pending?.payouts}
                </div>
                <div className="flex flex-col shrink-0 mr-[171px]">
                  <span className="text-[#222222] text-xs font-bold">Chờ payout</span>
                  <span className="text-[#6A6A6A] text-xs">Chủ trọ & provider</span>
                </div>
              </div>
            )}
            {(pending?.unassignedServiceOrders ?? 0) > 0 && (
              <div className="flex shrink-0 items-center bg-[#F7F7F7] py-3 rounded-[10px]">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2683EB] text-white text-xs font-bold mx-3">
                  {pending?.unassignedServiceOrders}
                </div>
                <div className="flex flex-col shrink-0 mr-[202px]">
                  <span className="text-[#222222] text-xs font-bold">Chưa assign</span>
                  <span className="text-[#6A6A6A] text-xs">Đơn dịch vụ</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Booking snapshot */}
      {stats && stats.bookings.total > 0 && (
        <div className="flex flex-col self-stretch bg-white p-5 mb-8 gap-[15px] rounded-[14px] border border-solid border-[#DDDDDD]">
          <div className="flex flex-col items-start self-stretch">
            <span className="text-[#222222] text-sm font-bold">Booking</span>
          </div>
          <div className="flex items-center self-stretch gap-1.5">
            {Object.entries(stats.bookings.byStatus)
              .sort(([a], [b]) => {
                const order = ['active', 'confirmed', 'pending', 'completed', 'cancelled', 'rejected'];
                return order.indexOf(a) - order.indexOf(b);
              })
              .map(([status, count]) => (
                <div key={status} className="flex items-center gap-1.5 mr-4">
                  <span className={cn('text-xs', status === 'active' ? 'text-green-600' : STATUS_COLOR_TEXT[status] ?? 'text-[#6A6A6A]')}>
                    {BOOKING_STATUS_LABELS[status] ?? status}
                  </span>
                  <span className="text-[#222222] text-sm font-bold">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="flex items-center self-stretch">
        {[
          {
            label: 'Quản lý người dùng',
            desc: 'Kích hoạt/Vô hiệu hoá tài khoản',
            href: '/admin/users',
            icon: Users,
            iconBg: 'bg-black',
          },
          {
            label: 'Quản lý tin đăng',
            desc: 'Nổi bật và trạng thái property',
            href: '/admin/properties',
            icon: Building2,
            iconBg: 'bg-black',
          },
          {
            label: 'Giao dịch & Payout',
            desc: 'Xử lý payout và hoàn tiền',
            href: '/admin/transactions',
            icon: CreditCard,
            iconBg: 'bg-black',
          },
        ].map(({ label, desc, href, icon: Icon, iconBg }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-1 items-center bg-white py-[21px] px-5 mr-4 gap-4 rounded-[14px] border border-solid border-[#DDDDDD] hover:border-[#ff385c] hover:shadow-[0_2px_12px_rgba(255,56,92,0.08)] transition-all group"
          >
            <div className={cn('flex items-center justify-center w-10 h-10 rounded-[10px] shrink-0', iconBg)}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-1 flex-col gap-[1px]">
              <div className="flex flex-col items-start self-stretch">
                <span className="text-[#222222] text-sm font-bold">{label}</span>
              </div>
              <div className="flex flex-col items-start self-stretch">
                <span className="text-[#6A6A6A] text-xs">{desc}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#929292] group-hover:text-[#ff385c] transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
