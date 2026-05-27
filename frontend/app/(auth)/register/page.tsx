'use client';

import { useState } from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import GoogleButton from '@/components/shared/google-button';
import { useAuthStore } from '@/stores/auth.store';
import { registerApi, requestLandlordApi, verifyPhoneApi, getMeApi, updatePhoneApi } from '@/lib/api/auth.api';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

// ── Schemas ──────────────────────────────────────────────────────────────────

const landlordSchema = z
  .object({
    name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
    email: z.email('Email không hợp lệ'),
    phone: z.string().refine((v) => /^(0|\+84)\d{9}$/.test(v), 'Số điện thoại không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

const tenantSchema = z
  .object({
    name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
    email: z.email('Email không hợp lệ'),
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

const phoneSchema = z.object({
  phone: z.string().refine((v) => /^(0|\+84)\d{9}$/.test(v), 'Số điện thoại không hợp lệ'),
});

type LandlordData = z.infer<typeof landlordSchema>;
type TenantData = z.infer<typeof tenantSchema>;
type OtpData = z.infer<typeof otpSchema>;
type PhoneData = z.infer<typeof phoneSchema>;
type Role = 'tenant' | 'landlord';
type Step = 'form' | 'phone' | 'otp';

// ── Styles ───────────────────────────────────────────────────────────────────

const inputClass =
  'h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292]';

const submitBtn =
  'w-full h-12 bg-[#933a12] hover:bg-[#7a2f0e] text-white text-base font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center';

// ── Step indicator (chỉ cho landlord — 2 bước sau form ban đầu) ──────────────

function StepDots({ current }: { current: 0 | 1 }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {([0, 1] as const).map((i) => (
        <span
          key={i}
          className={cn(
            'h-2 rounded-full transition-all',
            i < current ? 'w-2 bg-[#933a12]' : i === current ? 'w-5 bg-[#933a12]' : 'w-2 bg-[#dddddd]',
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

  const [role, setRole] = useState<Role>('tenant');
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Step 1 (email): Register form ─────────────────────────────────────────

  const landlordForm = useForm<LandlordData>({ resolver: zodResolver(landlordSchema) });
  const tenantForm = useForm<TenantData>({ resolver: zodResolver(tenantSchema) });

  const handleRegisterSubmit = async (values: LandlordData | TenantData) => {
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

      if (role === 'landlord') {
        await requestLandlordApi();
        setStep('otp');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Đăng ký thất bại, vui lòng thử lại.');
    }
  };

  // ── Step 1 (Google, landlord): Collect phone ───────────────────────────────

  const phoneForm = useForm<PhoneData>({ resolver: zodResolver(phoneSchema) });

  const handlePhoneSubmit = async ({ phone }: PhoneData) => {
    try {
      setError('');
      const updatedUser = await updatePhoneApi(phone);
      setUser(updatedUser);
      await requestLandlordApi();
      setStep('otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Không thể cập nhật số điện thoại, vui lòng thử lại.');
    }
  };

  // ── Step 2 (landlord): OTP verification ───────────────────────────────────

  const otpForm = useForm<OtpData>({ resolver: zodResolver(otpSchema) });

  const handleOtpSubmit = async ({ otp }: OtpData) => {
    try {
      setError('');
      await verifyPhoneApi(otp);
      const updatedUser = await getMeApi();
      setUser(updatedUser);
      router.push('/hosting');
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

  // ── Render ─────────────────────────────────────────────────────────────────

  const stepDotIndex = step === 'otp' ? 1 : 0;

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-[1.375rem] font-bold text-[#222222]">
          {step === 'form' && 'Tạo tài khoản'}
          {step === 'phone' && 'Thêm số điện thoại'}
          {step === 'otp' && 'Xác thực số điện thoại'}
        </h1>
        <p className="text-sm font-medium text-[#6a6a6a] mt-1">
          {step === 'form' && 'Bắt đầu tìm nhà trọ ngay hôm nay'}
          {step === 'phone' && 'Chủ nhà cần xác thực danh tính qua số điện thoại'}
          {step === 'otp' && 'Nhập mã OTP đã gửi đến số điện thoại của bạn'}
        </p>
      </div>

      {/* Step dots — chỉ hiện cho landlord ở bước phone/otp */}
      {role === 'landlord' && step !== 'form' && (
        <StepDots current={stepDotIndex as 0 | 1} />
      )}

      {/* ── STEP 1: FORM ─────────────────────────────────────────────── */}
      {step === 'form' && (
        <>
          <div className="flex items-center bg-[#f7f8f0] rounded-[10px] p-1 gap-1">
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
            <GoogleButton onError={setError} redirectTo="/" />
          ) : (
            <GoogleButton
              onError={setError}
              onSuccess={() => setStep('phone')}
            />
          )}

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-[#929292]">hoặc</span>
            <Separator className="flex-1" />
          </div>

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
            <Link href="/login" className="text-[#222222] font-semibold underline underline-offset-2 hover:text-[#933a12] transition-colors">
              Đăng nhập
            </Link>
          </p>
        </>
      )}

      {/* ── STEP phone (landlord Google): Nhập SĐT ───────────────────── */}
      {step === 'phone' && (
        <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-5">
          <div className="bg-[#f7f8f0] rounded-xl p-4 text-sm text-[#6a6a6a] leading-relaxed">
            Chủ nhà cần xác thực số điện thoại để đảm bảo an toàn cho người thuê. Mã OTP sẽ được gửi đến số này.
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-[#222222]">
              Số điện thoại <span className="text-[#c13515]">*</span>
            </Label>
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="0912 345 678"
              inputMode="numeric"
              className={inputClass}
              {...phoneForm.register('phone')}
            />
            {phoneForm.formState.errors.phone && (
              <p className="text-xs font-medium text-[#c13515]">{phoneForm.formState.errors.phone.message}</p>
            )}
          </div>

          {error && <ErrorBox message={error} />}

          <button type="submit" disabled={phoneForm.formState.isSubmitting} className={submitBtn}>
            {phoneForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi mã OTP'}
          </button>
        </form>
      )}

      {/* ── STEP otp (landlord): Xác thực OTP ───────────────────────── */}
      {step === 'otp' && (
        <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-5">
          <div className="bg-[#f7f8f0] rounded-xl p-4 text-sm text-[#6a6a6a] leading-relaxed">
            Mã OTP gồm 6 chữ số đã được gửi đến số điện thoại bạn đăng ký. Mã có hiệu lực trong{' '}
            <span className="font-semibold text-[#222222]">5 phút</span>.
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
              className="text-[#933a12] font-semibold hover:underline"
            >
              Gửi lại
            </button>
          </p>
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
