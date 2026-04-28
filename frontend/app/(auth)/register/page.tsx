'use client';

import { useState } from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import GoogleButton from '@/components/shared/google-button';
import { useAuthStore } from '@/stores/auth.store';
import { registerApi, requestLandlordApi, verifyPhoneApi, getMeApi } from '@/lib/api/auth.api';
import { updateBankAccountApi } from '@/lib/api/users.api';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

// ── Schemas ──────────────────────────────────────────────────────────────────

const formSchema = z
  .object({
    name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

const tenantFormSchema = z
  .object({
    name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z
      .string()
      .refine((v) => !v || /^(0|\+84)\d{9}$/.test(v), 'Số điện thoại không hợp lệ')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP gồm 6 số').regex(/^\d+$/, 'Chỉ nhập số'),
});

const bankSchema = z.object({
  bankName: z.string().min(2, 'Vui lòng nhập tên ngân hàng'),
  accountNumber: z.string().min(6, 'Số tài khoản không hợp lệ'),
  accountName: z.string().min(2, 'Vui lòng nhập tên chủ tài khoản'),
  branch: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type TenantFormData = z.infer<typeof tenantFormSchema>;
type OtpData = z.infer<typeof otpSchema>;
type BankData = z.infer<typeof bankSchema>;
type Role = 'tenant' | 'landlord';
type Step = 'form' | 'otp' | 'bank';

// ── Styles ───────────────────────────────────────────────────────────────────

const inputClass =
  'h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292]';

const submitBtn =
  'w-full h-12 bg-[#ff385c] hover:bg-[#e00b41] text-white text-base font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center';

// ── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'h-2 rounded-full transition-all',
            i < current ? 'w-2 bg-[#ff385c]' : i === current ? 'w-5 bg-[#ff385c]' : 'w-2 bg-[#dddddd]',
          )}
        />
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  const [role, setRole] = useState<Role>('tenant');
  const [step, setStep] = useState<Step>('form');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const totalSteps = role === 'landlord' ? 3 : 2;
  const currentStepIndex = step === 'form' ? 0 : step === 'otp' ? 1 : role === 'landlord' ? 2 : 1;

  // ── Step 1: Register form ──────────────────────────────────────────────────

  const landlordForm = useForm<FormData>({ resolver: zodResolver(formSchema) });
  const tenantForm = useForm<TenantFormData>({ resolver: zodResolver(tenantFormSchema) });

  const handleRegisterSubmit = async (values: FormData | TenantFormData) => {
    try {
      setError('');
      const data = await registerApi({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
        role,
      });
      setAuth(data.user as unknown as User, data.accessToken, data.refreshToken);
      setUserId(data.user.id);

      if (role === 'landlord') {
        await requestLandlordApi();
        setStep('otp');
      } else {
        setStep('bank');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Đăng ký thất bại, vui lòng thử lại.');
    }
  };

  // ── Step 2 (landlord): OTP verification ───────────────────────────────────

  const otpForm = useForm<OtpData>({ resolver: zodResolver(otpSchema) });

  const handleOtpSubmit = async ({ otp }: OtpData) => {
    try {
      setError('');
      await verifyPhoneApi(otp);
      // Refresh user để store có role='landlord' mới nhất từ backend
      const updatedUser = await getMeApi();
      setUser(updatedUser);
      setStep('bank');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'OTP không đúng hoặc đã hết hạn.');
    }
  };

  const handleResendOtp = async () => {
    try {
      setError('');
      await requestLandlordApi();
    } catch {
      setError('Không thể gửi lại OTP, vui lòng thử lại.');
    }
  };

  // ── Step 3 / Step 2 (tenant): Bank account ────────────────────────────────

  const bankForm = useForm<BankData>({ resolver: zodResolver(bankSchema) });

  const handleBankSubmit = async (values: BankData) => {
    const id = userId || user?._id;
    if (!id) {
      setError('Không thể xác định tài khoản. Vui lòng thử lại.');
      return;
    }
    try {
      setError('');
      await updateBankAccountApi(id, values);
      router.push(role === 'landlord' ? '/hosting' : '/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Không thể lưu tài khoản ngân hàng.');
    }
  };

  const handleSkipBank = () => {
    router.push(role === 'landlord' ? '/hosting' : '/');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-[1.375rem] font-bold text-[#222222]">
          {step === 'form' && 'Tạo tài khoản'}
          {step === 'otp' && 'Xác thực số điện thoại'}
          {step === 'bank' && 'Tài khoản ngân hàng'}
        </h1>
        <p className="text-sm font-medium text-[#6a6a6a] mt-1">
          {step === 'form' && 'Bắt đầu tìm nhà trọ ngay hôm nay'}
          {step === 'otp' && 'Nhập mã OTP đã gửi đến số điện thoại của bạn'}
          {step === 'bank' && (role === 'landlord' ? 'Để nhận tiền thuê từ khách hàng' : 'Để hoàn tiền khi cần thiết')}
        </p>
      </div>

      {/* Step dots */}
      <StepDots current={currentStepIndex} total={totalSteps} />

      {/* ── STEP 1: FORM ─────────────────────────────────────────────── */}
      {step === 'form' && (
        <>
          {/* Role toggle */}
          <div className="flex items-center bg-[#f7f7f7] rounded-[10px] p-1 gap-1">
            {(['tenant', 'landlord'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setError(''); }}
                className={cn(
                  'flex-1 py-2 text-sm font-semibold rounded-[8px] transition-all',
                  role === r
                    ? 'bg-white text-[#222222] shadow-sm'
                    : 'text-[#6a6a6a] hover:text-[#222222]',
                )}
              >
                {r === 'tenant' ? 'Tìm phòng thuê' : 'Cho thuê nhà'}
              </button>
            ))}
          </div>

          {role === 'tenant' ? (
            <GoogleButton
              onError={setError}
              redirectTo="/"
              onSuccess={async (data) => {
                setUserId(data.user.id);
                setStep('bank');
              }}
            />
          ) : (
            <div className="flex items-center gap-3 bg-[#f7f7f7] border border-[#dddddd] rounded-xl px-4 py-3.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#929292] shrink-0" />
              <p className="text-xs font-medium text-[#929292]">
                Chủ nhà cần xác thực số điện thoại — vui lòng đăng ký bằng email bên dưới.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-[#929292]">hoặc</span>
            <Separator className="flex-1" />
          </div>

          {/* Landlord form (phone required) */}
          {role === 'landlord' && (
            <form onSubmit={landlordForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
              <FormFields
                register={landlordForm.register}
                errors={landlordForm.formState.errors}
                phoneRequired
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((v) => !v)}
              />
              {error && <ErrorBox message={error} />}
              <button type="submit" disabled={landlordForm.formState.isSubmitting} className={submitBtn}>
                {landlordForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tiếp tục'}
              </button>
              <TermsNote />
            </form>
          )}

          {/* Tenant form (phone optional) */}
          {role === 'tenant' && (
            <form onSubmit={tenantForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
              <FormFields
                register={tenantForm.register}
                errors={tenantForm.formState.errors}
                phoneRequired={false}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((v) => !v)}
              />
              {error && <ErrorBox message={error} />}
              <button type="submit" disabled={tenantForm.formState.isSubmitting} className={submitBtn}>
                {tenantForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tiếp tục'}
              </button>
              <TermsNote />
            </form>
          )}

          <p className="text-center text-sm font-medium text-[#6a6a6a]">
            Đã có tài khoản?{' '}
            <Link href="/login" className="text-[#222222] font-semibold underline underline-offset-2 hover:text-[#ff385c] transition-colors">
              Đăng nhập
            </Link>
          </p>
        </>
      )}

      {/* ── STEP 2 (landlord): OTP ───────────────────────────────────── */}
      {step === 'otp' && (
        <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-5">
          <div className="bg-[#f7f7f7] rounded-xl p-4 text-sm text-[#6a6a6a] leading-relaxed">
            Mã OTP gồm 6 chữ số đã được gửi đến số điện thoại bạn đăng ký. Mã có hiệu lực trong <span className="font-semibold text-[#222222]">5 phút</span>.
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#222222]">Mã OTP</Label>
            <Input
              placeholder="Nhập 6 chữ số"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              className={`${inputClass} text-center text-lg tracking-[0.5em] font-semibold`}
              {...otpForm.register('otp')}
            />
            {otpForm.formState.errors.otp && (
              <p className="text-xs font-medium text-[#c13515]">{otpForm.formState.errors.otp.message}</p>
            )}
          </div>

          {error && <ErrorBox message={error} />}

          <button type="submit" disabled={otpForm.formState.isSubmitting} className={submitBtn}>
            {otpForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác thực'}
          </button>

          <p className="text-center text-sm text-[#6a6a6a]">
            Không nhận được mã?{' '}
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-[#ff385c] font-semibold hover:underline"
            >
              Gửi lại
            </button>
          </p>
        </form>
      )}

      {/* ── STEP 3 / STEP 2 (tenant): Bank account ─────────────────── */}
      {step === 'bank' && (
        <form onSubmit={bankForm.handleSubmit(handleBankSubmit)} className="space-y-4">
          {role === 'landlord' && (
            <div className="flex items-start gap-2.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3.5">
              <CheckCircle2 className="w-4 h-4 text-[#16a34a] mt-0.5 shrink-0" />
              <p className="text-sm text-[#15803d]">
                Số điện thoại đã xác thực thành công. Bổ sung tài khoản ngân hàng để nhận thanh toán.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#222222]">Tên ngân hàng</Label>
            <Input placeholder="VD: Vietcombank, BIDV, Techcombank..." className={inputClass} {...bankForm.register('bankName')} />
            {bankForm.formState.errors.bankName && (
              <p className="text-xs font-medium text-[#c13515]">{bankForm.formState.errors.bankName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#222222]">Số tài khoản</Label>
            <Input placeholder="VD: 1234567890" className={inputClass} {...bankForm.register('accountNumber')} />
            {bankForm.formState.errors.accountNumber && (
              <p className="text-xs font-medium text-[#c13515]">{bankForm.formState.errors.accountNumber.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#222222]">Tên chủ tài khoản</Label>
            <Input placeholder="VD: NGUYEN VAN A" className={`${inputClass} uppercase`} {...bankForm.register('accountName')} />
            {bankForm.formState.errors.accountName && (
              <p className="text-xs font-medium text-[#c13515]">{bankForm.formState.errors.accountName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#222222]">
              Chi nhánh <span className="text-[#929292] font-normal">(tuỳ chọn)</span>
            </Label>
            <Input placeholder="VD: Chi nhánh Hà Nội" className={inputClass} {...bankForm.register('branch')} />
          </div>

          {error && <ErrorBox message={error} />}

          <button type="submit" disabled={bankForm.formState.isSubmitting} className={submitBtn}>
            {bankForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hoàn tất đăng ký'}
          </button>

          <button
            type="button"
            onClick={handleSkipBank}
            className="w-full h-10 text-sm font-medium text-[#6a6a6a] hover:text-[#222222] transition-colors underline underline-offset-2"
          >
            Bỏ qua, cập nhật sau
          </button>
        </form>
      )}
    </>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function FormFields({
  register,
  errors,
  phoneRequired,
  showPassword,
  onTogglePassword,
}: {
  register: UseFormRegister<LandlordData> | UseFormRegister<TenantData>;
  errors: FieldErrors<LandlordData> | FieldErrors<TenantData>;
  phoneRequired: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-sm font-semibold text-[#222222]">Họ và tên</Label>
        <Input id="name" autoComplete="name" placeholder="Nguyễn Văn A" className={inputClass} {...register('name')} />
        {errors.name && <p className="text-xs font-medium text-[#c13515]">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-semibold text-[#222222]">Email</Label>
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" className={inputClass} {...register('email')} />
        {errors.email && <p className="text-xs font-medium text-[#c13515]">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-sm font-semibold text-[#222222]">
          Số điện thoại{' '}
          {!phoneRequired && <span className="text-[#929292] font-normal">(tuỳ chọn)</span>}
          {phoneRequired && <span className="text-[#c13515]"> *</span>}
        </Label>
        <Input id="phone" type="tel" autoComplete="tel" placeholder="0912 345 678" className={inputClass} {...register('phone')} />
        {errors.phone && <p className="text-xs font-medium text-[#c13515]">{errors.phone.message}</p>}
        {phoneRequired && (
          <p className="text-xs text-[#929292]">Dùng để xác thực danh tính người cho thuê</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-semibold text-[#222222]">Mật khẩu</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Ít nhất 6 ký tự"
            className={`${inputClass} pr-10`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929292] hover:text-[#222222] transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs font-medium text-[#c13515]">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#222222]">Xác nhận mật khẩu</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          className={inputClass}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && <p className="text-xs font-medium text-[#c13515]">{errors.confirmPassword.message}</p>}
      </div>
    </>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="text-sm font-medium text-[#c13515] bg-[#c13515]/10 px-3 py-2.5 rounded-lg border border-[#c13515]/20">
      {message}
    </p>
  );
}

function TermsNote() {
  return (
    <p className="text-xs text-center text-[#929292]">
      Bằng cách đăng ký, bạn đồng ý với{' '}
      <Link href="/terms" className="text-[#428bff] hover:underline">Điều khoản dịch vụ</Link>
      {' '}và{' '}
      <Link href="/privacy" className="text-[#428bff] hover:underline">Chính sách bảo mật</Link>.
    </p>
  );
}
