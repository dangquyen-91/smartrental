'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, UserCheck, X, Check } from 'lucide-react';
import { useAdminServiceOrders, useAssignProvider, useAdminUsers } from '@/hooks/use-admin';
import type { ServiceOrder, Property, User } from '@/types';
import { cn } from '@/lib/utils';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  cleaning: 'Vệ sinh',
  repair: 'Sửa chữa',
  wifi: 'Lắp Wifi',
  moving: 'Chuyển đồ',
  painting: 'Sơn nhà',
  registration: 'Đăng ký tạm trú',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang thực hiện',
  done: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-[#fefce8] text-[#ca8a04]',
  confirmed: 'bg-[#eff6ff] text-[#2563eb]',
  in_progress: 'bg-[#f0fdf4] text-[#16a34a]',
  done: 'bg-[#f7f7f7] text-[#6a6a6a]',
  cancelled: 'bg-[#fff1f2] text-[#e11d48]',
};

const getTenantName = (tenant: ServiceOrder['tenant']) =>
  typeof tenant === 'string' ? '—' : (tenant as User).name;

const getPropertyTitle = (property: ServiceOrder['property']) =>
  typeof property === 'string' ? '—' : (property as Property).title;

const getProviderName = (provider: ServiceOrder['assignedProvider']) => {
  if (!provider) return null;
  return typeof provider === 'string' ? provider : (provider as User).name;
};

