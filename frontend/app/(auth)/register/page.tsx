'use client';

import { useState, useEffect, useRef } from 'react';
import type { UseFormRegister, FieldErrors, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { registerApi, googleLoginApi } from '@/lib/api/auth.api';
import { cn } from '@/lib/utils';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';
import type { User } from '@/types';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

/* ── Wave Text ── */
function SplitText({ text }: { text: string }) {
  return (
    <>
      {text.split('').map((char, i) => (
        <span key={i} className="wave-letter inline-block" style={{ opacity: 0 }}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </>
  );
}

/* ── Zod Schemas ── */
const acceptTermsError = 'Xin vui lòng đồng ý với điều khoản dịch vụ';

const acceptTermsField = z.unknown().superRefine((v, ctx) => {
  if (v !== true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: acceptTermsError,
    });
  }
});

const landlordSchema = z
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
    acceptTerms: acceptTermsField,
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
    acceptTerms: acceptTermsField,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type LandlordData = z.infer<typeof landlordSchema>;
type TenantData = z.infer<typeof tenantSchema>;
type Role = 'tenant' | 'landlord';

/* ── Shared UI Components ── */
function ErrorBox({ message }: { message: string }) {
  return (
    <p className="text-sm font-medium text-center p-3 rounded-xl border" style={{
      color: '#c13515',
      backgroundColor: 'rgba(193,53,21,0.08)',
      borderColor: 'rgba(193,53,21,0.2)',
    }}>
      {message}
    </p>
  );
}

/* ── Password Input with eye toggle ── */
function PasswordInput({
  id,
  placeholder,
  registration,
}: {
  id: string;
  placeholder: string;
  registration: ReturnType<UseFormRegister<any>>;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete="new-password"
        data-form-type="other"
        data-1p-ignore="true"
        data-lpignore="true"
        data-bwignore="true"
        data-bitwarden-watching="false"
        className="w-full px-4 pr-12 py-3 rounded-xl border text-base transition-all focus:outline-none focus:ring-2 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
        style={{ backgroundColor: '#ffffff', borderColor: '#ccc7ac', color: '#191c1d', '--tw-ring-color': '#ffef3d' } as React.CSSProperties}
        {...registration}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md cursor-pointer transition-colors hover:scale-110"
        style={{ color: '#4a4733' }}
        tabIndex={-1}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}

/* ── Google Login Button ── */
function GoogleRegisterButton({
  role,
  onError,
}: {
  role: Role;
  onError: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  // Handle token from sessionStorage (set by GoogleOAuthCallbackHandler in providers.tsx)
  useEffect(() => {
    const token = sessionStorage.getItem('google_pending_token');
    if (!token) return;
    sessionStorage.removeItem('google_pending_token');
    const savedRole = (sessionStorage.getItem('google_register_role') ?? role) as Role;
    sessionStorage.removeItem('google_register_role');
    const doLogin = async () => {
      try {
        setLoading(true);
        const data = await googleLoginApi(token, savedRole);
        setAuth(data.user as unknown as User, data.accessToken, data.refreshToken);
        router.push(savedRole === 'landlord' ? '/hosting' : '/');
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        onError(msg || 'Đăng nhập Google thất bại, vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    doLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        sessionStorage.setItem('google_oauth_source', 'register');
        sessionStorage.setItem('google_register_role', role);
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
        const redirectUri = encodeURIComponent(window.location.origin);
        const scope = encodeURIComponent('openid email profile');
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
      }}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border transition-all hover:shadow-md active:scale-95 cursor-pointer"
      style={{ backgroundColor: '#ffffff', borderColor: '#ccc7ac', color: '#191c1d' }}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" style={{ color: '#4a4733' }} />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
      )}
      <span className="text-sm font-semibold">Tiếp tục với Google</span>
    </button>
  );
}

/* ── Main Page ── */
export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const headingRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroDescRef = useRef<HTMLParagraphElement>(null);
  const heroFeaturesRef = useRef<HTMLDivElement>(null);

  const [role, setRole] = useState<Role>('tenant');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'tenant' | 'host'>('tenant');
  const tabKey = useRef(0);

  useEffect(() => {
    tabKey.current += 1;
  }, [activeTab]);

  useEffect(() => {
    gsap.registerPlugin(TextPlugin);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(
        heroTitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7 }
      )
        .fromTo(
          heroDescRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.3'
        )
        .fromTo(
          heroFeaturesRef.current?.children ?? [],
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.15 },
          '-=0.3'
        );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const el = headingRef.current;
    if (!el) return;
    const letters = el.querySelectorAll('.wave-letter');
    gsap.fromTo(
      letters,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: 'back.out(1.7)' }
    );
  }, [tabKey.current]);

  const landlordForm = useForm<LandlordData, any, LandlordData>({
    resolver: zodResolver(landlordSchema) as Resolver<LandlordData, any, LandlordData>,
  });
  const tenantForm = useForm<TenantData, any, TenantData>({
    resolver: zodResolver(tenantSchema) as Resolver<TenantData, any, TenantData>,
  });

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
      router.push(role === 'landlord' ? '/hosting' : '/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Đăng ký thất bại, vui lòng thử lại.');
    }
  };

  const switchTab = (tab: 'tenant' | 'host') => {
    setActiveTab(tab);
    setRole(tab === 'tenant' ? 'tenant' : 'landlord');
    setError('');
    tenantForm.resetField('acceptTerms');
    landlordForm.resetField('acceptTerms');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-[40px] h-16 border-b" style={{
        backgroundColor: 'rgba(248,249,250,0.8)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(204,199,172,0.3)',
      }}>
        <Link href="/" className="cursor-pointer">
          <img src="/logo/SmartRental_02.png" alt="Smart Rental" className="h-10 w-auto object-contain" />
        </Link>
        <div className="hidden md:flex gap-6">
          <a className="text-sm font-semibold transition-colors cursor-pointer" style={{ color: '#4a4733' }}
             onMouseEnter={(e) => (e.currentTarget.style.color = '#676000')}
             onMouseLeave={(e) => (e.currentTarget.style.color = '#4a4733')}
          >Tải ứng dụng</a>
          <a className="text-sm font-semibold transition-colors cursor-pointer" style={{ color: '#4a4733' }}
             onMouseEnter={(e) => (e.currentTarget.style.color = '#676000')}
             onMouseLeave={(e) => (e.currentTarget.style.color = '#4a4733')}
          >Trợ giúp</a>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Left: Hero */}
        <section className="relative w-full md:w-1/2 min-h-[300px] md:min-h-full flex flex-col justify-center px-[40px] overflow-hidden" style={{ backgroundColor: '#f3f4f5' }}>
          <img
            className="absolute inset-0 w-full h-full object-cover"
            src="/background/register.jpeg"
            alt="A sun-drenched, modern minimalist living room"
          />
          <div ref={heroRef} className="relative z-10 max-w-lg p-8 md:p-12 rounded-2xl border" style={{
            backgroundColor: 'rgba(20,18,10,0.55)',
            backdropFilter: 'blur(16px)',
            borderColor: 'rgba(255,239,61,0.25)',
          }}>
            <h1 ref={heroTitleRef} className="text-4xl font-bold leading-tight mb-6" style={{ color: '#ffffff', opacity: 0 }}>
              Bắt đầu hành trình<br />tìm kiếm tổ ấm
            </h1>
            <p ref={heroDescRef} className="text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.92)', opacity: 0 }}>
              Tham gia cộng đồng Smart Rental để khám phá hàng nghìn căn hộ, nhà nguyên căn chất lượng được xác thực mỗi ngày.
            </p>
            <div ref={heroFeaturesRef} className="flex flex-col gap-4">
              <div className="flex items-center gap-4" style={{ opacity: 0 }}>
                <span className="material-symbols-outlined p-2 rounded-lg" style={{ backgroundColor: '#ffef3d', color: '#1f1c00' }}>verified_user</span>
                <span className="text-sm font-semibold" style={{ color: '#f5f0c0' }}>Thông tin nhà cho thuê minh bạch</span>
              </div>
              <div className="flex items-center gap-4" style={{ opacity: 0 }}>
                <span className="material-symbols-outlined p-2 rounded-lg" style={{ backgroundColor: '#ffef3d', color: '#1f1c00' }}>speed</span>
                <span className="text-sm font-semibold" style={{ color: '#f5f0c0' }}>Quy trình đăng ký nhanh chóng</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Form */}
        <section className="w-full md:w-1/2 flex items-center justify-center py-12 px-4 md:px-[40px] bg-white overflow-y-auto">
          <div className="w-full max-w-md animate-stagger">
            {/* Heading */}
            <div className="mb-8">
              <h2 ref={headingRef} className="text-2xl font-semibold mb-2" style={{ color: '#191c1d' }}>
                <SplitText text="Tạo tài khoản mới" />
              </h2>
              <p className="text-base" style={{ color: '#4a4733' }}>Khám phá ngôi nhà mơ ước của bạn ngay hôm nay.</p>
            </div>

            {/* Role Tabs */}
            <div className="relative flex p-1 rounded-xl mb-8 border" style={{ backgroundColor: '#f3f4f5', borderColor: 'rgba(204,199,172,0.3)' }}>
              {/* Sliding indicator */}
              <div
                className="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg shadow-sm top-1 left-1 transition-transform duration-300"
                style={{
                  transform: activeTab === 'host' ? 'translateX(100%)' : 'translateX(0)',
                  backgroundColor: '#ffffff',
                }}
              />
              <button
                type="button"
                onClick={() => switchTab('tenant')}
                className="relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                style={{ color: activeTab === 'tenant' ? '#191c1d' : '#4a4733' }}
              >
                Tìm phòng thuê
              </button>
              <button
                type="button"
                onClick={() => switchTab('host')}
                className="relative z-10 flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer"
                style={{ color: activeTab === 'host' ? '#191c1d' : '#4a4733' }}
              >
                Cho thuê nhà
              </button>
            </div>

            {/* Google Button */}
            <>
              <GoogleRegisterButton
                role={role}
                onError={setError}
              />

              {/* Divider */}
              <div className="relative flex items-center my-8">
                <div className="flex-grow border-t" style={{ borderColor: 'rgba(204,199,172,0.5)' }} />
                <span className="flex-shrink mx-4 text-xs font-medium px-2 bg-white" style={{ color: '#4a4733' }}>hoặc</span>
                <div className="flex-grow border-t" style={{ borderColor: 'rgba(204,199,172,0.5)' }} />
              </div>
            </>

            {role === 'landlord' && (
              <LandlordForm
                form={landlordForm}
                error={error}
                onSubmit={handleRegisterSubmit}
                onError={setError}
              />
            )}
            {role === 'tenant' && (
              <TenantForm
                form={tenantForm}
                error={error}
                onSubmit={handleRegisterSubmit}
                onError={setError}
              />
            )}
            <p className="mt-10 text-center text-base" style={{ color: '#4a4733' }}>
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-bold hover:underline decoration-2 underline-offset-4 cursor-pointer transition-colors" style={{ color: '#191c1d' }}>
                Đăng nhập
              </Link>
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <PublicFooter />
    </div>
  );
}

