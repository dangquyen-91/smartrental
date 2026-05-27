'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';
import { useAdminUsers, useUpdateUserStatus, useUpdateUserRole } from '@/hooks/use-admin';
import type { User } from '@/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  tenant: 'Người thuê',
  landlord: 'Chủ trọ',
  provider: 'Nhà cung cấp',
  admin: 'Quản trị viên',
};

const ROLE_COLOR: Record<string, string> = {
  tenant: 'bg-[#eff6ff] text-[#2563eb]',
  landlord: 'bg-[#f0fdf4] text-[#16a34a]',
  provider: 'bg-[#fefce8] text-[#ca8a04]',
  admin: 'bg-[#fff0f3] text-[#933a12]',
};

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'tenant', label: 'Người thuê' },
  { value: 'landlord', label: 'Chủ trọ' },
  { value: 'provider', label: 'Nhà cung cấp' },
];

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset to page 1 when filters change
  const handleRoleChange = useCallback((v: string) => { setRole(v); setPage(1); }, []);
  const handleStatusChange = useCallback((v: string) => { setIsActive(v); setPage(1); }, []);

  const { data, isLoading, isFetching } = useAdminUsers({ page, limit: 20, role, search, isActive });
  const users: User[] = data?.data ?? [];
  const pagination = data?.pagination;

  const toggleStatus = useUpdateUserStatus();
  const changeRole = useUpdateUserRole();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#222222]">Người dùng</h1>
          <p className="text-sm text-[#6a6a6a] mt-0.5">
            {pagination ? `${pagination.total} tài khoản` : 'Đang tải...'}
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
            placeholder="Tìm tên, email, số điện thoại..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-[8px] border border-[#dddddd] text-sm text-[#222222] placeholder:text-[#929292] focus:outline-none focus:border-[#222222] transition-colors"
          />
        </div>

        <select
          value={role}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="h-9 px-3 rounded-[8px] border border-[#dddddd] text-sm text-[#222222] focus:outline-none focus:border-[#222222] bg-white transition-colors"
        >
          <option value="">Tất cả vai trò</option>
          <option value="tenant">Người thuê</option>
          <option value="landlord">Chủ trọ</option>
          <option value="provider">Nhà cung cấp</option>
        </select>

        <select
          value={isActive}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="h-9 px-3 rounded-[8px] border border-[#dddddd] text-sm text-[#222222] focus:outline-none focus:border-[#222222] bg-white transition-colors"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã vô hiệu hoá</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-card border border-[#dddddd] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-[#933a12]" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <p className="text-sm text-[#6a6a6a]">Không tìm thấy người dùng nào.</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden md:grid grid-cols-[1fr_120px_120px_100px_120px] gap-4 px-5 py-2.5 border-b border-[#dddddd] bg-[#f7f8f0]">
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Tài khoản</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Vai trò</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Trạng thái</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider">Ngày tạo</p>
              <p className="text-xs font-semibold text-[#929292] uppercase tracking-wider text-right">Hành động</p>
            </div>

            {users.map((user, i) => (
              <div
                key={user.id}
                className={`flex items-center gap-4 px-5 py-4 ${i < users.length - 1 ? 'border-b border-[#dddddd]' : ''} ${!user.isActive ? 'opacity-60' : ''}`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#f7f8f0] flex items-center justify-center shrink-0 overflow-hidden border border-[#dddddd]">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold text-[#6a6a6a]">
                      {getInitials(user.name)}
                    </span>
                  )}
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#222222] truncate">{user.name}</p>
                  <p className="text-xs text-[#6a6a6a] truncate">{user.email}</p>
                  {user.phone && (
                    <p className="text-xs text-[#929292]">{user.phone}</p>
                  )}
                </div>

                {/* Role — editable select */}
                {user.role === 'admin' ? (
                  <span className={`hidden md:inline-flex text-xs font-medium px-2 py-0.5 rounded-[4px] ${ROLE_COLOR[user.role]}`}>
                    {ROLE_LABEL[user.role]}
                  </span>
                ) : (
                  <select
                    value={user.role}
                    onChange={(e) => changeRole.mutate({ id: user.id, role: e.target.value })}
                    disabled={changeRole.isPending}
                    className="hidden md:block h-7 px-2 rounded-[6px] border border-[#dddddd] text-xs text-[#222222] bg-white focus:outline-none focus:border-[#222222] transition-colors disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}

                {/* Status badge */}
                <span
                  className={`hidden md:inline-flex text-xs font-medium px-2 py-0.5 rounded-[4px] ${
                    user.isActive ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#f7f8f0] text-[#929292]'
                  }`}
                >
                  {user.isActive ? 'Hoạt động' : 'Vô hiệu hoá'}
                </span>

                {/* Date */}
                <span className="hidden md:block text-xs text-[#929292] w-[100px] shrink-0">
                  {fmtDate(user.createdAt)}
                </span>

                {/* Toggle status button */}
                {user.role !== 'admin' && (
                  <button
                    onClick={() => toggleStatus.mutate({ id: user.id, isActive: !user.isActive })}
                    disabled={toggleStatus.isPending}
                    className={`text-xs px-3 py-1.5 rounded-[8px] border transition-colors shrink-0 disabled:opacity-50 ${
                      user.isActive
                        ? 'border-[#dddddd] text-[#6a6a6a] hover:border-[#c13515] hover:text-[#c13515] hover:bg-[#fff5f5]'
                        : 'border-[#dddddd] text-[#6a6a6a] hover:border-[#16a34a] hover:text-[#16a34a] hover:bg-[#f0fdf4]'
                    }`}
                  >
                    {user.isActive ? 'Vô hiệu hoá' : 'Kích hoạt'}
                  </button>
                )}
              </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#dddddd] bg-[#f7f8f0]">
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
