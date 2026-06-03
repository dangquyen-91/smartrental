'use client';

import { useState } from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import GoogleButton from '@/components/shared/google-button';
import { useAuthStore } from '@/stores/auth.store';
import { registerApi, requestLandlordApi, verifyPhoneApi, getMeApi, updatePhoneApi } from '@/lib/api/auth.api';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

const landlordSchema = z
  .object({
    name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
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

const phoneSchema = z.object({
  phone: z.string().refine((v) => /^(0|\+84)\d{9}$/.test(v), 'Số điện thoại không hợp lệ'),
});

type LandlordData = z.infer<typeof landlordSchema>;
type TenantData = z.infer<typeof tenantSchema>;
type OtpData = z.infer<typeof otpSchema>;
type PhoneData = z.infer<typeof phoneSchema>;
type Role = 'tenant' | 'landlord';
type Step = 'form' | 'phone' | 'otp';

function StepDots({ current }: { current: 0 | 1 }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {([0, 1] as const).map((i) => (
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

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);

  const [role, setRole] = useState<Role>('tenant');
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const landlordForm = useForm<LandlordData>({ resolver: zodResolver(landlordSchema) });
  const tenantForm = useForm<TenantData>({ resolver: zodResolver(tenantSchema) });
  const phoneForm = useForm<PhoneData>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpData>({ resolver: zodResolver(otpSchema) });

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

  const stepDotIndex = step === 'otp' ? 1 : 0;

  return (
    <div className="flex flex-col bg-white">
      {/* Hero background */}
      <div
        className="self-stretch bg-white pb-[3px]"
        style={{
          backgroundImage: 'url(https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/879587f2-2234-4abb-8764-323ff1c58d50)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex flex-col items-center self-stretch pt-[22px]">
          {/* Top bar */}
          <div className="flex justify-between items-center self-stretch mb-[156px] mx-20">
            <Link href="/">
              <img
                src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/8ddaeb3f-3754-4581-926f-0edfe9e73c78"
                className="w-[182px] h-[26px] object-fill cursor-pointer"
                alt="SmartRental"
              />
            </Link>
            <div className="flex shrink-0 items-center px-2 gap-2" />
          </div>

          {/* Hero image */}
          <img
            src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/9b00bf18-b6a5-408b-a0d7-2ab62b36f961"
            className="w-[943px] h-[110px] mb-[57px] object-fill"
            alt=""
          />

          {/* Hero text */}
          <span className="text-black text-[35px] text-center w-[361px] mb-6">
            Tìm nhà trọ phù hợp,
            <br />dễ dàng và nhanh chóng
          </span>
          <span className="text-black text-xl mb-[71px]">
            Hàng nghìn phòng trọ, căn hộ, nhà nguyên căn đang chờ bạn khám phá.
          </span>

          {/* Register form card */}
          <div className="flex flex-col items-center bg-[#F6F8FB] py-[55px] px-[65px] mb-[65px] gap-6">
            <div className="flex flex-col items-start px-[23px]">
              <span className="text-[#222222] text-[35px] font-bold">Tạo tài khoản mới!</span>
            </div>

            {/* Role toggle */}
            <div className="flex items-center bg-white rounded-[10px] p-1 gap-1">
              {(['tenant', 'landlord'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setError(''); }}
                  className={cn(
                    'flex-1 py-2 px-4 text-sm font-semibold rounded-[8px] transition-all',
                    role === r
                      ? 'bg-[#222222] text-white'
                      : 'text-[#6a6a6a] hover:text-[#222222]',
                  )}
                >
                  {r === 'tenant' ? 'Tìm phòng thuê' : 'Cho thuê nhà'}
                </button>
              ))}
            </div>

            {/* Google button */}
            {role === 'tenant' ? (
              <GoogleButton onError={setError} redirectTo="/" />
            ) : (
              <GoogleButton
                onError={setError}
                onSuccess={() => setStep('phone')}
              />
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="bg-[#DDDDDD] w-[165px] h-[1px]" />
              <span className="text-[#929292] text-xs">hoặc</span>
              <div className="bg-[#DDDDDD] w-[165px] h-[1px]" />
            </div>

            {/* Step dots for landlord */}
            {role === 'landlord' && step !== 'form' && (
              <StepDots current={stepDotIndex as 0 | 1} />
            )}

            {/* STEP 1: FORM */}
            {step === 'form' && (
              <>
                {role === 'landlord' && (
                  <form onSubmit={landlordForm.handleSubmit(handleRegisterSubmit)} className="flex flex-col items-center gap-4">
                    <FormFields
                      register={landlordForm.register}
                      errors={landlordForm.formState.errors}
                      phoneRequired
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword((v) => !v)}
                    />
                    {error && <ErrorBox message={error} />}
                    <button
                      type="submit"
                      disabled={landlordForm.formState.isSubmitting}
                      className="flex items-center justify-center bg-black text-white text-base py-3 px-[154px] rounded-lg border-0 hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
                    >
                      {landlordForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tiếp tục'}
                    </button>
                    <TermsNote />
                  </form>
                )}

                {role === 'tenant' && (
                  <form onSubmit={tenantForm.handleSubmit(handleRegisterSubmit)} className="flex flex-col items-center gap-4">
                    <FormFields
                      register={tenantForm.register}
                      errors={tenantForm.formState.errors}
                      phoneRequired={false}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword((v) => !v)}
                    />
                    {error && <ErrorBox message={error} />}
                    <button
                      type="submit"
                      disabled={tenantForm.formState.isSubmitting}
                      className="flex items-center justify-center bg-black text-white text-base py-3 px-[154px] rounded-lg border-0 hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
                    >
                      {tenantForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tiếp tục'}
                    </button>
                    <TermsNote />
                  </form>
                )}

                <p className="text-[#6A6A6A] text-sm">
                  Đã có tài khoản?{' '}
                  <Link href="/login" className="text-[#222222] font-semibold underline underline-offset-2 hover:text-[#ff385c]">
                    Đăng nhập ngay
                  </Link>
                </p>
              </>
            )}

            {/* STEP phone (landlord Google): Nhập SĐT */}
            {step === 'phone' && (
              <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="flex flex-col items-center gap-4">
                <div className="bg-white rounded-xl p-4 text-sm text-[#6a6a6a] leading-relaxed">
                  Chủ nhà cần xác thực số điện thoại để đảm bảo an toàn cho người thuê. Mã OTP sẽ được gửi đến số này.
                </div>

                <div className="flex flex-col items-start gap-1.5 w-[400px]">
                  <span className="text-[#222222] text-sm font-bold">Số điện thoại <span className="text-[#c13515]">*</span></span>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    inputMode="numeric"
                    className="text-[#222222] bg-white text-sm py-[15px] px-[10px] rounded-lg border border-[#DDDDDD] w-full focus:outline-none focus:border-[#222222]"
                    {...phoneForm.register('phone')}
                  />
                  {phoneForm.formState.errors.phone && (
                    <p className="text-xs font-medium text-[#c13515]">{phoneForm.formState.errors.phone.message}</p>
                  )}
                </div>

                {error && <ErrorBox message={error} />}

                <button
                  type="submit"
                  disabled={phoneForm.formState.isSubmitting}
                  className="flex items-center justify-center bg-black text-white text-base py-3 px-[154px] rounded-lg border-0 hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
                >
                  {phoneForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi mã OTP'}
                </button>
              </form>
            )}

            {/* STEP otp (landlord): Xác thực OTP */}
            {step === 'otp' && (
              <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="flex flex-col items-center gap-4">
                <div className="bg-white rounded-xl p-4 text-sm text-[#6a6a6a] leading-relaxed">
                  Mã OTP gồm 6 chữ số đã được gửi đến số điện thoại bạn đăng ký. Mã có hiệu lực trong{' '}
                  <span className="font-semibold text-[#222222]">5 phút</span>.
                </div>

                <div className="flex flex-col items-start gap-1.5 w-[400px]">
                  <span className="text-[#222222] text-sm font-bold">Mã OTP</span>
                  <input
                    placeholder="Nhập 6 chữ số"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className="text-[#222222] bg-white text-sm py-[15px] px-[10px] rounded-lg border border-[#DDDDDD] w-full focus:outline-none focus:border-[#222222] text-center text-lg tracking-[0.5em] font-semibold"
                    {...otpForm.register('otp')}
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-xs font-medium text-[#c13515]">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                {error && <ErrorBox message={error} />}

                <button
                  type="submit"
                  disabled={otpForm.formState.isSubmitting}
                  className="flex items-center justify-center bg-black text-white text-base py-3 px-[154px] rounded-lg border-0 hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
                >
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
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col self-stretch bg-[#FFF546] py-10 px-20 gap-8 border-t border-solid border-[#DDDDDD]">
        <div className="flex items-center self-stretch gap-8">
          <div className="flex flex-1 flex-col items-start pb-[90px] gap-3">
            <img
              src="https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/425bd9ed-f651-4d62-b267-8df70b58f710"
              className="w-[182px] h-[25px] object-fill"
              alt="SmartRental"
            />
            <span className="text-black text-sm">
              Nền tảng thuê nhà thông minh cho thị trường Việt Nam.
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-[11px]">
            <span className="text-black text-sm font-bold">Hỗ trợ</span>
            <div className="flex flex-col self-stretch gap-2">
              <span className="text-[#6A6A6A] text-sm pt-[3px]">Trung tâm trợ giúp</span>
              <span className="text-[#6A6A6A] text-sm pt-[3px]">Liên hệ</span>
              <span className="text-[#6A6A6A] text-sm pt-[3px]">Chính sách bảo mật</span>
              <span className="text-[#6A6A6A] text-sm pt-[3px]">Điều khoản sử dụng</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-[11px]">
            <span className="text-black text-sm font-bold">Dành cho chủ nhà</span>
            <div className="flex flex-col self-stretch gap-2">
              <span className="text-[#6A6A6A] text-sm pt-[3px]">Đăng tin cho thuê</span>
              <span className="text-[#6A6A6A] text-sm pt-[3px]">Quản lý đặt phòng</span>
              <span className="text-[#6A6A6A] text-sm pt-[3px]">Hợp đồng điện tử</span>
              <span className="text-[#6A6A6A] text-sm pt-[3px]">Gói dịch vụ</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-start self-stretch pt-[25px] border-t border-solid border-[#6C6C6C]">
          <span className="text-[#6C6C6C] text-xs">© 2026 Smart Rental. Nền tảng thuê nhà thông minh.</span>
          <div className="w-[202px] h-[15px]" />
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex flex-col items-start gap-1.5">
        <span className="text-[#222222] text-sm font-bold">Họ và tên</span>
        <input
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          className="text-[#222222] bg-white text-sm py-[15px] px-[10px] rounded-lg border border-[#DDDDDD] w-[400px] focus:outline-none focus:border-[#222222]"
          {...register('name')}
        />
        {errors.name && <p className="text-xs font-medium text-[#c13515]">{errors.name.message as string}</p>}
      </div>

      <div className="flex flex-col items-start gap-1.5">
        <span className="text-[#222222] text-sm font-bold">Email</span>
        <input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="text-[#222222] bg-white text-sm py-[15px] px-[10px] rounded-lg border border-[#DDDDDD] w-[400px] focus:outline-none focus:border-[#222222]"
          {...register('email')}
        />
        {errors.email && <p className="text-xs font-medium text-[#c13515]">{errors.email.message as string}</p>}
      </div>

      {phoneRequired && (
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-[#222222] text-sm font-bold">Số điện thoại <span className="text-[#c13515]">*</span></span>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="0912 345 678"
            className="text-[#222222] bg-white text-sm py-[15px] px-[10px] rounded-lg border border-[#DDDDDD] w-[400px] focus:outline-none focus:border-[#222222]"
            {...register('phone')}
          />
          {errors.phone && <p className="text-xs font-medium text-[#c13515]">{errors.phone.message as string}</p>}
          <p className="text-xs text-[#929292]">Dùng để xác thực danh tính người cho thuê</p>
        </div>
      )}

      <div className="flex flex-col items-start gap-1.5">
        <span className="text-[#222222] text-sm font-bold">Mật khẩu</span>
        <div className="flex items-center py-[15px] px-[10px] gap-3.5 rounded-lg border border-[#DDDDDD] w-[400px] bg-white focus-within:border-[#222222]">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Ít nhất 6 ký tự"
            className="text-[#222222] bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[#929292]"
            {...register('password')}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="text-[#929292] hover:text-[#222222] transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs font-medium text-[#c13515]">{errors.password.message as string}</p>}
      </div>

      <div className="flex flex-col items-start gap-1.5">
        <span className="text-[#222222] text-sm font-bold">Xác nhận mật khẩu</span>
        <input
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          className="text-[#222222] bg-white text-sm py-[15px] px-[10px] rounded-lg border border-[#DDDDDD] w-[400px] focus:outline-none focus:border-[#222222]"
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && <p className="text-xs font-medium text-[#c13515]">{errors.confirmPassword.message as string}</p>}
      </div>
    </>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="text-sm font-medium text-[#c13515] bg-[#c13515]/10 px-3 py-3 rounded-lg border border-[#c13515]/20 w-[400px] text-center">
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
