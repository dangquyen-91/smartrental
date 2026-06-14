'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Building2, ArrowRight,
  TrendingUp, TrendingDown, AlertCircle, Loader2,
  BarChart3, DollarSign, PieChart,
  UserPlus, Building, Wallet, ClipboardList, Award,
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
import type { Period, Granularity } from '@/lib/api/admin.api';
import { cn } from '@/lib/utils';

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

const fmtCompact = (n: number) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

const TIME_FILTERS: { label: string; value: Period }[] = [
  { label: '7 ngày', value: '7d' },
  { label: '30 ngày', value: '30d' },
  { label: '90 ngày', value: '90d' },
  { label: '1 năm',   value: '1y' },
];

// ── Mount guard — prevents Recharts SSR width/height issues ──────────────────
function useMounted() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return ready;
}

function ChartWrapper({ children, minH = 100 }: { children: React.ReactNode; minH?: number }) {
  const ready = useMounted();
  if (!ready) return <div className="w-full" style={{ minHeight: minH }} />;
  return <>{children}</>;
}

// ── Revenue Gauge ──────────────────────────────────────────────────────────────
function RevenueGauge({ value, target }: { value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const r = 44;
  const circumference = Math.PI * r;
  const dashOffset = circumference - (pct / 100) * circumference;
  const tipX = 10 + 44 * (1 - Math.cos((pct / 100) * Math.PI));
  const tipY = 62 - 44 * Math.sin((pct / 100) * Math.PI);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center py-2">
        <svg width="116" height="78" viewBox="0 0 116 78" className="-rotate-90">
          <path d="M 14 64 A 44 44 0 0 1 102 64" fill="none" stroke="#f0e8ea" strokeWidth="12" strokeLinecap="round" />
          <path
            d="M 14 64 A 44 44 0 0 1 102 64"
            fill="none"
            stroke="#ff385c"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700"
          />
          {pct > 0 && (
            <circle r="6" fill="#ff385c" cx={tipX} cy={tipY}>
              <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
          {pct > 0 && (
            <circle r="10" fill="#ff385c" opacity="0.2" cx={tipX} cy={tipY}>
              <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-base font-bold text-[#222]">{pct.toFixed(0)}%</span>
          <span className="text-[9px] text-[#9ca3af]">đạt mục tiêu</span>
        </div>
      </div>
      {target > 0 && (
        <p className="text-[10px] text-[#9ca3af]">
          Mục tiêu: <span className="font-semibold text-[#6a6a6a]">{fmt(target)}</span>
        </p>
      )}
    </div>
  );
}

// ── Auth Provider Distribution Bar ────────────────────────────────────────────
function AuthProviderBar({ distribution }: {
  distribution: Record<string, number>;
}) {
  const entries = Object.entries(distribution).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, v]) => s + v, 0);

  const PROVIDER_COLORS: Record<string, string> = {
    google: '#428bff',
    email: '#16a34a',
    facebook: '#1877f2',
    phone: '#f59e0b',
  };
  const PROVIDER_LABELS: Record<string, string> = {
    google: 'Google',
    email: 'Email',
    facebook: 'Facebook',
    phone: 'Điện thoại',
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#9ca3af]">Nguồn đăng nhập</span>
        <div className="flex items-center gap-2">
          {entries.map(([provider]) => (
            <span key={provider} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: PROVIDER_COLORS[provider] ?? '#ccc' }} />
              <span className="text-[10px] text-[#6a6a6a]">{PROVIDER_LABELS[provider] ?? provider}</span>
            </span>
          ))}
        </div>
      </div>
      {/* Stacked progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden flex bg-[#f4f5f7]">
        {entries.map(([provider, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div
              key={provider}
              className="h-full transition-all duration-500"
              style={{ width: `${pct}%`, background: PROVIDER_COLORS[provider] ?? '#ccc' }}
              title={`${PROVIDER_LABELS[provider] ?? provider}: ${pct.toFixed(0)}%`}
            />
          );
        })}
      </div>
      <div className="flex gap-3">
        {entries.map(([provider, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <span key={provider} className="text-[10px] text-[#9ca3af]">
              <span className="font-semibold text-[#6a6a6a]">{PROVIDER_LABELS[provider] ?? provider}</span>: {pct.toFixed(0)}%
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── KPI Card với footer slot ────────────────────────────────────────────────────
interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  bg: string;
  trend?: number;
  right?: React.ReactNode;
  footer?: React.ReactNode;
}

function KpiCard({ icon: Icon, label, value, sub, accent, bg, trend, right, footer }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e5ea] p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
            <Icon className="w-5 h-5" style={{ color: accent }} />
          </div>
          <div>
            <p className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-[#222] mt-0.5">{value}</p>
          </div>
          {sub && <p className="text-xs text-[#6a6a6a] leading-relaxed">{sub}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1.5">
              {trend >= 0
                ? <TrendingUp className="w-3.5 h-3.5 text-[#16a34a]" />
                : <TrendingDown className="w-3.5 h-3.5 text-[#ef4444]" />}
              <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-md', trend >= 0 ? 'text-[#16a34a] bg-[#f0fdf4]' : 'text-[#ef4444] bg-red-50')}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              <span className="text-xs text-[#9ca3af]">kỳ trước</span>
            </div>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {footer && <div className="pt-1 border-t border-[#f4f5f7]">{footer}</div>}
    </div>
  );
}

// ── Booking Doughnut with Cancellation by Actor ─────────────────────────────────
const BOOKING_COLORS: Record<string, string> = {
  active:     '#16a34a',
  confirmed:  '#428bff',
  pending:    '#f59e0b',
  completed:  '#16a34a',
  cancelled:  '#ef4444',
  rejected:   '#f59e0b',
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending:   'Chờ duyệt',
  confirmed: 'Đã xác nhận',
  active:    'Đang thuê',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  rejected:  'Từ chối',
};

const CANCEL_ACTOR_LABELS: Record<string, string> = {
  tenant:    'Khách',
  landlord:  'Chủ trọ',
};

function BookingDoughnut({ stats, cancellationByActor }: {
  stats: { total: number; byStatus: Record<string, number> };
  cancellationByActor?: Record<string, number>;
}) {
  const data = Object.entries(stats.byStatus)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, label: BOOKING_STATUS_LABELS[name] ?? name }));

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  const cancelledCount = stats.byStatus['cancelled'] ?? 0;

  return (
    <ChartWrapper>
      <div className="flex items-center gap-6">
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={64}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={BOOKING_COLORS[entry.name] ?? '#ccc'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #e2e5ea',
                  borderRadius: 10,
                  fontSize: 12,
                  color: '#222',
                }}
                formatter={((value: number, name: string) => [value, BOOKING_STATUS_LABELS[name] ?? name]) as any}
              />
            </RePieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-[#222]">{total}</span>
            <span className="text-[10px] text-[#9ca3af]">booking</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          {data.map(({ name, value, label }) => {
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return (
              <div key={name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: BOOKING_COLORS[name] ?? '#ccc' }} />
                <span className="text-xs text-[#6a6a6a] flex-1 truncate">{label}</span>
                <span className="text-xs font-semibold text-[#222] shrink-0">{value}</span>
                <span className="text-[10px] text-[#9ca3af] w-10 text-right shrink-0">{pct}%</span>
              </div>
            );
          })}

          {/* Cancellation by Actor breakdown */}
          {cancelledCount > 0 && cancellationByActor && Object.keys(cancellationByActor).length > 0 && (
            <div className="mt-1 pt-2 border-t border-[#f4f5f7] flex flex-col gap-1">
              <span className="text-[10px] text-[#ef4444] font-medium">Hủy: {cancelledCount} ca</span>
              {Object.entries(cancellationByActor).map(([actor, count]) => (
                <div key={actor} className="flex items-center gap-2 pl-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] opacity-60 shrink-0" />
                  <span className="text-[10px] text-[#9ca3af]">{CANCEL_ACTOR_LABELS[actor] ?? actor}: {count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ChartWrapper>
  );
}

// ── Booking Trend with Day/Week/Month filter ────────────────────────────────────
type TrendGranularity = 'day' | 'week' | 'month';

function BookingTrend({ timeline }: {
  timeline: Array<{
    _id: string;
    completed: number;
    cancelled: number;
  }>;
}) {
  const [groupFilter, setGroupFilter] = useState<TrendGranularity>('week');

  const chartData: Array<{ label: string; completed: number; cancelled: number }> = (() => {
    if (timeline.length === 0) return [];

    if (groupFilter === 'day') {
      return timeline.map(d => {
        const date = new Date(d._id);
        return {
          label: `${date.getDate()}/${date.getMonth() + 1}`,
          completed: d.completed ?? 0,
          cancelled: d.cancelled ?? 0,
        };
      });
    }

    if (groupFilter === 'week') {
      const byWeek: Array<{ label: string; completed: number; cancelled: number }> = [];
      for (let i = 0; i < timeline.length; i += 7) {
        const chunk = timeline.slice(i, i + 7);
        if (!chunk.length) continue;
        const startDate = new Date(chunk[0]._id);
        const endDate = new Date(chunk[chunk.length - 1]._id);
        byWeek.push({
          label: `${startDate.getDate()}/${startDate.getMonth() + 1}–${endDate.getDate()}/${endDate.getMonth() + 1}`,
          completed: chunk.reduce((s, d) => s + (d.completed ?? 0), 0),
          cancelled: chunk.reduce((s, d) => s + (d.cancelled ?? 0), 0),
        });
      }
      return byWeek.filter(w => w.completed > 0 || w.cancelled > 0);
    }

    // month
    const byMonth: Record<string, { completed: number; cancelled: number }> = {};
    for (const d of timeline) {
      const date = new Date(d._id);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!byMonth[key]) byMonth[key] = { completed: 0, cancelled: 0 };
      byMonth[key].completed += d.completed ?? 0;
      byMonth[key].cancelled += d.cancelled ?? 0;
    }
    return Object.entries(byMonth).map(([label, v]) => ({ label, ...v }));
  })();

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-[#9ca3af]">Chưa có dữ liệu booking trong kỳ này</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter buttons */}
      <div className="flex items-center gap-1 bg-[#f4f5f7] rounded-xl p-1 w-fit">
        {([
          { label: 'Ngày', value: 'day' as TrendGranularity },
          { label: 'Tuần', value: 'week' as TrendGranularity },
          { label: 'Tháng', value: 'month' as TrendGranularity },
        ] as { label: string; value: TrendGranularity }[]).map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setGroupFilter(value)}
            className={cn(
              'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
              groupFilter === value
                ? 'bg-white text-[#222] shadow-sm'
                : 'text-[#9ca3af] hover:text-[#6a6a6a]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <ChartWrapper minH={140}>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e2e5ea',
                borderRadius: 10,
                fontSize: 12,
                color: '#222',
              }}
              formatter={((v: number, name: string) => [
                v,
                name === 'completed' ? 'Đã hoàn thành' : 'Đã hủy',
              ]) as any}
            />
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

// ── Landlord Ranking ────────────────────────────────────────────────────────────
interface Landlord {
  landlordId: string;
  name: string;
  email: string;
  avatar?: string;
  totalPayout: number;
  bookingCount: number;
}

const MEDAL_COLORS = ['#f59e0b', '#9ca3af', '#b45309'];
const MEDAL_BG    = ['#fffbeb', '#f9fafb', '#fef3c7'];

function LandlordRow({ rank, landlord }: {
  rank: number;
  landlord: Landlord;
}) {
  const isMedal = rank <= 3;
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#fff0f3]/40 transition-colors group">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
        style={isMedal
          ? { background: MEDAL_BG[rank - 1], color: MEDAL_COLORS[rank - 1] }
          : { background: '#f4f5f7', color: '#6a6a6a' }
        }
      >
        {isMedal ? ['🥇','🥈','🥉'][rank - 1] : rank}
      </div>
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {landlord.avatar
          ? <img src={landlord.avatar} alt={landlord.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
          : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[#fff0f3] text-[#ff385c] text-xs font-bold">
              {landlord.name.charAt(0).toUpperCase()}
            </div>
          )
        }
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#222] truncate">{landlord.name}</p>
          <p className="text-[10px] text-[#9ca3af] truncate">{landlord.email}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-base font-bold text-[#ff385c]">{landlord.bookingCount}</p>
        <p className="text-[10px] text-[#9ca3af]">đã cho thuê</p>
      </div>
    </div>
  );
}

function LandlordRanking({ landlords }: { landlords: Landlord[] }) {
  const [limit, setLimit] = useState(5);
  const shown = landlords.slice(0, limit);
  if (!landlords.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#fffbeb] flex items-center justify-center">
            <Award className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#222]">Top Chủ trọ nổi bật</h2>
            <p className="text-xs text-[#9ca3af]">Xếp hạng theo số phòng đã cho thuê</p>
          </div>
        </div>
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="text-xs border border-[#e2e5ea] rounded-lg px-2 py-1.5 text-[#6a6a6a] bg-white focus:outline-none focus:ring-1 focus:ring-[#ff385c]/40 cursor-pointer"
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        {shown.map((landlord, i) => (
          <LandlordRow key={landlord.landlordId} rank={i + 1} landlord={landlord} />
        ))}
      </div>
      {landlords.length > limit && (
        <button
          onClick={() => setLimit(l => l + 5)}
          className="w-full mt-3 py-2 text-xs text-[#ff385c] hover:text-[#e0324f] font-medium transition-colors"
        >
          Xem thêm {Math.min(5, landlords.length - limit)} chủ trọ ↓
        </button>
      )}
    </div>
  );
}

// ── Mini Line / Bar ────────────────────────────────────────────────────────────
function MiniLineChart({ data }: { data: { date: string; value: number }[] }) {
  if (!data || data.length === 0) return null;
  return (
    <ChartWrapper minH={56}>
      <ResponsiveContainer width="100%" height={56}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke="#ff385c" strokeWidth={2} dot={false} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e2e5ea', borderRadius: 8, fontSize: 11 }}
            formatter={((v: number) => [v, 'Người dùng']) as any}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

function MiniBarChart({ data }: { data: { date: string; value: number }[] }) {
  if (!data || data.length === 0) return null;
  return (
    <ChartWrapper minH={56}>
      <ResponsiveContainer width="100%" height={56}>
        <BarChart data={data}>
          <Bar dataKey="value" fill="#ff385c" radius={[4, 4, 0, 0]} maxBarSize={14} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #e2e5ea', borderRadius: 8, fontSize: 11 }}
            formatter={((v: number) => [v, 'Tin đăng']) as any}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ── Quick Action Card ─────────────────────────────────────────────────────────
function QuickActionCard({
  label, desc, href, icon: Icon, accent,
}: {
  label: string; desc: string; href: string; icon: React.ElementType; accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 bg-white rounded-2xl border border-[#e2e5ea] p-5 shadow-sm hover:shadow-md hover:border-[#e2e5ea]/60 transition-all"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}15` }}>
        <Icon className="w-6 h-6" style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#222]">{label}</p>
        <p className="text-xs text-[#9ca3af] mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-[#d1d5db] group-hover:text-[#ff385c] group-hover:translate-x-1 transition-all shrink-0" />
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [timeFilter, setTimeFilter] = useState<Period>('30d');

  const { data: dashData, isLoading: dashLoading } = useAdminDashboard();
  const { data: revenueData, isLoading: revenueLoading } = useAdminRevenueAnalytics(timeFilter);
  const { data: userAnalytics, isLoading: userLoading } = useAdminUserAnalytics(timeFilter);
  const { data: bookingAnalytics, isLoading: bookingLoading } = useAdminBookingAnalytics(timeFilter);

  const stats = dashData?.data;
  const isAnyLoading = dashLoading || revenueLoading || userLoading || bookingLoading;

  if (isAnyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff385c]" />
      </div>
    );
  }

  const pending = stats?.pendingActions;
  const hasPending = pending && (pending.payouts > 0 || pending.refunds > 0 || pending.unassignedServiceOrders > 0);
  const revenueTarget = (stats?.revenue.lastMonth ?? 0) * 1.1;

  // User trend
  const userTrend = (userAnalytics?.data?.growth ?? []).map((r) => ({
    date: r._id,
    value: r.total,
  }));

  // Revenue stacked bar data: booking (green) + service (amber)
  const revenueTrend = (revenueData?.data?.timeline ?? [])
    .slice(-14)
    .map((r) => ({
      date: r.date,
      booking: Math.round((r.booking?.fee ?? 0) / 1_000_000 * 10) / 10,
      service: Math.round((r.service?.fee ?? 0) / 1_000_000 * 10) / 10,
    }));

  // Cancellation by actor from booking analytics
  const cancellationByActor = bookingAnalytics?.data?.summary?.cancellationByActor as Record<string, number> | undefined;

  return (
    <div className="p-8 flex flex-col gap-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222]">Tổng quan hệ thống</h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            Dữ liệu thực — cập nhật liên tục từ hệ thống
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-[#e2e5ea] rounded-[20px] p-1">
          {TIME_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTimeFilter(value)}
              className={cn(
                'px-4 py-1.5 rounded-[20px] text-xs font-semibold transition-all',
                timeFilter === value ? 'bg-[#222] text-white' : 'text-[#9ca3af] hover:text-[#222]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ ROW 1: KEY METRICS ══════════════════════════════════════════════ */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] mb-3 px-1">
          Thông số quan trọng
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* KPI: Users + Auth Provider Bar */}
          <KpiCard
            icon={Users}
            label="Người dùng"
            value={fmtCompact(stats?.users.total ?? 0)}
            sub={`+${stats?.users.newThisMonth ?? 0} tháng này · ${stats?.users.active ?? 0} đang hoạt động`}
            accent="#ff385c"
            bg="#fff0f3"
            trend={stats?.users.total && stats?.users.total > 0
              ? Math.round(((stats.users.newThisMonth ?? 0) / Math.max(1, stats.users.total)) * 100)
              : 0}
            right={<MiniLineChart data={userTrend} />}
            footer={
              <AuthProviderBar
                distribution={userAnalytics?.data?.distribution?.byAuthProvider ?? {}}
              />
            }
          />

          {/* KPI: Properties + Occupancy + Avg Duration */}
          <KpiCard
            icon={Building2}
            label="Tin đăng"
            value={fmtCompact(stats?.properties.total ?? 0)}
            sub={`${stats?.properties.byStatus?.available ?? 0} trống · ${stats?.properties.byStatus?.rented ?? 0} đang thuê`}
            accent="#ff385c"
            bg="#fff0f3"
            trend={stats?.properties.total ? 8 : 0}
            right={<MiniBarChart data={userTrend} />}
            footer={
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                  <span className="text-[10px] text-[#9ca3af]">
                    Tỷ lệ lấp đầy: <span className="font-semibold text-[#6a6a6a]">
                      {bookingAnalytics?.data?.summary?.completionRate ?? 0}%
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-[10px] text-[#9ca3af]">
                    TB: <span className="font-semibold text-[#6a6a6a]">
                      {bookingAnalytics?.data?.summary?.avgDurationMonths
                        ? `${bookingAnalytics.data.summary.avgDurationMonths} tháng`
                        : '—'}
                    </span>
                  </span>
                </div>
              </div>
            }
          />

          {/* KPI: Revenue */}
          <KpiCard
            icon={DollarSign}
            label="Doanh thu"
            value={stats ? fmt(stats.revenue.thisMonth) : '—'}
            sub={`Tổng: ${stats ? fmt(stats.revenue.total) : '—'}`}
            accent="#ff385c"
            bg="#fff0f3"
            trend={stats?.revenue.growth ?? 0}
            right={<RevenueGauge value={stats?.revenue.thisMonth ?? 0} target={revenueTarget} />}
          />
        </div>
      </div>

      {/* ══ ROW 2: OPERATIONAL OVERVIEW ═══════════════════════════════════ */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af] mb-3 px-1">
          Tổng quan vận hành
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Tỷ lệ Booking — 2/5 width */}
          {stats && stats.bookings.total > 0 && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e5ea] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#fff0f3] flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-[#ff385c]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#222]">Tỷ lệ Booking</h2>
                    <p className="text-xs text-[#9ca3af]">Phân bổ theo trạng thái</p>
                  </div>
                </div>
                <Link
                  href="/admin/transactions"
                  className="flex items-center gap-1 text-xs text-[#9ca3af] hover:text-[#ff385c] transition-colors"
                >
                  Chi tiết <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <BookingDoughnut
                stats={stats.bookings}
                cancellationByActor={cancellationByActor}
              />
            </div>
          )}

          {/* Top Chủ trọ nổi bật — 3/5 width */}
          {userAnalytics?.data && (userAnalytics.data.topLandlords?.length ?? 0) > 0 && (
            <div className="lg:col-span-3 bg-white rounded-2xl border border-[#e2e5ea] p-6 shadow-sm">
              <LandlordRanking landlords={userAnalytics.data.topLandlords} />
            </div>
          )}
        </div>
      </div>

      {/* ══ ROW 3: PENDING + QUICK ACTIONS ════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {hasPending && (
          <div className="bg-white rounded-2xl border border-[#fed7aa] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#fff7ed] flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-[#f59e0b]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#222]">Cần xử lý ngay</h2>
                <p className="text-xs text-[#9ca3af]">{TIME_FILTERS.find(f => f.value === timeFilter)?.label}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {(pending?.payouts ?? 0) > 0 && (
                <Link
                  href="/admin/transactions"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#fff7ed] hover:bg-[#fed7aa]/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#f59e0b] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {pending?.payouts}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#222]">Chờ payout</p>
                    <p className="text-xs text-[#9ca3af]">Chủ trọ &amp; provider</p>
                  </div>
                </Link>
              )}
              {(pending?.unassignedServiceOrders ?? 0) > 0 && (
                <Link
                  href="/admin/services"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#fff0f3] hover:bg-[#ffd6de]/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#ff385c] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {pending?.unassignedServiceOrders}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#222]">Chưa assign</p>
                    <p className="text-xs text-[#9ca3af]">Đơn dịch vụ</p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        <div className={cn('bg-white rounded-2xl border border-[#e2e5ea] p-6 shadow-sm', !hasPending && 'lg:col-span-3')}>
          <h2 className="text-base font-bold text-[#222] mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickActionCard label="Quản lý người dùng" desc="Kích hoạt / Vô hiệu hoá" href="/admin/users" icon={UserPlus} accent="#ff385c" />
            <QuickActionCard label="Quản lý tin đăng" desc="Nổi bật & trạng thái" href="/admin/properties" icon={Building} accent="#ff385c" />
            <QuickActionCard label="Giao dịch & Payout" desc="Xử lý payout" href="/admin/transactions" icon={Wallet} accent="#ff385c" />
            <QuickActionCard label="Đánh giá & Phản hồi" desc="Duyệt & quản lý" href="/admin/reviews" icon={ClipboardList} accent="#ff385c" />
          </div>
        </div>
      </div>

      {/* ══ ROW 5: REVENUE STACKED BAR ════════════════════════════════════ */}
      {revenueTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e5ea] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#fff0f3] flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-[#ff385c]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#222]">Xu hướng doanh thu</h2>
                  <p className="text-xs text-[#9ca3af]">
                    {revenueData?.data?.totals
                      ? `Tổng ${TIME_FILTERS.find(f => f.value === timeFilter)?.label}: ${fmt(revenueData.data.totals.total)}`
                      : 'Phân chia Booking vs Dịch vụ'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#16a34a]" />
                  <span className="text-xs text-[#6a6a6a]">Booking Fee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" />
                  <span className="text-xs text-[#6a6a6a]">Service Fee</span>
                </div>
              </div>
            </div>
            <ChartWrapper>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={revenueTrend} barCategoryGap="30%">
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e2e5ea',
                      borderRadius: 10,
                      fontSize: 12,
                      color: '#222',
                    }}
                    formatter={((v: number, name: string) => [
                      `${v}M VND`,
                      name === 'booking' ? 'Booking Fee' : 'Service Fee',
                    ]) as any}
                  />
                  <Bar dataKey="booking" stackId="a" fill="#16a34a" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="service" stackId="a" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
      )}
    </div>
  );
}
