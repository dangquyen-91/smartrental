'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Building2, ArrowRight, CalendarCheck,
  TrendingUp, TrendingDown, AlertCircle,
  DollarSign, Wallet, ClipboardList,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  PieChart as RePieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, XAxis, YAxis,
} from 'recharts';
import {
  useAdminDashboard,
  useAdminRevenueAnalytics,
  useAdminUserAnalytics,
  useAdminBookingAnalytics,
} from '@/hooks/use-admin';
import type { Period } from '@/lib/api/admin.api';
import { cn } from '@/lib/utils';

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
const fmtCompact = (n: number) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

const TIME_FILTERS: { label: string; value: Period }[] = [
  { label: '7 ngày',  value: '7d'  },
  { label: '30 ngày', value: '30d' },
  { label: '90 ngày', value: '90d' },
  { label: '1 năm',   value: '1y'  },
];

// ── Mount guard ───────────────────────────────────────────────────────────────
function useMounted() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return ready;
}

function ChartWrapper({ children, minH = 120 }: { children: React.ReactNode; minH?: number }) {
  const ready = useMounted();
  if (!ready) return <div className="w-full animate-pulse bg-[#f4f5f7] rounded-xl" style={{ minHeight: minH }} />;
  return <>{children}</>;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-[#f0f1f3] rounded-lg', className)} />;
}

function KpiSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e5ea] p-5 flex flex-col gap-3 shadow-sm">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-28 h-7" />
      </div>
      <Skeleton className="w-full h-3" />
      <Skeleton className="w-16 h-5" />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  bg: string;
  trend?: number | null;
  footer?: React.ReactNode;
}

function KpiCard({ icon: Icon, label, value, sub, accent, bg, trend, footer }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e5ea] p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div>
        <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-[#222] mt-0.5">{value}</p>
      </div>
      {sub && <p className="text-xs text-[#6a6a6a]">{sub}</p>}
      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1.5">
          {trend >= 0
            ? <TrendingUp className="w-3.5 h-3.5 text-[#16a34a]" />
            : <TrendingDown className="w-3.5 h-3.5 text-[#ef4444]" />}
          <span className={cn(
            'text-xs font-bold px-1.5 py-0.5 rounded-md',
            trend >= 0 ? 'text-[#16a34a] bg-[#f0fdf4]' : 'text-[#ef4444] bg-red-50',
          )}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          <span className="text-xs text-[#9ca3af]">kỳ trước</span>
        </div>
      )}
      {footer && <div className="pt-2 border-t border-[#f4f5f7]">{footer}</div>}
    </div>
  );
}

// ── Auth Provider Bar ─────────────────────────────────────────────────────────
const PROVIDER_COLORS: Record<string, string> = {
  google: '#4285f4', email: '#16a34a', facebook: '#1877f2', phone: '#f59e0b', local: '#6b7280',
};
const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google', email: 'Email', facebook: 'Facebook', phone: 'Điện thoại', local: 'Local',
};

