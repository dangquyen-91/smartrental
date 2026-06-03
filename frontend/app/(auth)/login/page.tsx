'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import GoogleButton from '@/components/shared/google-button';
import { useAuthStore } from '@/stores/auth.store';
import { loginApi } from '@/lib/api/auth.api';
import type { User } from '@/types';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';
  const setAuth = useAuthStore((s) => s.setAuth);

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
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Email hoặc mật khẩu không đúng.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

          {/* Login form card */}
          <div className="flex flex-col items-center bg-[#F6F8FB] py-[55px] px-[65px] mb-[65px] gap-6">
            <div className="flex flex-col items-start px-[23px]">
              <span className="text-[#222222] text-[35px] font-bold">Chào mừng bạn trở lại!</span>
            </div>

            {/* Google login */}
            <GoogleButton redirectTo={from} onError={setError} />

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="bg-[#DDDDDD] w-[165px] h-[1px]" />
              <span className="text-[#929292] text-xs">hoặc</span>
              <div className="bg-[#DDDDDD] w-[165px] h-[1px]" />
            </div>

            {/* Email/Password form */}
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex flex-col items-start pr-[352px]">
                  <span className="text-[#222222] text-sm font-bold">Email</span>
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-[#222222] bg-white text-sm py-[15px] px-[10px] rounded-lg border border-solid border-[#DDDDDD] w-[400px] focus:outline-none focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/20"
                />
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center">
                  <span className="text-[#222222] text-sm font-bold mr-[247px]">Mật khẩu</span>
                  <Link href="/forgot-password" className="text-[#222222] text-xs underline underline-offset-2 hover:text-[#ff385c]">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="flex items-center py-[15px] px-[10px] gap-3.5 rounded-lg border border-solid border-[#DDDDDD] w-[400px] bg-white focus-within:border-[#222222] focus-within:ring-2 focus-within:ring-[#222222]/20">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-[#222222] bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[#929292]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#929292] hover:text-[#222222] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm font-medium text-[#c13515] bg-[#c13515]/10 px-3 py-3 rounded-lg border border-[#c13515]/20 w-full text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center bg-black text-white text-base py-3 px-[154px] rounded-lg border-0 hover:bg-[#3a3a3a] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đăng nhập'}
              </button>
            </form>

            <div className="flex flex-col items-start px-[94px]">
              <span className="text-[#6A6A6A] text-sm">
                Chưa có tài khoản?{' '}
                <Link href="/register" className="text-[#222222] font-semibold underline underline-offset-2 hover:text-[#ff385c]">
                  Đăng ký ngay
                </Link>
              </span>
            </div>
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

export default function LoginPage() {
  return <LoginForm />;
}
