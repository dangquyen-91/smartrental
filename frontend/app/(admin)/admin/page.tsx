'use client';

import Link from 'next/link';
import {
  Users, Building2, CreditCard, ArrowRight,
  TrendingUp, TrendingDown, AlertCircle, Loader2,
  CheckCircle2, RefreshCw, Package,
} from 'lucide-react';
import { useAdminDashboard } from '@/hooks/use-admin';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  confirmed: 'Đã xác nhận',
  active: 'Đang thuê',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
  rejected: 'Từ chối',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-[#ca8a04]',
  confirmed: 'text-[#2563eb]',
  active: 'text-[#16a34a]',
  completed: 'text-[#6a6a6a]',
  cancelled: 'text-[#c13515]',
  rejected: 'text-[#929292]',
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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#222222]">Tổng quan hệ thống</h1>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="bg-white rounded-card border border-[#dddddd] p-5 hover:border-[#ff385c] transition-colors group"
        >
          <div className="w-10 h-10 rounded-[10px] bg-[#fff0f3] flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-[#ff385c]" />
          </div>
          <p className="text-2xl font-bold text-[#222222]">{stats?.users.total ?? '—'}</p>
          <p className="text-xs font-medium text-[#6a6a6a] mt-0.5">Người dùng</p>
          <p className="text-xs text-[#929292]">
            +{stats?.users.newThisMonth ?? 0} tháng này · {stats?.users.active ?? 0} đang hoạt động
          </p>
        </Link>

        <Link
          href="/admin/properties"
          className="bg-white rounded-card border border-[#dddddd] p-5 hover:border-[#ff385c] transition-colors group"
        >
          <div className="w-10 h-10 rounded-[10px] bg-[#eff6ff] flex items-center justify-center mb-3">
            <Building2 className="w-5 h-5 text-[#2563eb]" />
          </div>
          <p className="text-2xl font-bold text-[#222222]">{stats?.properties.total ?? '—'}</p>
          <p className="text-xs font-medium text-[#6a6a6a] mt-0.5">Tin đăng</p>
          <p className="text-xs text-[#929292]">
            {stats?.properties.byStatus?.available ?? 0} trống ·{' '}
            {stats?.properties.byStatus?.rented ?? 0} đang thuê
          </p>
        </Link>

        <Link
          href="/admin/transactions"
          className="bg-white rounded-card border border-[#dddddd] p-5 hover:border-[#ff385c] transition-colors group"
        >
          <div className="w-10 h-10 rounded-[10px] bg-[#f0fdf4] flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5 text-[#16a34a]" />
          </div>
          <p className="text-2xl font-bold text-[#222222]">
            {stats ? fmt(stats.revenue.thisMonth) : '—'}
          </p>
          <p className="text-xs font-medium text-[#6a6a6a] mt-0.5">Doanh thu tháng này</p>
          {growth !== null && growth !== undefined ? (
            <p className={`text-xs flex items-center gap-0.5 mt-0.5 ${isPositive ? 'text-[#16a34a]' : 'text-[#c13515]'}`}>
              {isPositive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{growth}% so với tháng trước
            </p>
          ) : (
            <p className="text-xs text-[#929292]">
              Tổng: {stats ? fmt(stats.revenue.total) : '—'}
            </p>
          )}
        </Link>
      </div>

      {/* Pending Actions */}
      {hasPending && (
        <div className="bg-white rounded-card border border-[#ff385c] p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-[#ff385c]" />
            <p className="text-sm font-semibold text-[#222222]">Cần xử lý ngay</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(pending?.payouts ?? 0) > 0 && (
              <Link
                href="/admin/transactions?tab=payouts"
                className="flex items-center gap-3 p-3 rounded-[10px] bg-[#f7f7f7] hover:bg-[#fff0f3] transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-[#ff385c] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {pending?.payouts}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#222222]">Chờ payout</p>
                  <p className="text-xs text-[#6a6a6a]">Chủ trọ & provider</p>
                </div>
              </Link>
            )}
            {(pending?.refunds ?? 0) > 0 && (
              <Link
                href="/admin/transactions?tab=refunds"
                className="flex items-center gap-3 p-3 rounded-[10px] bg-[#f7f7f7] hover:bg-[#fff0f3] transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-[#e00b41] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {pending?.refunds}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#222222]">Chờ hoàn tiền</p>
                  <p className="text-xs text-[#6a6a6a]">Booking đã huỷ</p>
                </div>
              </Link>
            )}
            {(pending?.unassignedServiceOrders ?? 0) > 0 && (
              <Link
                href="/admin/transactions"
                className="flex items-center gap-3 p-3 rounded-[10px] bg-[#f7f7f7] hover:bg-[#fff0f3] transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-[#ca8a04] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {pending?.unassignedServiceOrders}
                </span>
                <div>
                  <p className="text-xs font-semibold text-[#222222]">Chưa assign</p>
                  <p className="text-xs text-[#6a6a6a]">Đơn dịch vụ</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Booking status snapshot */}
      {stats && stats.bookings.total > 0 && (
        <div className="bg-white rounded-card border border-[#dddddd] p-5">
          <p className="text-sm font-semibold text-[#222222] mb-4">
            Booking — {stats.bookings.total} tổng
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {Object.entries(stats.bookings.byStatus)
              .sort(([a], [b]) => {
                const order = ['active', 'confirmed', 'pending', 'completed', 'cancelled', 'rejected'];
                return order.indexOf(a) - order.indexOf(b);
              })
              .map(([status, count]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium ${STATUS_COLOR[status] ?? 'text-[#6a6a6a]'}`}>
                    {STATUS_LABEL[status] ?? status}
                  </span>
                  <span className="text-sm font-bold text-[#222222]">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Quản lý người dùng',
            desc: 'Kích hoạt / vô hiệu hoá tài khoản',
            href: '/admin/users',
            icon: Users,
          },
          {
            label: 'Quản lý tin đăng',
            desc: 'Nổi bật và trạng thái property',
            href: '/admin/properties',
            icon: Building2,
          },
          {
            label: 'Giao dịch & Payout',
            desc: 'Xử lý payout và hoàn tiền',
            href: '/admin/transactions',
            icon: CreditCard,
          },
        ].map(({ label, desc, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-card border border-[#dddddd] p-5 hover:border-[#ff385c] hover:shadow-[0_2px_12px_rgba(255,56,92,0.08)] transition-all group"
          >
            <div className="w-10 h-10 rounded-[10px] bg-[#f7f7f7] flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-[#929292] group-hover:text-[#ff385c] transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#222222]">{label}</p>
              <p className="text-xs text-[#6a6a6a] mt-0.5">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#929292] group-hover:text-[#ff385c] transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
