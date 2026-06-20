'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';
import { loginApi } from '@/lib/api/auth.api';
import type { User } from '@/types';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';
  const setAuth = useAuthStore((s) => s.setAuth);
  const headingRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroDescRef = useRef<HTMLParagraphElement>(null);
  const heroFeaturesRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu ít nhất 6 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await loginApi(email, password);
      setAuth(data.user as unknown as User, data.accessToken, data.refreshToken);
      const user = data.user as unknown as User;
      router.push(user.role === 'admin' ? '/admin' : from);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Email hoặc mật khẩu không đúng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = (redirectTo?: string) => {
    router.push(redirectTo ?? from);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f9fa' }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-10 h-16 border-b" style={{ backgroundColor: 'rgba(248,249,250,0.8)', backdropFilter: 'blur(12px)', borderColor: 'rgba(204,199,172,0.3)' }}>
        <Link href="/" className="cursor-pointer">
          <img src="/logo/SmartRental_02.png" alt="Smart Rental" className="h-10 w-auto object-contain" />
        </Link>
        <div className="hidden md:flex gap-6">
          <a className="text-sm font-medium text-[#4a4733] hover:text-[#676000] transition-colors cursor-pointer" href="#">Tải ứng dụng</a>
          <a className="text-sm font-medium text-[#4a4733] hover:text-[#676000] transition-colors cursor-pointer" href="#">Trợ giúp</a>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Left: Inspiring Image & Brand Message */}
        <section
          className="relative w-full md:w-1/2 min-h-50 md:min-h-full flex flex-col justify-center px-4 md:px-10 overflow-hidden"
          style={{ backgroundColor: '#f3f4f5' }}
        >
          <img
            className="absolute inset-0 w-full h-full object-cover"
            src="/background/login.jpg"
            alt="A sun-drenched, modern minimalist living room"
          />

          <div ref={heroRef} className="relative z-10 max-w-lg p-4 md:p-12 rounded-2xl border" style={{ backgroundColor: 'rgba(20,18,10,0.55)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255,239,61,0.25)' }}>
            <h1 ref={heroTitleRef} className="text-xl md:text-4xl font-bold leading-tight mb-3 md:mb-6" style={{ color: '#ffffff', opacity: 0 }}>
              Bắt đầu hành trình<br />tìm kiếm tổ ấm
            </h1>
            <p ref={heroDescRef} className="text-sm md:text-lg leading-relaxed mb-4 md:mb-8" style={{ color: 'rgba(255,255,255,0.92)', opacity: 0 }}>
              Tham gia cộng đồng Smart Rental để khám phá hàng nghìn căn hộ, nhà nguyên căn chất lượng được xác thực mỗi ngày.
            </p>
            <div ref={heroFeaturesRef} className="flex flex-col gap-2 md:gap-4">
              <div className="flex items-center gap-3 md:gap-4" style={{ opacity: 0 }}>
                <span className="material-symbols-outlined text-base md:text-2xl p-1.5 md:p-2 rounded-lg shrink-0" style={{ backgroundColor: '#ffef3d', color: '#1f1c00' }}>verified_user</span>
                <span className="text-xs md:text-sm font-semibold" style={{ color: '#f5f0c0' }}>Thông tin nhà cho thuê minh bạch</span>
              </div>
              <div className="flex items-center gap-3 md:gap-4" style={{ opacity: 0 }}>
                <span className="material-symbols-outlined text-base md:text-2xl p-1.5 md:p-2 rounded-lg shrink-0" style={{ backgroundColor: '#ffef3d', color: '#1f1c00' }}>speed</span>
                <span className="text-xs md:text-sm font-semibold" style={{ color: '#f5f0c0' }}>Quy trình đăng ký nhanh chóng</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Login Form */}
        <section className="w-full md:w-1/2 flex items-center justify-center py-8 md:py-12 px-4 md:px-10 bg-white">
          <div className="w-full max-w-md animate-stagger">
            {/* Heading */}
            <div className="mb-8">
              <h2 ref={headingRef} className="text-2xl font-semibold mb-2" style={{ color: '#191c1d' }}>
                <SplitText text="Chào mừng bạn trở lại!" />
              </h2>
              <p className="text-base" style={{ color: '#4a4733' }}>Vui lòng đăng nhập để tiếp tục khám phá ngôi nhà mơ ước của bạn.</p>
            </div>

            {/* Google Login */}
            <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={setError} />

            {/* Divider */}
            <div className="relative flex items-center my-8">
              <div className="flex-grow border-t" style={{ borderColor: 'rgba(204,199,172,0.5)' }} />
              <span className="flex-shrink mx-4 text-xs font-medium px-2 bg-white" style={{ color: '#4a4733' }}>hoặc</span>
              <div className="flex-grow border-t" style={{ borderColor: 'rgba(204,199,172,0.5)' }} />
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-base transition-all focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#ccc7ac',
                    color: '#191c1d',
                    '--tw-ring-color': '#ffef3d',
                  } as React.CSSProperties}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold" style={{ color: '#191c1d' }} htmlFor="password">Mật khẩu</label>
                  <Link href="/forgot-password" className="text-xs font-medium hover:underline cursor-pointer" style={{ color: '#676000' }}>
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border text-base transition-all focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: '#ffffff',
                      borderColor: '#ccc7ac',
                      color: '#191c1d',
                      '--tw-ring-color': '#ffef3d',
                    } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer transition-colors hover:scale-110"
                    style={{ color: '#4a4733' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm font-medium text-center p-3 rounded-xl border" style={{ color: '#c13515', backgroundColor: 'rgba(193,53,21,0.08)', borderColor: 'rgba(193,53,21,0.2)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-base font-semibold py-4 rounded-xl transition-all active:scale-[0.98] hover:shadow-xl cursor-pointer"
                style={{ backgroundColor: '#1b1c1b', color: '#ffffff' }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Đang xử lý...
                  </span>
                ) : 'Đăng nhập'}
              </button>
            </form>

            {/* Register link */}
            <div className="mt-10 text-center">
              <p className="text-base" style={{ color: '#4a4733' }}>
                Chưa có tài khoản?{' '}
                <Link href="/register" className="font-bold hover:underline decoration-2 underline-offset-4 cursor-pointer transition-colors" style={{ color: '#191c1d' }}>
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <PublicFooter />
    </div>
  );
}