function AuthProviderBar({ distribution }: { distribution: Record<string, number> }) {
  const entries = Object.entries(distribution).filter(([, v]) => v > 0);
  if (!entries.length) return null;
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-[#9ca3af]">Nguồn đăng ký</span>
      <div className="h-1.5 rounded-full overflow-hidden flex bg-[#f4f5f7]">
        {entries.map(([k, v]) => (
          <div key={k} className="h-full transition-all duration-500"
            style={{ width: `${(v / total) * 100}%`, background: PROVIDER_COLORS[k] ?? '#ccc' }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {entries.map(([k, v]) => (
          <span key={k} className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
            <span className="w-2 h-2 rounded-full" style={{ background: PROVIDER_COLORS[k] ?? '#ccc' }} />
            {PROVIDER_LABELS[k] ?? k}: <span className="font-semibold text-[#6a6a6a]">{((v / total) * 100).toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Revenue Gauge ─────────────────────────────────────────────────────────────
function RevenueGauge({ value, target }: { value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const r = 44;
  const circ = Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const tipX = 10 + 44 * (1 - Math.cos((pct / 100) * Math.PI));
  const tipY = 62 - 44 * Math.sin((pct / 100) * Math.PI);
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex items-center justify-center">
        <svg width="96" height="64" viewBox="0 0 116 78" className="-rotate-90">
          <path d="M 14 64 A 44 44 0 0 1 102 64" fill="none" stroke="#f0f1f3" strokeWidth="12" strokeLinecap="round" />
          <path d="M 14 64 A 44 44 0 0 1 102 64" fill="none" stroke="#ff385c" strokeWidth="12"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-700" />
          {pct > 0 && <circle r="6" fill="#ff385c" cx={tipX} cy={tipY} />}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-3">
          <span className="text-sm font-bold text-[#222]">{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] text-[#9ca3af]">đạt mục tiêu tháng</p>
        {target > 0 && (
          <p className="text-[10px] text-[#6a6a6a] mt-0.5">
            Mục tiêu: <span className="font-semibold">{fmt(target)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Booking Doughnut ──────────────────────────────────────────────────────────
const BOOKING_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', active: '#16a34a',
  completed: '#16a34a', cancelled: '#ef4444', rejected: '#f59e0b',
};
const BOOKING_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt', confirmed: 'Đã xác nhận', active: 'Đang thuê',
  completed: 'Hoàn thành', cancelled: 'Đã hủy', rejected: 'Từ chối',
};

function BookingDoughnut({ byStatus, cancellationByActor }: {
  byStatus: Record<string, number>;
  cancellationByActor?: Record<string, number>;
}) {
  const data = Object.entries(byStatus).filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));
  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-center">
        <CalendarCheck className="w-8 h-8 text-[#e2e5ea] mb-2" />
        <p className="text-sm text-[#9ca3af]">Chưa có booking</p>
      </div>
    );
  }

  return (
    <ChartWrapper minH={144}>
      <div className="flex items-center gap-5">
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width={144} height={144}>
            <RePieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={44} outerRadius={64}
                paddingAngle={3} dataKey="value" strokeWidth={0}>
                {data.map(e => <Cell key={e.name} fill={BOOKING_COLORS[e.name] ?? '#ccc'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e5ea', borderRadius: 10, fontSize: 12 }}
                formatter={((v: number, n: string) => [v, BOOKING_LABELS[n] ?? n]) as never} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-[#222]">{total}</span>
            <span className="text-[10px] text-[#9ca3af]">booking</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {data.map(({ name, value }) => (
            <div key={name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BOOKING_COLORS[name] ?? '#ccc' }} />
              <span className="text-xs text-[#6a6a6a] flex-1 truncate">{BOOKING_LABELS[name] ?? name}</span>
              <span className="text-xs font-semibold text-[#222]">{value}</span>
              <span className="text-[10px] text-[#9ca3af] w-10 text-right">
                {total > 0 ? ((value / total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          ))}
          {cancellationByActor && (byStatus['cancelled'] ?? 0) > 0 && (
            <div className="mt-1 pt-2 border-t border-[#f4f5f7]">
              <p className="text-[10px] text-[#ef4444] font-medium mb-1">Hủy bởi:</p>
              {Object.entries(cancellationByActor).map(([actor, count]) => (
                <p key={actor} className="text-[10px] text-[#9ca3af] pl-2">
                  {actor === 'tenant' ? 'Khách' : 'Chủ trọ'}: {count}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </ChartWrapper>
  );
}

// ── Booking Trend ─────────────────────────────────────────────────────────────
type TrendGran = 'day' | 'week' | 'month';

function BookingTrend({ timeline }: {
  timeline: Array<{ _id: string; completed: number; cancelled: number }>;
}) {
  const [gran, setGran] = useState<TrendGran>('week');

  const chartData = (() => {
    if (!timeline.length) return [];
    if (gran === 'day') return timeline.map(d => ({
      label: `${new Date(d._id).getDate()}/${new Date(d._id).getMonth() + 1}`,
      completed: d.completed ?? 0, cancelled: d.cancelled ?? 0,
    }));
    if (gran === 'week') {
      const weeks: { label: string; completed: number; cancelled: number }[] = [];
      for (let i = 0; i < timeline.length; i += 7) {
        const chunk = timeline.slice(i, i + 7);
        if (!chunk.length) continue;
        const s = new Date(chunk[0]._id), e = new Date(chunk[chunk.length - 1]._id);
        weeks.push({
          label: `${s.getDate()}/${s.getMonth() + 1}–${e.getDate()}/${e.getMonth() + 1}`,
          completed: chunk.reduce((a, d) => a + (d.completed ?? 0), 0),
          cancelled: chunk.reduce((a, d) => a + (d.cancelled ?? 0), 0),
        });
      }
      return weeks.filter(w => w.completed > 0 || w.cancelled > 0);
    }
    const byMonth: Record<string, { completed: number; cancelled: number }> = {};
    for (const d of timeline) {
      const dt = new Date(d._id);
      const key = `${dt.getMonth() + 1}/${dt.getFullYear()}`;
      if (!byMonth[key]) byMonth[key] = { completed: 0, cancelled: 0 };
      byMonth[key].completed += d.completed ?? 0;
      byMonth[key].cancelled += d.cancelled ?? 0;
    }
    return Object.entries(byMonth).map(([label, v]) => ({ label, ...v }));
  })();

  if (!chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-center">
        <p className="text-sm text-[#9ca3af]">Chưa có dữ liệu trong kỳ này</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 bg-[#f4f5f7] rounded-xl p-1 w-fit">
        {(['day', 'week', 'month'] as TrendGran[]).map(v => (
          <button key={v} onClick={() => setGran(v)}
            className={cn('px-3 py-1 rounded-lg text-xs font-semibold transition-all',
              gran === v ? 'bg-white text-[#222] shadow-sm' : 'text-[#9ca3af] hover:text-[#6a6a6a]')}>
            {v === 'day' ? 'Ngày' : v === 'week' ? 'Tuần' : 'Tháng'}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4 text-[10px] text-[#9ca3af]">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#16a34a] rounded" /> Hoàn thành</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#ef4444] rounded" /> Hủy</span>
      </div>
      <ChartWrapper minH={140}>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e5ea', borderRadius: 10, fontSize: 12 }}
              formatter={((v: number, n: string) => [v, n === 'completed' ? 'Hoàn thành' : 'Đã hủy']) as never} />
            <Line type="monotone" dataKey="completed" stroke="#16a34a" strokeWidth={2.5}
              dot={{ r: 3, fill: '#16a34a', strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2.5}
              dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
}

// ── Revenue Bar Chart ─────────────────────────────────────────────────────────
function RevenueChart({ data }: { data: { date: string; booking: number; service: number }[] }) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <DollarSign className="w-8 h-8 text-[#e2e5ea] mb-2" />
        <p className="text-sm text-[#9ca3af]">Chưa có doanh thu trong kỳ này</p>
      </div>
    );
  }
  return (
    <ChartWrapper minH={160}>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis dataKey="date" axisLine={false} tickLine={false}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickFormatter={(v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
          <YAxis hide />
          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e5ea', borderRadius: 10, fontSize: 12 }}
            formatter={((v: number, n: string) => [`${v}M VND`, n === 'booking' ? 'Booking Fee' : 'Service Fee']) as never} />
          <Bar dataKey="booking" stackId="a" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="service" stackId="a" fill="#f59e0b" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ── Top Landlords ─────────────────────────────────────────────────────────────
interface Landlord { landlordId: string; name: string; email: string; avatar?: string; totalPayout: number; bookingCount: number }
const MEDAL = ['🥇', '🥈', '🥉'];
const MEDAL_STYLE = [
  { color: '#f59e0b', bg: '#fffbeb' },
  { color: '#9ca3af', bg: '#f9fafb' },
  { color: '#b45309', bg: '#fef3c7' },
];

function TopLandlords({ landlords }: { landlords: Landlord[] }) {
  if (!landlords.length) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <p className="text-sm text-[#9ca3af]">Chưa có dữ liệu</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      {landlords.slice(0, 5).map((l, i) => (
        <div key={l.landlordId} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[#f9fafb] transition-colors">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
            style={i < 3 ? { background: MEDAL_STYLE[i].bg, color: MEDAL_STYLE[i].color } : { background: '#f4f5f7', color: '#6a6a6a' }}>
            {i < 3 ? MEDAL[i] : i + 1}
          </div>
          {l.avatar
            ? <img src={l.avatar} alt={l.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
            : <div className="w-7 h-7 rounded-full bg-[#fff0f3] text-[#ff385c] text-xs font-bold flex items-center justify-center shrink-0">
                {l.name.charAt(0).toUpperCase()}
              </div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#222] truncate">{l.name}</p>
            <p className="text-[10px] text-[#9ca3af] truncate">{l.email}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[#ff385c]">{l.bookingCount}</p>
            <p className="text-[10px] text-[#9ca3af]">đặt thuê</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [period, setPeriod] = useState<Period>('30d');

  const { data: dashData, isLoading: dashLoading }       = useAdminDashboard();
  const { data: revenueData, isLoading: revLoading }     = useAdminRevenueAnalytics(period);
  const { data: userAnalytics, isLoading: userLoading }  = useAdminUserAnalytics(period);
  const { data: bookingAnalytics, isLoading: bkLoading } = useAdminBookingAnalytics(period);

  const isLoading = dashLoading || revLoading || userLoading || bkLoading;
  const stats     = dashData?.data;
  const pending   = stats?.pendingActions;
  const hasPending = pending && (pending.payouts > 0 || pending.refunds > 0 || pending.unassignedServiceOrders > 0);
  const revenueTarget = (stats?.revenue.lastMonth ?? 0) * 1.1;

  const revenueTrend = (revenueData?.data?.timeline ?? []).slice(-14).map(r => ({
    date: r.date,
    booking: Math.round((r.booking?.fee ?? 0) / 1_000_000 * 10) / 10,
    service: Math.round((r.service?.fee ?? 0) / 1_000_000 * 10) / 10,
  }));

  const bookingTimeline = bookingAnalytics?.data?.timeline ?? [];
  const cancellationByActor = bookingAnalytics?.data?.summary?.cancellationByActor as Record<string, number> | undefined;
  const topLandlords = userAnalytics?.data?.topLandlords ?? [];
  const authDist = userAnalytics?.data?.distribution?.byAuthProvider ?? {};
  const completionRate = bookingAnalytics?.data?.summary?.completionRate ?? 0;
  const avgDuration = bookingAnalytics?.data?.summary?.avgDurationMonths;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#222]">Tổng quan hệ thống</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">Dữ liệu thực — cập nhật liên tục</p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-[#e2e5ea] rounded-panel p-1">
          {TIME_FILTERS.map(({ label, value }) => (
            <button key={value} onClick={() => setPeriod(value)}
              className={cn('px-4 py-1.5 rounded-panel text-xs font-semibold transition-all',
                period === value ? 'bg-[#222] text-white' : 'text-[#9ca3af] hover:text-[#222]')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pending alerts — ưu tiên cao nhất ── */}
      {hasPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-sm font-semibold text-amber-700">Cần xử lý ngay</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {(pending?.payouts ?? 0) > 0 && (
              <Link href="/admin/transactions"
                className="flex items-center gap-2.5 bg-white border border-amber-200 rounded-xl px-4 py-2.5 hover:border-amber-400 transition-colors shadow-sm">
                <Wallet className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm font-bold text-[#222]">{pending?.payouts}</span>
                <span className="text-xs text-[#9ca3af]">payout chờ giải ngân</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#9ca3af]" />
              </Link>
            )}
            {(pending?.unassignedServiceOrders ?? 0) > 0 && (
              <Link href="/admin/services"
                className="flex items-center gap-2.5 bg-white border border-amber-200 rounded-xl px-4 py-2.5 hover:border-amber-400 transition-colors shadow-sm">
                <ClipboardList className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm font-bold text-[#222]">{pending?.unassignedServiceOrders}</span>
                <span className="text-xs text-[#9ca3af]">đơn dịch vụ chưa assign</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#9ca3af]" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          <>{[0,1,2,3].map(i => <KpiSkeleton key={i} />)}</>
        ) : (<>
          <KpiCard
            icon={Users} label="Người dùng"
            value={fmtCompact(stats?.users.total ?? 0)}
            sub={`+${stats?.users.newThisMonth ?? 0} tháng này · ${stats?.users.active ?? 0} hoạt động`}
            accent="#3b82f6" bg="#eff6ff"
            trend={stats?.users.total
              ? Math.round(((stats.users.newThisMonth ?? 0) / Math.max(1, stats.users.total)) * 100)
              : null}
            footer={<AuthProviderBar distribution={authDist} />}
          />
          <KpiCard
            icon={Building2} label="Tin đăng"
            value={fmtCompact(stats?.properties.total ?? 0)}
            sub={`${stats?.properties.byStatus?.available ?? 0} trống · ${stats?.properties.byStatus?.rented ?? 0} đang thuê`}
            accent="#16a34a" bg="#f0fdf4"
            trend={null}
            footer={
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                  Lấp đầy: <span className="font-semibold text-[#6a6a6a] ml-0.5">{completionRate}%</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  TB thuê: <span className="font-semibold text-[#6a6a6a] ml-0.5">{avgDuration ? `${avgDuration}T` : '—'}</span>
                </span>
              </div>
            }
          />
          <KpiCard
            icon={CalendarCheck} label="Booking"
            value={fmtCompact(stats?.bookings.total ?? 0)}
            sub={`${stats?.bookings.byStatus?.pending ?? 0} chờ duyệt · ${stats?.bookings.byStatus?.active ?? 0} đang thuê`}
            accent="#f59e0b" bg="#fffbeb"
            trend={null}
            footer={
              stats?.bookings.total ? (
                <div className="flex items-center gap-2">
                  {Object.entries(stats.bookings.byStatus ?? {}).filter(([, v]) => v > 0).slice(0, 3).map(([s, v]) => (
                    <span key={s} className="text-[10px] text-[#9ca3af]">
                      <span className="font-semibold text-[#6a6a6a]">{v}</span> {
                        s === 'completed' ? 'hoàn thành' : s === 'cancelled' ? 'hủy' : s === 'rejected' ? 'từ chối' : s
                      }
                    </span>
                  ))}
                </div>
              ) : undefined
            }
          />
          <KpiCard
            icon={DollarSign} label="Doanh thu tháng"
            value={stats ? fmt(stats.revenue.thisMonth) : '—'}
            sub={`Tổng tích lũy: ${stats ? fmt(stats.revenue.total) : '—'}`}
            accent="#ff385c" bg="#fff0f3"
            trend={stats?.revenue.growth ?? null}
            footer={<RevenueGauge value={stats?.revenue.thisMonth ?? 0} target={revenueTarget} />}
          />
        </>)}
      </div>

      {/* ── Booking: Doughnut + Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e5ea] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-[#222]">Phân bổ Booking</p>
              <p className="text-xs text-[#9ca3af]">Theo trạng thái</p>
            </div>
            <Link href="/admin/transactions"
              className="flex items-center gap-1 text-xs text-[#9ca3af] hover:text-[#ff385c] transition-colors">
              Chi tiết <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading
            ? <Skeleton className="h-36 w-full" />
            : <BookingDoughnut byStatus={stats?.bookings.byStatus ?? {}} cancellationByActor={cancellationByActor} />}
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#e2e5ea] p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-bold text-[#222]">Xu hướng Booking</p>
            <p className="text-xs text-[#9ca3af]">Hoàn thành vs Hủy theo thời gian</p>
          </div>
          {isLoading
            ? <Skeleton className="h-36 w-full" />
            : <BookingTrend timeline={bookingTimeline} />}
        </div>
      </div>

      {/* ── Revenue chart + Top Landlords ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#e2e5ea] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-[#222]">Doanh thu theo ngày</p>
              <p className="text-xs text-[#9ca3af]">Booking fee + Service fee</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-[#9ca3af]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" /> Booking</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" /> Service</span>
            </div>
          </div>
          {isLoading ? <Skeleton className="h-40 w-full" /> : <RevenueChart data={revenueTrend} />}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e5ea] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-[#222]">Top Chủ trọ</p>
              <p className="text-xs text-[#9ca3af]">Theo số booking hoàn thành</p>
            </div>
            <Link href="/admin/users"
              className="flex items-center gap-1 text-xs text-[#9ca3af] hover:text-[#ff385c] transition-colors">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? <Skeleton className="h-40 w-full" /> : <TopLandlords landlords={topLandlords} />}
        </div>
      </div>

    </div>
  );
}