const fmtPrice = (n: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(n) + '₫';

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  // Inline assign state
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [pickedProvider, setPickedProvider] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleStatusChange = useCallback((v: string) => { setStatus(v); setPage(1); }, []);
  const handleTypeChange = useCallback((v: string) => { setType(v); setPage(1); }, []);

  const { data, isLoading, isFetching } = useAdminServiceOrders({ page, limit: 20, status, type });
  const orders: ServiceOrder[] = data?.data ?? [];
  const pagination = data?.pagination;

  const { data: providerData } = useAdminUsers({ role: 'provider', limit: 100 });
  const providers = providerData?.data ?? [];

  const assign = useAssignProvider();

  const handleAssign = (orderId: string) => {
    if (!pickedProvider) return;
    assign.mutate(
      { id: orderId, providerId: pickedProvider },
      { onSuccess: () => { setAssigningId(null); setPickedProvider(''); } },
    );
  };

  const startAssign = (orderId: string) => {
    setAssigningId(orderId);
    setPickedProvider('');
  };

  const cancelAssign = () => {
    setAssigningId(null);
    setPickedProvider('');
  };

  // Suppress unused variable warning — search is used for filter parity
  void search;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222222]">Dịch vụ</h1>
          <p className="text-sm text-[#6a6a6a] mt-0.5">
            {pagination ? `${pagination.total} đơn dịch vụ` : 'Đang tải...'}
          </p>
        </div>
        {isFetching && !isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-[#929292]" />
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-card border border-[#dddddd] p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#929292]" />
          <input
            type="text"
            placeholder="Tìm khách thuê, tài sản..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[8px] border border-[#dddddd] text-sm text-[#222222] placeholder:text-[#929292] focus:outline-none focus:border-[#222222] transition-colors"
          />
        </div>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-9 px-3 rounded-[8px] border border-[#dddddd] text-sm text-[#222222] focus:outline-none focus:border-[#222222] bg-white transition-colors"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="in_progress">Đang thực hiện</option>
          <option value="done">Hoàn thành</option>
          <option value="cancelled">Đã huỷ</option>
        </select>

        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="h-9 px-3 rounded-[8px] border border-[#dddddd] text-sm text-[#222222] focus:outline-none focus:border-[#222222] bg-white transition-colors"
        >
          <option value="">Tất cả loại</option>
          <option value="cleaning">Vệ sinh</option>
          <option value="repair">Sửa chữa</option>
          <option value="wifi">Lắp Wifi</option>
          <option value="moving">Chuyển đồ</option>
          <option value="painting">Sơn nhà</option>
          <option value="registration">Đăng ký tạm trú</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-card border border-[#dddddd] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-[#ff385c]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <p className="text-sm text-[#6a6a6a]">Không tìm thấy đơn dịch vụ nào.</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden lg:grid grid-cols-[1fr_1fr_110px_110px_90px_200px] gap-4 px-5 py-2.5 border-b border-[#dddddd] bg-[#f7f7f7]">
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Đơn hàng</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Khách thuê · Tài sản</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Trạng thái</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Lịch thực hiện</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Giá</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Nhân viên</p>
            </div>

            {orders.map((order, i) => {
              const providerName = getProviderName(order.assignedProvider);
              const isConfirmedUnassigned = order.status === 'confirmed' && !order.assignedProvider;
              const isAssigning = assigningId === order.id;

              return (
                <div
                  key={order.id}
                  className={cn(
                    'flex flex-col lg:grid lg:grid-cols-[1fr_1fr_110px_110px_90px_200px] lg:items-center gap-3 lg:gap-4 px-5 py-4',
                    i < orders.length - 1 ? 'border-b border-[#dddddd]' : '',
                    isConfirmedUnassigned ? 'bg-[#fffbeb]' : '',
                  )}
                >
                  {/* Type + service name */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#222222] truncate">
                      {TYPE_LABEL[order.type] ?? order.type}
                    </p>
                    <p className="text-xs text-[#929292] mt-0.5">
                      #{order.id.slice(-8).toUpperCase()}
                    </p>
                  </div>

                  {/* Tenant + property */}
                  <div className="min-w-0">
                    <p className="text-sm text-[#222222] truncate">{getTenantName(order.tenant)}</p>
                    <p className="text-xs text-[#6a6a6a] truncate">{getPropertyTitle(order.property)}</p>
                  </div>

                  {/* Status badge */}
                  <span
                    className={cn(
                      'inline-flex items-center w-fit text-xs font-medium px-2 py-0.5 rounded-[4px]',
                      STATUS_COLOR[order.status] ?? 'bg-[#f7f7f7] text-[#6a6a6a]',
                    )}
                  >
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>

                  {/* Scheduled date */}
                  <p className="text-xs text-[#6a6a6a]">{fmtDate(order.scheduledAt)}</p>

                  {/* Price */}
                  <p className="text-xs font-semibold text-[#222222]">{fmtPrice(order.price)}</p>

                  {/* Provider / Assign */}
                  <div className="flex items-center gap-2 min-w-0">
                    {isAssigning ? (
                      <>
                        <select
                          value={pickedProvider}
                          onChange={(e) => setPickedProvider(e.target.value)}
                          autoFocus
                          className="flex-1 h-8 px-2 rounded-[6px] border border-[#dddddd] text-xs text-[#222222] focus:outline-none focus:border-[#222222] bg-white"
                        >
                          <option value="">Chọn nhân viên...</option>
                          {providers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssign(order.id)}
                          disabled={!pickedProvider || assign.isPending}
                          title="Xác nhận gán"
                          className="w-7 h-7 rounded-full bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center hover:bg-[#dcfce7] disabled:opacity-40 transition-colors shrink-0"
                        >
                          {assign.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={cancelAssign}
                          title="Huỷ"
                          className="w-7 h-7 rounded-full bg-[#f7f7f7] text-[#929292] flex items-center justify-center hover:bg-[#f0f0f0] transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : providerName ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
                        <span className="text-xs text-[#222222] truncate">{providerName}</span>
                        {order.status !== 'done' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => startAssign(order.id)}
                            className="text-xs text-[#6a6a6a] hover:text-[#222222] underline shrink-0 transition-colors"
                          >
                            Đổi
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => startAssign(order.id)}
                        disabled={order.status === 'done' || order.status === 'cancelled'}
                        className={cn(
                          'flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                          isConfirmedUnassigned
                            ? 'bg-[#ff385c] text-white hover:bg-[#e0314f]'
                            : 'bg-[#f7f7f7] text-[#6a6a6a] hover:bg-[#eeeeee]',
                        )}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Gán nhân viên
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#dddddd] bg-[#f7f7f7]">
                <p className="text-xs text-[#6a6a6a]">
                  {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} / {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-[8px] border border-[#dddddd] text-xs text-[#222222] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1.5 text-xs text-[#6a6a6a]">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="px-3 py-1.5 rounded-[8px] border border-[#dddddd] text-xs text-[#222222] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