/* ── Google Login Button + Role Picker Modal ── */
import { googleLoginApi } from '@/lib/api/auth.api';

function buildGoogleOAuthUrl(redirectPath: string) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
  const redirectUri = `${window.location.origin}${redirectPath}`;
  const scope = 'openid email profile';
  return `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
}

function RolePickerModal({
  googleToken,
  onConfirm,
  onClose,
}: {
  googleToken: string;
  onConfirm: (role: 'tenant' | 'landlord') => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const pick = async (role: 'tenant' | 'landlord') => {
    setLoading(true);
    onConfirm(role);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-black mb-1">Chào mừng bạn!</h2>
          <p className="text-black/50 text-sm">Bạn dùng SmartRental với tư cách nào?</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            disabled={loading}
            onClick={() => pick('tenant')}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-black/10 hover:border-black hover:bg-[#f7f8f0] transition-all text-left"
          >
            <span className="text-2xl">🏠</span>
            <div>
              <p className="font-semibold text-black text-sm">Tôi đang tìm phòng</p>
              <p className="text-black/40 text-xs">Thuê nhà, căn hộ, phòng trọ</p>
            </div>
          </button>

          <button
            disabled={loading}
            onClick={() => pick('landlord')}
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-black/10 hover:border-black hover:bg-[#f7f8f0] transition-all text-left"
          >
            <span className="text-2xl">🏢</span>
            <div>
              <p className="font-semibold text-black text-sm">Tôi là chủ nhà</p>
              <p className="text-black/40 text-xs">Đăng tin, quản lý cho thuê</p>
            </div>
          </button>
        </div>

        <button onClick={onClose} className="text-xs text-black/30 hover:text-black/60 transition-colors">
          Huỷ
        </button>
      </div>
    </div>
  );
}

function GoogleLoginButton({ onSuccess, onError }: { onSuccess: (redirectTo?: string) => void; onError: (msg: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleGoogleToken = async (token: string, role?: 'tenant' | 'landlord') => {
    try {
      setLoading(true);
      const data = await googleLoginApi(token, role);
      const gUser = data.user as unknown as User;
      setAuth(gUser, data.accessToken, data.refreshToken);
      setPendingToken(null);
      onSuccess(gUser.role === 'admin' ? '/admin' : undefined);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 && !role) {
        setPendingToken(token);
        return;
      }
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      onError(msg || 'Đăng nhập Google thất bại, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Handle token returned via redirect (hash fragment)
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get('access_token');
    if (!token) return;
    window.history.replaceState({}, '', window.location.pathname + window.location.search);
    handleGoogleToken(token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {pendingToken && (
        <RolePickerModal
          googleToken={pendingToken}
          onConfirm={(role) => handleGoogleToken(pendingToken, role)}
          onClose={() => setPendingToken(null)}
        />
      )}

      <button
        type="button"
        onClick={() => { window.location.href = buildGoogleOAuthUrl('/login'); }}
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
    </>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
