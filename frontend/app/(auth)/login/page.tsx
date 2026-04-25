'use client';

import { useState } from 'react';
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
import { loginApi } from '@/lib/api/auth.api';
import type { User } from '@/types';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, password }: FormData) => {
    try {
      setError('');
      const data = await loginApi(email, password);
      setAuth(data.user as unknown as User, data.accessToken, data.refreshToken);
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Email hoặc mật khẩu không đúng.');
    }
  };

  return (
    <>
      <div>
        <h1 className="text-[1.375rem] font-bold text-[#222222]">Chào mừng trở lại</h1>
        <p className="text-sm font-medium text-[#6a6a6a] mt-1">Đăng nhập để tiếp tục</p>
      </div>

      <GoogleButton onError={setError} />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium text-[#929292]">hoặc</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-[#222222]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292]"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs font-medium text-[#c13515]">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold text-[#222222]">
              Mật khẩu
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[#222222] underline underline-offset-2 hover:text-[#ff385c] transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ít nhất 6 ký tự"
              className="h-12 pr-10 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292]"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929292] hover:text-[#222222] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-[#c13515]">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <p className="text-sm font-medium text-[#c13515] bg-[#c13515]/10 px-3 py-2.5 rounded-lg border border-[#c13515]/20">
            {error}
          </p>
        )}

        {/* Primary CTA — Rausch #ff385c, native button to avoid CVA conflicts */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-[#ff385c] hover:bg-[#e00b41] text-white text-base font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Đăng nhập'}
        </button>
      </form>

      <p className="text-center text-sm font-medium text-[#6a6a6a]">
        Chưa có tài khoản?{' '}
        <Link
          href="/register"
          className="text-[#222222] font-semibold underline underline-offset-2 hover:text-[#ff385c] transition-colors"
        >
          Đăng ký ngay
        </Link>
      </p>
    </>
  );
}
