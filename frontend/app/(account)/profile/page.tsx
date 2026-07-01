'use client';

import { useRef, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  Loader2, Phone, CheckCircle2,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getMeApi, updatePhoneApi } from '@/lib/api/auth.api';
import { changePasswordApi, updateBankAccountApi, updateUserApi } from '@/lib/api/users.api';
import { uploadImagesApi } from '@/lib/api/upload.api';
import { useAuthStore } from '@/stores/auth.store';
import { useMyBookings } from '@/hooks/use-bookings';
import { useMyContracts } from '@/hooks/use-contracts';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/types';

const phoneSchema = z.object({
  phone: z
    .string()
    .refine((v) => /^(0|\+84)\d{9}$/.test(v), 'Số điện thoại không hợp lệ'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

const bankSchema = z.object({
  bankName: z.string().min(2, 'Tên ngân hàng ít nhất 2 ký tự'),
  accountNumber: z.string().regex(/^[0-9]{6,20}$/, 'Số tài khoản phải là 6–20 chữ số'),
  accountName: z.string().min(2, 'Tên chủ tài khoản ít nhất 2 ký tự'),
  branch: z.string().optional(),
});

const nationalIdSchema = z.object({
  number: z
    .string()
    .regex(/^\d{9}(\d{3})?$/, 'Số CMND/CCCD phải gồm 9 hoặc 12 chữ số')
    .or(z.literal('')),
  issuedDate: z.string().optional(),
  issuedPlace: z.string().max(100, 'Nơi cấp tối đa 100 ký tự').optional(),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type BankForm = z.infer<typeof bankSchema>;
type NationalIdForm = z.infer<typeof nationalIdSchema>;

const ROLE_META: Record<string, { label: string; style: string }> = {
  tenant:   { label: 'Người thuê',             style: 'bg-[#EEF5FE] text-[#2683EB] border border-[#2683EB]' },
  landlord: { label: 'Chủ nhà',                style: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  admin:    { label: 'Quản trị viên',          style: 'bg-purple-50 text-purple-700 border border-purple-100' },
  provider: { label: 'Nhà cung cấp dịch vụ',  style: 'bg-amber-50 text-amber-700 border border-amber-100' },
};

function FieldError({ msg }: { msg?: string }) {
  return msg ? (
    <p className="text-xs font-medium text-[#c13515] mt-1.5">{msg}</p>
  ) : null;
}

type PhoneStep = 'view' | 'phone' | 'password';

export default function ProfilePage() {
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMeApi,
    initialData: storedUser ?? undefined,
  });

  const { data: bookingsData } = useMyBookings();
  const { data: contractsData } = useMyContracts();

  const bookings = bookingsData?.data ?? [];
  const contracts = contractsData?.data ?? [];
  const activeBookings = bookings.filter((b) => b.status === 'active').length;
  const signedContracts = contracts.filter((c) => c.status === 'signed').length;

  const handleUpdate = (updated: UserType) => {
    setUser(updated);
    qc.setQueryData(['me'], updated);
    void qc.invalidateQueries({ queryKey: ['me'] });
  };

  if (isLoading && !storedUser) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff385c]" />
      </div>
    );
  }

  if (!user) return null;

  const role = ROLE_META[user.role] ?? { label: user.role, style: 'bg-[#f7f7f7] text-[#6a6a6a]' };

  return (
    <div className="flex flex-col self-stretch gap-6">
      {/* Page title */}
      <div className="flex flex-col self-stretch gap-[3px]">
        <span className="text-[#222222] text-2xl font-bold">
          Hồ sơ cá nhân
        </span>
        <span className="text-[#6A6A6A] text-[15px]">
          Quản lý thông tin và bảo mật tài khoản
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
        {/* Left sidebar */}
        <div className="flex flex-col w-full lg:w-[280px] lg:shrink-0 gap-4">
          {/* Avatar card */}
          <div className="bg-white py-6 px-5 rounded-[14px] border border-[#DDDDDD]">
            <AvatarSection user={user} onUpdate={handleUpdate} />
          </div>

          {/* Stats card */}
          <div className="grid grid-cols-2 gap-3 bg-white py-5 px-5 rounded-[14px] border border-[#DDDDDD]">
            <div className="flex flex-col gap-1">
              <div className="w-8 h-8 bg-[#FFF546] rounded-lg flex items-center justify-center mb-1">
                <img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7b4faa10-e969-45fe-afb1-d235798913c0" className="w-4 h-4" />
              </div>
              <span className="text-black text-xs">Tổng đơn thuê</span>
              <span className="text-[#222222] text-xl font-bold">{bookings.length}</span>
              <span className="text-[#929292] text-xs">{activeBookings} đang thuê</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="w-8 h-8 bg-[#FFF546] rounded-lg flex items-center justify-center mb-1">
                <img src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9165324c-1e9d-4a03-a769-cfa167302603" className="w-4 h-4" />
              </div>
              <span className="text-black text-xs">Hợp đồng</span>
              <span className="text-[#222222] text-xl font-bold">{contracts.length}</span>
              <span className="text-[#929292] text-xs">{signedContracts} đã ký</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-[14px] border border-[#DDDDDD] overflow-hidden">
            <div className="py-3 px-5 border-b border-[#DDDDDD]">
              <span className="text-[#929292] text-xs font-bold tracking-wider">TRUY CẬP NHANH</span>
            </div>
            {[
              { href: '/wishlist', label: 'Yêu thích', sub: 'BĐS đã lưu', icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/33d240a6-bef1-4199-a291-34c99ed76960', arrow: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/0ed6a620-cfa4-41ff-ad20-80d7d9ca9706' },
              { href: '/trips',    label: 'Đơn thuê',  sub: 'Xem lịch sử booking', icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/7c63feb9-5af1-4e35-b4fd-7883f8fc67ce', arrow: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/aa5ebb2f-5b36-4529-b440-a412ec082c4c' },
              { href: '/contracts',label: 'Hợp đồng', sub: 'Quản lý hợp đồng', icon: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9b9e3492-46ae-4e02-88be-26da2c6df897', arrow: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5230220a-809d-498f-8edb-152788789081' },
            ].map(({ href, label, sub, icon, arrow }, i, arr) => (
              <Link key={href} href={href} className={cn('flex items-center py-3.5 px-5 gap-3 w-full hover:bg-[#F7F7F7] transition-colors', i < arr.length - 1 && 'border-b border-[#F7F7F7]')}>
                <div className="shrink-0 w-8 h-8 bg-[#FFF546] rounded-lg flex items-center justify-center">
                  <img src={icon} className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#222222] text-sm font-bold">{label}</p>
                  <p className="text-[#929292] text-xs">{sub}</p>
                </div>
                <img src={arrow} className="w-4 h-4 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0 w-full">
              {/* Account info */}
              <div className="self-stretch bg-white pt-[1px] mb-[21px] rounded-[14px] border border-solid border-[#DDDDDD]">
                <div className="flex items-center self-stretch py-5 mb-[21px] mx-[1px] border-b-[0.800000011920929px] border-solid border-b-[#DDDDDD]">
                  <div className="flex flex-col shrink-0 items-center pt-0.5 ml-6 mr-3">
                    <div className="flex flex-col items-start bg-[#FFF546] text-left py-[9px] px-2.5 rounded-[26843500px] border-0">
                      <img
                        src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/76016c50-ce1b-4034-a3c8-9df55d7beb2f"
                        className="w-4 h-4 rounded-[26843500px] object-fill"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-0.5 min-w-0">
                    <span className="text-[#222222] text-base font-bold">Thông tin tài khoản</span>
                    <span className="text-[#929292] text-xs">Thông tin cơ bản của tài khoản bạn</span>
                  </div>
                </div>
                <div className="self-stretch mb-[21px] mx-[25px]">
                  <div className="flex justify-between items-center self-stretch py-3.5 mb-[1px] border-b-[0.800000011920929px] border-solid border-b-[#F7F7F7]">
                    <span className="text-[#6A6A6A] text-sm">Họ và tên</span>
                    <span className="text-[#222222] text-sm font-bold">{user.name}</span>
                  </div>
                  <div className="flex justify-between items-center gap-3 self-stretch py-3.5 mb-[1px] border-b-[0.800000011920929px] border-solid border-b-[#F7F7F7]">
                    <span className="text-[#6A6A6A] text-sm shrink-0">Email</span>
                    <span className="text-[#222222] text-sm font-bold truncate min-w-0">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center self-stretch py-3.5 border-b-[0.800000011920929px] border-solid border-b-[#F7F7F7]">
                    <span className="text-[#6A6A6A] text-sm">Loại tài khoản</span>
                    <div className="flex shrink-0 items-center gap-[9px]">
                      <div className={cn('w-5 h-[21px] rounded-[26843500px]', role.style)} />
                      <span className="text-[#222222] text-sm font-bold">{role.label}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center self-stretch py-3.5 mb-[1px] border-b-[0.800000011920929px] border-solid border-b-[#F7F7F7]">
                    <span className="text-[#6A6A6A] text-sm">Trạng thái</span>
                    <span className={cn('text-sm font-bold', user.isActive === false ? 'text-[#929292]' : 'text-emerald-600')}>
                      {user.isActive === false ? 'Đã vô hiệu hoá' : 'Đang hoạt động'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center self-stretch py-3.5">
                    <span className="text-[#6A6A6A] text-sm">Ngày tham gia</span>
                    <span className="text-[#929292] text-sm font-bold">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '---'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security */}
              <SecuritySection user={user} onUpdate={handleUpdate} />

              {/* Bank account */}
              <BankSection user={user} onUpdate={handleUpdate} />

              {/* ID card */}
              <NationalIdSection user={user} onUpdate={handleUpdate} />
            </div>
          </div>
    </div>
  );
}

// Avatar section component
function AvatarSection({
  user,
  onUpdate,
}: {
  user: UserType;
  onUpdate: (u: UserType) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const role = ROLE_META[user.role] ?? { label: user.role, style: 'bg-[#f7f7f7] text-[#6a6a6a]' };

  useEffect(() => { setImgError(false); }, [user.avatar]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const [img] = await uploadImagesApi([file]);
      onUpdate({ ...user, avatar: img.url });
      toast.success('Ảnh đại diện đã được cập nhật');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không thể tải ảnh lên.'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Avatar */}
      <div className="mb-4">
        <div
          className="w-24 h-24 rounded-full bg-[#00000066] overflow-hidden cursor-pointer relative group"
          onClick={() => fileRef.current?.click()}
        >
          {user.avatar && !imgError ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-[#ff385c] flex items-center justify-center text-white text-3xl font-bold">
              {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-white text-xs">Đổi ảnh</span>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Name */}
      <h3 className="text-lg font-bold text-[#222222] mb-1">
        {user.name}
      </h3>

      {/* Email */}
      <p className="text-sm text-[#6A6A6A] mb-3">
        {user.email}
      </p>

      {/* Role badges */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn('text-sm font-bold px-3 py-1 rounded-full', role.style)}>
          {role.label}
        </span>
        {user.isActive === false && (
          <span className="text-sm font-bold px-2.5 py-1 rounded-full bg-red-50 text-[#FF5E00] border border-[#FF5E00]">
            Vô hiệu hoá
          </span>
        )}
      </div>

      {/* Member text */}
      <p className="text-xs text-[#929292]">
        Thành viên Smart Rental
      </p>
    </div>
  );
}

// Security section
function SecuritySection({
  user,
  onUpdate,
}: {
  user: UserType;
  onUpdate: (u: UserType) => void;
}) {
  const [step, setStep] = useState<PhoneStep>('view');

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const submitPhone = async ({ phone }: PhoneForm) => {
    try {
      const updated = await updatePhoneApi(phone);
      onUpdate(updated);
      toast.success('Đã cập nhật số điện thoại');
      setStep('view');
      phoneForm.reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Cập nhật thất bại, vui lòng thử lại.'));
    }
  };

  const submitPassword = async ({ currentPassword, newPassword }: PasswordForm) => {
    try {
      await changePasswordApi(user.id, { currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công');
      setStep('view');
      passwordForm.reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Đổi mật khẩu thất bại, vui lòng thử lại.'));
    }
  };

  const cancelEdit = () => {
    setStep('view');
    phoneForm.reset();
    passwordForm.reset();
  };

  return (
    <div className="self-stretch bg-white pt-[1px] mb-5 rounded-[14px] border border-solid border-[#DDDDDD]">
      <div className="flex items-center self-stretch py-5 mb-5 mx-[1px] border-b-[0.800000011920929px] border-solid border-b-[#DDDDDD]">
        <div className="flex flex-col shrink-0 items-center pt-0.5 ml-6 mr-3">
          <div className="flex flex-col items-start bg-[#FFF546] text-left py-[9px] px-2.5 rounded-[26843500px] border-0">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9a6ae306-d739-465b-b70a-f7e843066225"
              className="w-4 h-4 rounded-[26843500px] object-fill"
            />
          </div>
        </div>
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="text-[#222222] text-base font-bold">Bảo mật tài khoản</span>
          <span className="text-[#929292] text-xs">Quản lý số điện thoại và phương thức xác thực</span>
        </div>
      </div>

      <div className="flex flex-col self-stretch mb-[21px] mx-[25px] gap-[1px]">
        {/* Phone row */}
        <div className="flex justify-between items-center self-stretch py-4 border-b border-[#F7F7F7]">
          <span className="text-[#6A6A6A] text-sm">Số điện thoại</span>
          <div className="flex items-center gap-3">
            {user.phone ? (
              <span className="text-[#222222] text-sm font-bold">{user.phone}</span>
            ) : (
              <span className="text-[#929292] text-sm">Chưa cập nhật</span>
            )}
            <button
              onClick={() => setStep('phone')}
              className="flex shrink-0 items-center bg-transparent py-1.5 px-3 gap-1.5 rounded-lg border border-[#dddddd] hover:bg-[#f7f7f7] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5 text-[#6a6a6a]" />
              <span className="text-[#222222] text-xs font-semibold">Chỉnh sửa</span>
            </button>
          </div>
        </div>

        {/* Phone form */}
        {step === 'phone' && (
          <div className="bg-[#f7f7f7] rounded-[10px] p-4 mt-3 space-y-3">
            <p className="text-xs text-[#6a6a6a]">Nhập số điện thoại mới của bạn.</p>
            <div>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="0912 345 678"
                autoFocus
                defaultValue={user.phone ?? ''}
                className="h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292]"
                {...phoneForm.register('phone')}
              />
              <FieldError msg={phoneForm.formState.errors.phone?.message} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={phoneForm.handleSubmit(submitPhone)}
                disabled={phoneForm.formState.isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#1f1c00] bg-[#ffef3d] hover:shadow-lg disabled:opacity-50 rounded-lg transition-all"
              >
                {phoneForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Lưu
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f7f7] transition-colors"
              >
                Huỷ
              </button>
            </div>
          </div>
        )}

        {/* Password row — only for email/password accounts */}
        {user.authProvider !== 'google' && (
          <>
            <div className="flex justify-between items-center self-stretch py-4 border-b border-[#F7F7F7]">
              <span className="text-[#6A6A6A] text-sm">Mật khẩu</span>
              <div className="flex items-center gap-3">
                <span className="text-[#222222] text-sm font-bold tracking-widest">••••••••</span>
                <button
                  onClick={() => setStep('password')}
                  className="flex shrink-0 items-center bg-transparent py-1.5 px-3 gap-1.5 rounded-lg border border-[#dddddd] hover:bg-[#f7f7f7] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#6a6a6a]" />
                  <span className="text-[#222222] text-xs font-semibold">Đổi mật khẩu</span>
                </button>
              </div>
            </div>

            {step === 'password' && (
              <div className="bg-[#f7f7f7] rounded-[10px] p-4 mt-3 space-y-3">
                <p className="text-xs text-[#6a6a6a]">Nhập mật khẩu hiện tại và mật khẩu mới của bạn.</p>
                <div>
                  <Input
                    type="password"
                    placeholder="Mật khẩu hiện tại"
                    autoFocus
                    className="h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292]"
                    {...passwordForm.register('currentPassword')}
                  />
                  <FieldError msg={passwordForm.formState.errors.currentPassword?.message} />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                    className="h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292]"
                    {...passwordForm.register('newPassword')}
                  />
                  <FieldError msg={passwordForm.formState.errors.newPassword?.message} />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Xác nhận mật khẩu mới"
                    className="h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292]"
                    {...passwordForm.register('confirmPassword')}
                  />
                  <FieldError msg={passwordForm.formState.errors.confirmPassword?.message} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={passwordForm.handleSubmit(submitPassword)}
                    disabled={passwordForm.formState.isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#1f1c00] bg-[#ffef3d] hover:shadow-lg disabled:opacity-50 rounded-lg transition-all"
                  >
                    {passwordForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f7f7] transition-colors"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Auth method */}
        <div className="flex flex-col self-stretch py-[19px] gap-[7px]">
          <div className="flex flex-col items-start self-stretch">
            <span className="text-[#222222] text-sm font-bold">Phương thức đăng nhập</span>
          </div>
          <div className="flex items-center self-stretch">
            {user.authProvider === 'google' ? (
              <>
                <img
                  src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/75bcb3f6-17ea-43df-b3e1-2e6938719f04"
                  className="w-5 h-5 mr-[7px] object-fill"
                />
                <span className="text-[#222222] text-sm mr-2">Google Account</span>
                <div className="flex shrink-0 items-center bg-[#EBFCF4] text-left py-[3px] px-[9px] gap-1 rounded-[26843500px] border border-solid border-[#D0FAE4]">
                  <img
                    src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/4f8feaa7-4ec0-4be9-bb3c-2b9747abe1f2"
                    className="w-3 h-3 rounded-[26843500px] object-fill"
                  />
                  <span className="text-[#009865] text-xs font-bold">Đã liên kết</span>
                </div>
              </>
            ) : (
              <>
                <div className="size-5 rounded-full bg-[#222222] flex items-center justify-center shrink-0 mr-[7px]">
                  <Phone className="size-3 text-white" />
                </div>
                <span className="text-[#222222] text-sm mr-2">Email & Mật khẩu</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Bank section
function BankSection({
  user,
  onUpdate,
}: {
  user: UserType;
  onUpdate: (u: UserType) => void;
}) {
  const [editing, setEditing] = useState(false);
  const bank = user.bankAccount?.bankName ? user.bankAccount : null;

  const form = useForm<BankForm>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankName: bank?.bankName ?? '',
      accountNumber: bank?.accountNumber ?? '',
      accountName: bank?.accountName ?? '',
      branch: '',
    },
  });

  const onSubmit = async (data: BankForm) => {
    try {
      const updated = await updateBankAccountApi(user.id, data);
      onUpdate(updated);
      toast.success('Đã cập nhật tài khoản ngân hàng');
      setEditing(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Cập nhật thất bại, vui lòng thử lại.'));
    }
  };

  return (
    <div className="self-stretch bg-white pt-[1px] mb-5 rounded-[14px] border border-solid border-[#DDDDDD]">
      <div className="flex items-center self-stretch py-5 mb-[21px] mx-[1px] border-b-[0.800000011920929px] border-solid border-b-[#DDDDDD]">
        <div className="flex flex-col shrink-0 items-center pt-0.5 ml-6 mr-3">
          <div className="flex flex-col items-start bg-[#FFF546] text-left py-[9px] px-2.5 rounded-[26843500px] border-0">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d790544b-57f3-4c39-9782-2e9e496fe56a"
              className="w-4 h-4 rounded-[26843500px] object-fill"
            />
          </div>
        </div>
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="text-[#222222] text-base font-bold">Tài khoản ngân hàng</span>
          <span className="text-[#929292] text-xs">Dùng để nhận thanh toán từ hợp đồng và đơn dịch vụ</span>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col self-stretch mb-[21px] mx-[25px] gap-4">
          {[
            { name: 'bankName' as const, label: 'Tên ngân hàng', placeholder: 'VD: Vietcombank, BIDV, MB Bank…', required: true },
            { name: 'accountNumber' as const, label: 'Số tài khoản', placeholder: 'Nhập số tài khoản', required: true },
            { name: 'accountName' as const, label: 'Chủ tài khoản', placeholder: 'Viết HOA như trên sổ ngân hàng', required: true },
            { name: 'branch' as const, label: 'Chi nhánh', placeholder: 'VD: Chi nhánh Hà Nội', required: false },
          ].map(({ name, label, placeholder, required }) => (
            <div key={name}>
              <Label className="text-sm font-semibold text-[#222222]">
                {label}
                {required && <span className="text-[#c13515]"> *</span>}
              </Label>
              <Input
                placeholder={placeholder}
                {...(name === 'accountNumber' ? { inputMode: 'numeric' as const } : {})}
                className="h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292] mt-1.5"
                {...form.register(name)}
              />
              <FieldError msg={form.formState.errors[name]?.message} />
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <button
              onClick={form.handleSubmit(onSubmit)}
              disabled={form.formState.isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#1f1c00] bg-[#ffef3d] hover:shadow-lg disabled:opacity-50 rounded-lg transition-all"
            >
              {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Lưu thay đổi
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f7f7] transition-colors"
            >
              Huỷ
            </button>
          </div>
        </div>
      ) : bank ? (
        <div className="flex flex-col self-stretch mb-[21px] mx-[25px]">
          <div className="flex items-center gap-2 mb-5 p-3 bg-emerald-50 rounded-[10px] border border-emerald-100">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-emerald-700">Tài khoản ngân hàng đã được liên kết</span>
          </div>
          <div className="divide-y divide-[#f7f7f7]">
            <div className="flex justify-between items-center py-3.5">
              <span className="text-[#6A6A6A] text-sm">Ngân hàng</span>
              <span className="text-[#222222] text-sm font-bold">{bank.bankName}</span>
            </div>
            <div className="flex justify-between items-center py-3.5">
              <span className="text-[#6A6A6A] text-sm">Số tài khoản</span>
              <span className="text-[#222222] text-sm font-bold">{bank.accountNumber}</span>
            </div>
            <div className="flex justify-between items-center py-3.5">
              <span className="text-[#6A6A6A] text-sm">Chủ tài khoản</span>
              <span className="text-[#222222] text-sm font-bold">{bank.accountName}</span>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="mt-5 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f7f7] transition-colors"
          >
            <Pencil className="size-3.5" />
            Cập nhật thông tin
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center self-stretch py-8 mb-5 mx-[25px] gap-[9px]">
          <div className="flex flex-col items-center pb-[3px]">
            <span className="text-[#222222] text-sm font-bold">
              Chưa liên kết tài khoản ngân hàng
            </span>
          </div>
          <div className="flex flex-col items-center pb-[5px] px-1.5">
            <span className="text-[#6A6A6A] text-xs text-center w-full max-w-[276px]">
              Thêm tài khoản ngân hàng để nhận thanh toán khi hợp
              đồng hoàn thành hoặc dịch vụ được nghiệm thu.
            </span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex flex-col items-start bg-[#ffef3d] text-left py-[7px] px-4 rounded-lg border-0"
          >
            <span className="text-[#1f1c00] text-sm font-bold">
              Thêm tài khoản ngân hàng
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// National ID section
function NationalIdSection({
  user,
  onUpdate,
}: {
  user: UserType;
  onUpdate: (u: UserType) => void;
}) {
  const [editing, setEditing] = useState(false);
  const nid = user.nationalId?.number ? user.nationalId : null;

  const form = useForm<NationalIdForm>({
    resolver: zodResolver(nationalIdSchema),
    defaultValues: {
      number: nid?.number ?? '',
      issuedDate: nid?.issuedDate ? nid.issuedDate.slice(0, 10) : '',
      issuedPlace: nid?.issuedPlace ?? '',
    },
  });

  const onSubmit = async (data: NationalIdForm) => {
    try {
      const updated = await updateUserApi(user.id, {
        nationalId: {
          number: data.number || null,
          issuedDate: data.issuedDate || null,
          issuedPlace: data.issuedPlace || null,
        },
      });
      onUpdate(updated);
      toast.success('Đã cập nhật thông tin CMND/CCCD');
      setEditing(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Cập nhật thất bại, vui lòng thử lại.'));
    }
  };

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---';

  return (
    <div className="self-stretch bg-white pt-[1px] mb-5 rounded-[14px] border border-solid border-[#DDDDDD]">
      <div className="flex items-center self-stretch py-5 mb-[21px] mx-[1px] border-b-[0.800000011920929px] border-solid border-b-[#DDDDDD]">
        <div className="flex flex-col shrink-0 items-center pt-0.5 ml-6 mr-3">
          <div className="flex flex-col items-start bg-[#FFF546] text-left p-2.5 rounded-[26843500px] border-0">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/c5b21e65-73fe-4f07-86d5-cb0fe2ea2cc6"
              className="w-4 h-4 rounded-[26843500px] object-fill"
            />
          </div>
        </div>
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="text-[#222222] text-base font-bold">Giấy tờ tuỳ thân</span>
          <span className="text-[#929292] text-xs">Thông tin giấy tờ tuỳ thân dùng trong hợp đồng thuê nhà</span>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col self-stretch mb-[21px] mx-[25px] gap-4">
          <div>
            <Label className="text-sm font-semibold text-[#222222]">
              Số CMND/CCCD <span className="text-[#c13515]">*</span>
            </Label>
            <Input
              placeholder="VD: 034123456789"
              inputMode="numeric"
              maxLength={12}
              className="h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292] mt-1.5"
              {...form.register('number')}
            />
            <FieldError msg={form.formState.errors.number?.message} />
          </div>

          <div>
            <Label className="text-sm font-semibold text-[#222222]">
              Ngày cấp <span className="text-[#929292] font-normal">(tuỳ chọn)</span>
            </Label>
            <Input
              type="date"
              className="h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] mt-1.5"
              {...form.register('issuedDate')}
            />
            <FieldError msg={form.formState.errors.issuedDate?.message} />
          </div>

          <div>
            <Label className="text-sm font-semibold text-[#222222]">
              Nơi cấp <span className="text-[#929292] font-normal">(tuỳ chọn)</span>
            </Label>
            <Input
              placeholder="VD: Cục Cảnh sát QLHC về TTXH"
              className="h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292] mt-1.5"
              {...form.register('issuedPlace')}
            />
            <FieldError msg={form.formState.errors.issuedPlace?.message} />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={form.handleSubmit(onSubmit)}
              disabled={form.formState.isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#1f1c00] bg-[#ffef3d] hover:shadow-lg disabled:opacity-50 rounded-lg transition-all"
            >
              {form.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Lưu thay đổi
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f7f7] transition-colors"
            >
              Huỷ
            </button>
          </div>
        </div>
      ) : nid ? (
        <div className="flex flex-col self-stretch mb-[21px] mx-[25px]">
          <div className="flex items-center gap-2 mb-5 p-3 bg-emerald-50 rounded-[10px] border border-emerald-100">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-emerald-700">Đã cập nhật thông tin giấy tờ tuỳ thân</span>
          </div>
          <div className="divide-y divide-[#f7f7f7]">
            <div className="flex justify-between items-center py-3.5">
              <span className="text-[#6A6A6A] text-sm">Số CMND/CCCD</span>
              <span className="text-[#222222] text-sm font-bold">{nid.number ?? '---'}</span>
            </div>
            <div className="flex justify-between items-center py-3.5">
              <span className="text-[#6A6A6A] text-sm">Ngày cấp</span>
              <span className="text-[#222222] text-sm font-bold">{fmtDate(nid.issuedDate)}</span>
            </div>
            <div className="flex justify-between items-center py-3.5">
              <span className="text-[#6A6A6A] text-sm">Nơi cấp</span>
              <span className="text-[#222222] text-sm font-bold">{nid.issuedPlace ?? '---'}</span>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="mt-5 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f7f7] transition-colors"
          >
            <Pencil className="size-3.5" />
            Cập nhật thông tin
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-8 px-6 mb-[21px]">
          <div className="flex flex-col items-center pb-[3px] mb-2">
            <span className="text-[#222222] text-sm font-bold">
              Chưa có thông tin giấy tờ tuỳ thân
            </span>
          </div>
          <div className="flex flex-col items-center px-2 mb-[7px]">
            <span className="text-[#6A6A6A] text-xs text-center w-full max-w-[303px]">
              Bổ sung số CMND/CCCD để hợp đồng thuê nhà được
              điền đầy đủ thông tin pháp lý.
            </span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex flex-col items-start bg-[#ffef3d] text-left py-[7px] px-4 rounded-lg border-0"
          >
            <span className="text-[#1f1c00] text-sm font-bold">
              Thêm CMND/CCCD
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
