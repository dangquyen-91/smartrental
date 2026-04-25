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
import { registerApi } from '@/lib/api/auth.api';
import type { User } from '@/types';

const schema = z
  .object({
    name: z.string().min(2, 'Tên ít nhất 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z
      .string()
      .regex(/^(0|\+84)\d{9}$/, 'Số điện thoại không hợp lệ')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

const inputClass =
  'h-12 border-[#dddddd] focus-visible:border-[#222222] focus-visible:ring-2 focus-visible:ring-[#222222]/20 text-[#222222] placeholder:text-[#929292]';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ name, email, phone, password }: FormData) => {
    try {
      setError('');
      const data = await registerApi({ name, email, password, phone: phone || undefined });
      setAuth(data.user as unknown as User, data.accessToken, data.refreshToken);
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Đăng ký thất bại, vui lòng thử lại.');
    }
  };

  return (
    <>
      <div>
        <h1 className="text-[1.375rem] font-bold text-[#222222]">Tạo tài khoản</h1>
        <p className="text-sm font-medium text-[#6a6a6a] mt-1">Bắt đầu tìm nhà trọ ngay hôm nay</p>
      </div>

      <GoogleButton onError={setError} />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs font-medium text-[#929292]">hoặc</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-semibold text-[#222222]">
            Họ và tên
          </Label>
          <Input id="name" placeholder="Nguyễn Văn A" className={inputClass} {...register('name')} />
          {errors.name && <p className="text-xs font-medium text-[#c13515]">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-[#222222]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className={inputClass}
            {...register('email')}
          />
          {errors.email && <p className="text-xs font-medium text-[#c13515]">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-semibold text-[#222222]">
            Số điện thoại{' '}
            <span className="text-[#929292] font-normal">(tuỳ chọn)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0912 345 678"
            className={inputClass}
            {...register('phone')}
          />
          {errors.phone && <p className="text-xs font-medium text-[#c13515]">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-semibold text-[#222222]">
            Mật khẩu
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ít nhất 6 ký tự"
              className={`${inputClass} pr-10`}
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

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[#222222]">
            Xác nhận mật khẩu
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu"
            className={inputClass}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs font-medium text-[#c13515]">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && (
          <p className="text-sm font-medium text-[#c13515] bg-[#c13515]/10 px-3 py-2.5 rounded-lg border border-[#c13515]/20">
            {error}
          </p>
        )}

        {/* Primary CTA — Rausch #ff385c */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 bg-[#ff385c] hover:bg-[#e00b41] text-white text-base font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo tài khoản'}
        </button>

        {/* Legal links use Info Blue per DESIGN.md */}
        <p className="text-xs text-center text-[#929292]">
          Bằng cách đăng ký, bạn đồng ý với{' '}
          <Link href="/terms" className="text-[#428bff] hover:underline">
            Điều khoản dịch vụ
          </Link>{' '}
          và{' '}
          <Link href="/privacy" className="text-[#428bff] hover:underline">
            Chính sách bảo mật
          </Link>
          .
        </p>
      </form>

      <p className="text-center text-sm font-medium text-[#6a6a6a]">
        Đã có tài khoản?{' '}
        <Link
          href="/login"
          className="text-[#222222] font-semibold underline underline-offset-2 hover:text-[#ff385c] transition-colors"
        >
          Đăng nhập
        </Link>
      </p>
    </>
  );
}
