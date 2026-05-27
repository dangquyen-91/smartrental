'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  Loader2, Phone, CreditCard, User, CheckCircle2,
  Pencil, Shield, Building2, ArrowRight, FileText,
  CalendarDays, Camera, Heart, Fingerprint,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getMeApi, updatePhoneApi, verifyPhoneApi, requestLandlordApi } from '@/lib/api/auth.api';
import { updateBankAccountApi, updateUserApi } from '@/lib/api/users.api';
import { uploadImagesApi } from '@/lib/api/upload.api';
import { useAuthStore } from '@/stores/auth.store';
import { useAuth } from '@/hooks/use-auth';
import { useMyBookings } from '@/hooks/use-bookings';
import { useMyContracts } from '@/hooks/use-contracts';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/types';

// ─── schemas ──────────────────────────────────────────────────────────────────

const phoneSchema = z.object({
  phone: z
    .string()
    .refine((v) => /^(0|\+84)\d{9}$/.test(v), 'Số điện thoại không hợp lệ'),
});

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP gồm 6 chữ số')
    .regex(/^\d+$/, 'Chỉ nhập số'),
});

const bankSchema = z.object({
  bankName: z.string().min(2, 'Tên ngân hàng ít nhất 2 ký tự'),
  accountNumber: z.string().min(6, 'Số tài khoản không hợp lệ'),
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
type OtpForm = z.infer<typeof otpSchema>;
type BankForm = z.infer<typeof bankSchema>;
type NationalIdForm = z.infer<typeof nationalIdSchema>;

// ─── constants ────────────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; style: string }> = {
  tenant:   { label: 'Người thuê',             style: 'bg-blue-50 text-blue-700 border border-blue-100' },
  landlord: { label: 'Chủ nhà',                style: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  admin:    { label: 'Quản trị viên',          style: 'bg-purple-50 text-purple-700 border border-purple-100' },
  provider: { label: 'Nhà cung cấp dịch vụ',  style: 'bg-amber-50 text-amber-700 border border-amber-100' },
};

const INPUT = 'h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292]';

// ─── primitives ───────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  return msg ? (
    <p className="text-xs font-medium text-[#c13515] mt-1.5">{msg}</p>
  ) : null;
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  id,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="bg-white border border-[#dddddd] rounded-card overflow-hidden"
    >
      <div className="flex items-start gap-3 px-6 py-5 border-b border-[#dddddd]">
        <div className="size-9 rounded-full bg-[#f7f8f0] flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="size-4 text-[#6a6a6a]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#222222]">{title}</h2>
          {subtitle && (
            <p className="text-xs text-[#929292] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  muted,
  badge,
}: {
  label: string;
  value: string;
  muted?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[#f7f7f7] last:border-0 gap-4">
      <span className="text-sm font-medium text-[#6a6a6a] shrink-0">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        {badge}
        <span
          className={cn(
            'text-sm font-semibold text-right truncate',
            muted ? 'text-[#929292]' : 'text-[#222222]',
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-16 bg-[#ebebeb] rounded mb-1.5" />
      <div className="h-6 w-10 bg-[#ebebeb] rounded" />
    </div>
  );
}

function PrimaryBtn({
  loading,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#933a12] hover:bg-[#7a2f0e] disabled:opacity-50 rounded-lg transition-all active:scale-[0.98]',
        className,
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'px-4 py-2 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f8f0] transition-colors',
        className,
      )}
    >
      {children}
    </button>
  );
}

// ─── avatar card ──────────────────────────────────────────────────────────────

function AvatarCard({
  user,
  onUpdate,
}: {
  user: UserType;
  onUpdate: (u: UserType) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const role = ROLE_META[user.role] ?? { label: user.role, style: 'bg-[#f7f8f0] text-[#6a6a6a]' };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const [img] = await uploadImagesApi([file]);
      // Optimistically update UI — avatar persistence requires backend endpoint
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
    <div className="bg-white border border-[#dddddd] rounded-card p-6 flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="relative group mb-4">
        <div className="size-24 rounded-full bg-[#222222] flex items-center justify-center text-white text-3xl font-bold overflow-hidden ring-4 ring-[#f7f7f7]">
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={user.name} className="size-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="size-5 text-white animate-spin" />
          ) : (
            <Camera className="size-5 text-white" />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <h2 className="text-lg font-bold text-[#222222] leading-snug">{user.name}</h2>
      <p className="text-sm text-[#6a6a6a] mt-0.5 truncate max-w-full">{user.email}</p>

      <div className="flex flex-wrap justify-center gap-2 mt-3">
        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', role.style)}>
          {role.label}
        </span>
        {!user.isActive && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-[#c13515] border border-red-100">
            Vô hiệu hoá
          </span>
        )}
      </div>

      <p className="text-xs text-[#929292] mt-3">
        {user.createdAt
          ? `Thành viên từ ${new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`
          : 'Thành viên SmartRental'}
      </p>
    </div>
  );
}

// ─── stats card ───────────────────────────────────────────────────────────────

function StatsCard() {
  const { data: bookingsData, isLoading: loadingB } = useMyBookings();
  const { data: contractsData, isLoading: loadingC } = useMyContracts();

  const bookings = bookingsData?.data ?? [];
  const contracts = contractsData?.data ?? [];

  const stats = [
    {
      label: 'Tổng đơn thuê',
      value: bookings.length,
      sub: `${bookings.filter((b) => b.status === 'active').length} đang thuê`,
      icon: CalendarDays,
      color: 'text-[#2563eb]',
      bg: 'bg-[#eff6ff]',
      loading: loadingB,
    },
    {
      label: 'Hợp đồng',
      value: contracts.length,
      sub: `${contracts.filter((c) => c.status === 'signed').length} đã ký`,
      icon: FileText,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      loading: loadingC,
    },
  ];

  return (
    <div className="bg-white border border-[#dddddd] rounded-card p-5 grid grid-cols-2 gap-4">
      {stats.map(({ label, value, sub, icon: Icon, color, bg, loading }) => (
        <div key={label} className="flex flex-col gap-1">
          <div className={cn('size-8 rounded-lg flex items-center justify-center mb-1', bg)}>
            <Icon className={cn('size-4', color)} />
          </div>
          {loading ? (
            <StatSkeleton />
          ) : (
            <>
              <p className="text-xs font-medium text-[#929292]">{label}</p>
              <p className="text-xl font-bold text-[#222222]">{value}</p>
              <p className="text-xs text-[#929292]">{sub}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── quick links card ─────────────────────────────────────────────────────────

function QuickLinksCard() {
  const { isLandlord, isAdmin, isProvider } = useAuth();

  const links: { label: string; desc: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: 'Yêu thích', desc: 'BĐS đã lưu', href: '/wishlist', icon: Heart },
    { label: 'Đơn thuê', desc: 'Xem lịch sử booking', href: '/trips', icon: CalendarDays },
    { label: 'Hợp đồng', desc: 'Quản lý hợp đồng', href: '/contracts', icon: FileText },
  ];

  if (isLandlord) {
    links.push({ label: 'Quản lý cho thuê', desc: 'Dashboard chủ nhà', href: '/hosting', icon: Building2 });
  }
  if (isAdmin) {
    links.push({ label: 'Trang quản trị', desc: 'Admin dashboard', href: '/admin', icon: Shield });
  }
  if (isProvider) {
    links.push({ label: 'Dịch vụ của tôi', desc: 'Xem đơn dịch vụ', href: '/provider', icon: Building2 });
  }

  return (
    <div className="bg-white border border-[#dddddd] rounded-card overflow-hidden">
      <p className="px-5 py-3.5 text-xs font-semibold text-[#929292] uppercase tracking-wider border-b border-[#dddddd]">
        Truy cập nhanh
      </p>
      {links.map(({ label, desc, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f7f8f0] transition-colors border-b border-[#f7f7f7] last:border-0 group"
        >
          <div className="size-8 rounded-lg bg-[#f7f8f0] group-hover:bg-white flex items-center justify-center shrink-0 transition-colors border border-transparent group-hover:border-[#dddddd]">
            <Icon className="size-4 text-[#6a6a6a]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#222222] truncate">{label}</p>
            <p className="text-xs text-[#929292] truncate">{desc}</p>
          </div>
          <ArrowRight className="size-4 text-[#929292] group-hover:text-[#222222] transition-colors shrink-0" />
        </Link>
      ))}
    </div>
  );
}

// ─── phone + security section ─────────────────────────────────────────────────

type PhoneStep = 'view' | 'phone' | 'otp';

function SecuritySection({
  user,
  onUpdate,
}: {
  user: UserType;
  onUpdate: (u: UserType) => void;
}) {
  const { isLandlord } = useAuth();
  const [step, setStep] = useState<PhoneStep>('view');

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const submitPhone = async ({ phone }: PhoneForm) => {
    try {
      const updated = await updatePhoneApi(phone);
      onUpdate(updated);

      if (isLandlord) {
        await requestLandlordApi();
        setStep('otp');
        toast.info('Mã OTP đã được gửi đến số điện thoại mới.');
      } else {
        toast.success('Đã cập nhật số điện thoại');
        setStep('view');
        phoneForm.reset();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Cập nhật thất bại, vui lòng thử lại.'));
    }
  };

  const submitOtp = async ({ otp }: OtpForm) => {
    try {
      await verifyPhoneApi(otp);
      const fresh = await getMeApi();
      onUpdate(fresh);
      toast.success('Số điện thoại đã được xác thực thành công');
      setStep('view');
      phoneForm.reset();
      otpForm.reset();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'OTP không đúng hoặc đã hết hạn.'));
    }
  };

  const cancelEdit = () => {
    setStep('view');
    phoneForm.reset();
    otpForm.reset();
  };

  return (
    <SectionCard
      id="security"
      icon={Shield}
      title="Bảo mật tài khoản"
      subtitle="Quản lý số điện thoại và phương thức xác thực"
    >
      <div className="space-y-0 divide-y divide-[#f7f7f7]">

        {/* Phone row */}
        <div className="pb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#222222]">Số điện thoại</p>
                {user.isPhoneVerified && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <CheckCircle2 className="size-3" /> Đã xác thực
                  </span>
                )}
              </div>
              <p className="text-xs text-[#929292] mt-0.5">
                {user.phone ?? 'Chưa cập nhật — dùng để xác thực và liên lạc'}
              </p>
            </div>
            {step === 'view' && (
              <button
                onClick={() => setStep('phone')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f8f0] transition-colors shrink-0"
              >
                <Pencil className="size-3.5" />
                {user.phone ? 'Thay đổi' : 'Thêm SĐT'}
              </button>
            )}
          </div>

          {step === 'phone' && (
            <form
              onSubmit={phoneForm.handleSubmit(submitPhone)}
              className="bg-[#f7f8f0] rounded-[10px] p-4 space-y-3"
            >
              <p className="text-xs text-[#6a6a6a]">
                {isLandlord
                  ? 'Nhập số điện thoại mới. Mã OTP sẽ được gửi để xác thực.'
                  : 'Nhập số điện thoại mới của bạn.'}
              </p>
              <div>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0912 345 678"
                  autoFocus
                  defaultValue={user.phone ?? ''}
                  className={INPUT}
                  {...phoneForm.register('phone')}
                />
                <FieldError msg={phoneForm.formState.errors.phone?.message} />
              </div>
              <div className="flex gap-2">
                <PrimaryBtn loading={phoneForm.formState.isSubmitting} type="submit">
                  {isLandlord ? 'Gửi mã OTP' : 'Lưu'}
                </PrimaryBtn>
                <GhostBtn type="button" onClick={cancelEdit}>Huỷ</GhostBtn>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form
              onSubmit={otpForm.handleSubmit(submitOtp)}
              className="bg-[#f7f8f0] rounded-[10px] p-4 space-y-3"
            >
              <p className="text-xs text-[#6a6a6a]">
                Nhập mã OTP 6 chữ số đã gửi đến{' '}
                <span className="font-semibold text-[#222222]">{user.phone}</span>.
                Mã có hiệu lực trong <span className="font-semibold text-[#222222]">5 phút</span>.
              </p>
              <div>
                <Input
                  placeholder="● ● ● ● ● ●"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  className={cn(INPUT, 'text-center text-lg tracking-[0.5em] font-bold')}
                  {...otpForm.register('otp')}
                />
                <FieldError msg={otpForm.formState.errors.otp?.message} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <PrimaryBtn loading={otpForm.formState.isSubmitting} type="submit">
                    Xác nhận
                  </PrimaryBtn>
                  <GhostBtn type="button" onClick={cancelEdit}>Huỷ</GhostBtn>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await requestLandlordApi();
                      toast.info('Đã gửi lại mã OTP.');
                    } catch {
                      toast.error('Không thể gửi lại OTP.');
                    }
                  }}
                  className="text-xs font-semibold text-[#933a12] hover:underline"
                >
                  Gửi lại
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Auth provider row */}
        <div className="py-5">
          <p className="text-sm font-semibold text-[#222222] mb-1">Phương thức đăng nhập</p>
          <div className="flex items-center gap-2 mt-2">
            {user.authProvider === 'google' ? (
              <>
                <svg viewBox="0 0 24 24" className="size-5 shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm text-[#222222] font-medium">Google Account</span>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Đã liên kết
                </span>
              </>
            ) : (
              <>
                <div className="size-5 rounded-full bg-[#222222] flex items-center justify-center shrink-0">
                  <User className="size-3 text-white" />
                </div>
                <span className="text-sm text-[#222222] font-medium">Email & Mật khẩu</span>
              </>
            )}
          </div>
        </div>

      </div>
    </SectionCard>
  );
}

// ─── bank section ─────────────────────────────────────────────────────────────

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
    <SectionCard
      id="bank"
      icon={CreditCard}
      title="Tài khoản ngân hàng"
      subtitle="Dùng để nhận thanh toán từ hợp đồng và đơn dịch vụ"
    >
      {editing ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name: 'bankName', label: 'Tên ngân hàng', placeholder: 'VD: Vietcombank, BIDV, MB Bank…', required: true },
            { name: 'accountNumber', label: 'Số tài khoản', placeholder: 'Nhập số tài khoản', required: true },
            { name: 'accountName', label: 'Chủ tài khoản', placeholder: 'Viết HOA như trên sổ ngân hàng', required: true },
            { name: 'branch', label: 'Chi nhánh', placeholder: 'VD: Chi nhánh Hà Nội', required: false },
          ].map(({ name, label, placeholder, required }) => (
            <div key={name}>
              <Label className="text-sm font-semibold text-[#222222]">
                {label}
                {required ? (
                  <span className="text-[#c13515]"> *</span>
                ) : (
                  <span className="text-[#929292] font-normal"> (tuỳ chọn)</span>
                )}
              </Label>
              <Input
                placeholder={placeholder}
                {...(name === 'accountNumber' ? { inputMode: 'numeric' as const } : {})}
                className={cn(INPUT, 'mt-1.5')}
                {...form.register(name as keyof BankForm)}
              />
              <FieldError msg={form.formState.errors[name as keyof BankForm]?.message} />
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <PrimaryBtn loading={form.formState.isSubmitting} type="submit">
              Lưu thay đổi
            </PrimaryBtn>
            <GhostBtn type="button" onClick={() => setEditing(false)}>Huỷ</GhostBtn>
          </div>
        </form>
      ) : bank ? (
        <div>
          <div className="flex items-center gap-2 mb-5 p-3 bg-emerald-50 rounded-[10px] border border-emerald-100">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-emerald-700">
              Tài khoản ngân hàng đã được liên kết
            </span>
          </div>
          <div className="divide-y divide-[#f7f7f7]">
            <InfoRow label="Ngân hàng" value={bank.bankName} />
            <InfoRow label="Số tài khoản" value={bank.accountNumber} />
            <InfoRow label="Chủ tài khoản" value={bank.accountName} />
          </div>
          <button
            onClick={() => setEditing(true)}
            className="mt-5 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f8f0] transition-colors"
          >
            <Pencil className="size-3.5" />
            Cập nhật thông tin
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="size-14 bg-[#f7f8f0] rounded-full flex items-center justify-center mb-4">
            <CreditCard className="size-6 text-[#929292]" />
          </div>
          <p className="text-sm font-semibold text-[#222222] mb-1">
            Chưa liên kết tài khoản ngân hàng
          </p>
          <p className="text-xs text-[#6a6a6a] leading-relaxed mb-5 max-w-xs">
            Thêm tài khoản ngân hàng để nhận thanh toán khi hợp đồng hoàn thành hoặc dịch vụ được nghiệm thu.
          </p>
          <PrimaryBtn type="button" onClick={() => setEditing(true)}>
            Thêm tài khoản ngân hàng
          </PrimaryBtn>
        </div>
      )}
    </SectionCard>
  );
}

// ─── national ID section ──────────────────────────────────────────────────────

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
    <SectionCard
      id="national-id"
      icon={Fingerprint}
      title="CMND / CCCD"
      subtitle="Thông tin giấy tờ tuỳ thân — dùng trong hợp đồng thuê nhà"
    >
      {editing ? (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-[#222222]">
              Số CMND/CCCD <span className="text-[#c13515]">*</span>
            </Label>
            <Input
              placeholder="VD: 034123456789"
              inputMode="numeric"
              maxLength={12}
              className={cn(INPUT, 'mt-1.5')}
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
              className={cn(INPUT, 'mt-1.5')}
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
              className={cn(INPUT, 'mt-1.5')}
              {...form.register('issuedPlace')}
            />
            <FieldError msg={form.formState.errors.issuedPlace?.message} />
          </div>

          <div className="flex gap-2 pt-1">
            <PrimaryBtn loading={form.formState.isSubmitting} type="submit">
              Lưu thay đổi
            </PrimaryBtn>
            <GhostBtn type="button" onClick={() => setEditing(false)}>Huỷ</GhostBtn>
          </div>
        </form>
      ) : nid ? (
        <div>
          <div className="flex items-center gap-2 mb-5 p-3 bg-emerald-50 rounded-[10px] border border-emerald-100">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-emerald-700">
              Đã cập nhật thông tin giấy tờ tuỳ thân
            </span>
          </div>
          <div className="divide-y divide-[#f7f7f7]">
            <InfoRow label="Số CMND/CCCD" value={nid.number ?? '---'} />
            <InfoRow label="Ngày cấp" value={fmtDate(nid.issuedDate)} muted={!nid.issuedDate} />
            <InfoRow label="Nơi cấp" value={nid.issuedPlace ?? '---'} muted={!nid.issuedPlace} />
          </div>
          <button
            onClick={() => {
              form.reset({
                number: nid.number ?? '',
                issuedDate: nid.issuedDate ? nid.issuedDate.slice(0, 10) : '',
                issuedPlace: nid.issuedPlace ?? '',
              });
              setEditing(true);
            }}
            className="mt-5 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#222222] border border-[#dddddd] rounded-lg hover:bg-[#f7f8f0] transition-colors"
          >
            <Pencil className="size-3.5" />
            Cập nhật thông tin
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="size-14 bg-[#f7f8f0] rounded-full flex items-center justify-center mb-4">
            <Fingerprint className="size-6 text-[#929292]" />
          </div>
          <p className="text-sm font-semibold text-[#222222] mb-1">
            Chưa có thông tin giấy tờ tuỳ thân
          </p>
          <p className="text-xs text-[#6a6a6a] leading-relaxed mb-5 max-w-xs">
            Bổ sung số CMND/CCCD để hợp đồng thuê nhà được điền đầy đủ thông tin pháp lý.
          </p>
          <PrimaryBtn type="button" onClick={() => setEditing(true)}>
            Thêm CMND / CCCD
          </PrimaryBtn>
        </div>
      )}
    </SectionCard>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMeApi,
    initialData: storedUser ?? undefined,
  });

  const handleUpdate = (updated: UserType) => {
    setUser(updated);
    qc.setQueryData(['me'], updated);
  };

  if (isLoading && !storedUser) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="size-8 border-2 border-[#933a12] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-[#222222]">Hồ sơ cá nhân</h1>
        <p className="text-sm text-[#6a6a6a] mt-1">
          Quản lý thông tin và bảo mật tài khoản
        </p>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Sidebar */}
        <aside className="w-full lg:w-72 lg:sticky lg:top-24 shrink-0 space-y-4">
          <AvatarCard user={user} onUpdate={handleUpdate} />
          <StatsCard />
          <QuickLinksCard />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Account info */}
          <SectionCard
            id="info"
            icon={User}
            title="Thông tin tài khoản"
            subtitle="Thông tin cơ bản của tài khoản bạn"
          >
            <div className="divide-y divide-[#f7f7f7]">
              <InfoRow label="Họ và tên" value={user.name} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow
                label="Loại tài khoản"
                value={ROLE_META[user.role]?.label ?? user.role}
                badge={
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', ROLE_META[user.role]?.style)}>
                    &nbsp;
                  </span>
                }
              />
              <InfoRow
                label="Trạng thái"
                value={user.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hoá'}
                muted={!user.isActive}
              />
              <InfoRow
                label="Ngày tham gia"
                value={new Date(user.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
                muted
              />
            </div>
          </SectionCard>

          {/* Security */}
          <SecuritySection user={user} onUpdate={handleUpdate} />

          {/* Bank */}
          <BankSection user={user} onUpdate={handleUpdate} />

          {/* National ID */}
          <NationalIdSection user={user} onUpdate={handleUpdate} />
        </div>
      </div>
    </div>
  );
}