/* ── Landlord Form ── */
function LandlordForm({
  form,
  error,
  onSubmit,
  onError,
}: {
  form: ReturnType<typeof useForm<LandlordData, any, LandlordData>>;
  error: string;
  onSubmit: (values: LandlordData) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const { register, formState: { errors, isSubmitting } } = form;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="lr-name">Họ và tên</label>
        <input
          id="lr-name"
          type="text"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          className="w-full px-4 py-3 rounded-xl border text-base transition-all focus:outline-none focus:ring-2"
          style={{ backgroundColor: '#ffffff', borderColor: '#ccc7ac', color: '#191c1d', '--tw-ring-color': '#ffef3d' } as React.CSSProperties}
          {...register('name')}
        />
        {errors.name && <p className="text-xs font-medium" style={{ color: '#c13515' }}>{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="lr-email">Email</label>
        <input
          id="lr-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-xl border text-base transition-all focus:outline-none focus:ring-2"
          style={{ backgroundColor: '#ffffff', borderColor: '#ccc7ac', color: '#191c1d', '--tw-ring-color': '#ffef3d' } as React.CSSProperties}
          {...register('email')}
        />
        {errors.email && <p className="text-xs font-medium" style={{ color: '#c13515' }}>{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="lr-phone">
          Số điện thoại <span style={{ color: '#4a4733', fontWeight: 400 }}>(tuỳ chọn)</span>
        </label>
        <input
          id="lr-phone"
          type="tel"
          autoComplete="tel"
          placeholder="0912 345 678"
          className="w-full px-4 py-3 rounded-xl border text-base transition-all focus:outline-none focus:ring-2"
          style={{ backgroundColor: '#ffffff', borderColor: '#ccc7ac', color: '#191c1d', '--tw-ring-color': '#ffef3d' } as React.CSSProperties}
          {...register('phone')}
        />
        {errors.phone && <p className="text-xs font-medium" style={{ color: '#c13515' }}>{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="lr-pwd">Mật khẩu</label>
        <PasswordInput id="lr-pwd" placeholder="Ít nhất 6 ký tự" registration={register('password')} />
        {errors.password && <p className="text-xs font-medium" style={{ color: '#c13515' }}>{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="lr-cpwd">Xác nhận mật khẩu</label>
        <PasswordInput id="lr-cpwd" placeholder="Nhập lại mật khẩu" registration={register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-xs font-medium" style={{ color: '#c13515' }}>{errors.confirmPassword.message}</p>}
      </div>

      <TermsCheckbox
        value={!!form.watch('acceptTerms')}
        onChange={(v) => form.setValue('acceptTerms', v as true, { shouldValidate: true })}
        onBlur={() => form.trigger('acceptTerms')}
        error={errors.acceptTerms?.message}
      />

      {error && <ErrorBox message={error} />}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full text-base font-semibold py-4 rounded-xl transition-all active:scale-[0.98] hover:shadow-xl cursor-pointer"
        style={{ backgroundColor: '#1b1c1b', color: '#ffffff' }}
      >
        {isSubmitting ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Đang đăng ký...</span> : 'Tiếp tục'}
      </button>
    </form>
  );
}

/* ── Tenant Form ── */
function TenantForm({
  form,
  error,
  onSubmit,
  onError,
}: {
  form: ReturnType<typeof useForm<TenantData, any, TenantData>>;
  error: string;
  onSubmit: (values: TenantData) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const { register, formState: { errors, isSubmitting } } = form;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="tn-name">Họ và tên</label>
        <input
          id="tn-name"
          type="text"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          className="w-full px-4 py-3 rounded-xl border text-base transition-all focus:outline-none focus:ring-2"
          style={{ backgroundColor: '#ffffff', borderColor: '#ccc7ac', color: '#191c1d', '--tw-ring-color': '#ffef3d' } as React.CSSProperties}
          {...register('name')}
        />
        {errors.name && <p className="text-xs font-medium" style={{ color: '#c13515' }}>{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="tn-email">Email</label>
        <input
          id="tn-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-xl border text-base transition-all focus:outline-none focus:ring-2"
          style={{ backgroundColor: '#ffffff', borderColor: '#ccc7ac', color: '#191c1d', '--tw-ring-color': '#ffef3d' } as React.CSSProperties}
          {...register('email')}
        />
        {errors.email && <p className="text-xs font-medium" style={{ color: '#c13515' }}>{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="tn-pwd">Mật khẩu</label>
        <PasswordInput id="tn-pwd" placeholder="Ít nhất 6 ký tự" registration={register('password')} />
        {errors.password && <p className="text-xs font-medium" style={{ color: '#c13515' }}>{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="tn-cpwd">Xác nhận mật khẩu</label>
        <PasswordInput id="tn-cpwd" placeholder="Nhập lại mật khẩu" registration={register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-xs font-medium" style={{ color: '#c13515' }}>{errors.confirmPassword.message}</p>}
      </div>

      <TermsCheckbox
        value={!!form.watch('acceptTerms')}
        onChange={(v) => form.setValue('acceptTerms', v as true, { shouldValidate: true })}
        onBlur={() => form.trigger('acceptTerms')}
        error={errors.acceptTerms?.message}
      />

      {error && <ErrorBox message={error} />}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full text-base font-semibold py-4 rounded-xl transition-all active:scale-[0.98] hover:shadow-xl cursor-pointer"
        style={{ backgroundColor: '#1b1c1b', color: '#ffffff' }}
      >
        {isSubmitting ? <span className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Đang đăng ký...</span> : 'Tiếp tục'}
      </button>
    </form>
  );
}

/* ── Terms Checkbox ── */
function TermsCheckbox({
  value,
  onChange,
  error,
  onBlur,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  onBlur?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-3">
        <input
          id="terms"
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'terms-error' : undefined}
          className="mt-1 w-5 h-5 rounded cursor-pointer accent-[#676000] shrink-0"
          style={error ? { outline: '2px solid #c13515', outlineOffset: 2 } : undefined}
        />
        <label htmlFor="terms" className="text-base leading-tight cursor-pointer" style={{ color: '#4a4733' }}>
          Tôi đồng ý với{' '}
          <Link href="/terms" className="font-semibold underline decoration-[#f6e633] hover:text-[#676000] transition-colors cursor-pointer">Điều khoản bảo mật</Link>
          {' '}và{' '}
          <Link href="/privacy" className="font-semibold underline decoration-[#f6e633] hover:text-[#676000] transition-colors cursor-pointer">Chính sách của Smart Rental</Link>.
        </label>
      </div>
      {error && (
        <p id="terms-error" className="text-xs font-medium pl-8" style={{ color: '#c13515' }}>
          {error}
        </p>
      )}
    </div>
  );
}
