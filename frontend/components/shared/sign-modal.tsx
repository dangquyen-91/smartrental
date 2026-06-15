'use client';

import React, { useState } from 'react';
import {
  PenLine, X, Loader2, Eye, EyeOff, ShieldCheck,
  CheckCircle2, Home, CalendarDays, User2, Wallet,
  ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import { verifyGoogleApi } from '@/lib/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { asProperty, asUser, asBooking, formatDate, getPrimaryImage } from '@/lib/contract-utils';
import type { Contract } from '@/types';

// ─── google icon ──────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg className="size-5 shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// ─── step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Xem hợp đồng' },
  { label: 'Đồng ý' },
  { label: 'Xác thực' },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center mb-6">
      {STEPS.map((step, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                done ? 'bg-[#222222] text-white'
                  : active ? 'bg-[#ff385c] text-white shadow-[0_0_0_3px_rgba(255,56,92,0.18)]'
                  : 'bg-[#ebebeb] text-[#b0b0b0]',
              )}>
                {done ? <CheckCircle2 className="size-4" /> : idx}
              </div>
              <span className={cn(
                'text-[10px] font-medium whitespace-nowrap',
                active ? 'text-[#ff385c]' : done ? 'text-[#222222]' : 'text-[#b0b0b0]',
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'w-10 h-0.5 mx-1 mb-4 rounded-full transition-colors',
                done ? 'bg-[#222222]' : 'bg-[#ebebeb]',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── step 1: contract review ──────────────────────────────────────────────────

function StepReview({ contract }: { contract: Contract }) {
  const property = asProperty(contract.property);
  const tenant = asUser(contract.tenant);
  const landlord = asUser(contract.landlord);
  const booking = asBooking(contract.booking);
  const imgUrl = property ? getPrimaryImage(property) : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 p-3 bg-[#f7f7f7] rounded-xl">
        <div className="size-14 rounded-lg overflow-hidden shrink-0 bg-[#ebebeb]">
          {imgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center">
              <Home className="size-5 text-[#b0b0b0]" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#222222] leading-snug line-clamp-2">
            {property?.title ?? 'Hợp đồng thuê phòng'}
          </p>
          {property?.address && (
            <p className="text-xs text-[#6a6a6a] mt-0.5 line-clamp-1">
              {[property.address.district, property.address.city].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InfoRow icon={<User2 className="size-3.5" />} label="Người thuê" value={tenant?.name ?? '—'} />
        <InfoRow icon={<User2 className="size-3.5" />} label="Chủ nhà" value={landlord?.name ?? '—'} />
        {booking && (
          <>
            <InfoRow icon={<CalendarDays className="size-3.5" />} label="Bắt đầu" value={formatDate(booking.startDate)} />
            <InfoRow icon={<CalendarDays className="size-3.5" />} label="Kết thúc" value={formatDate(booking.endDate)} />
            <div className="col-span-2">
              <InfoRow
                icon={<Wallet className="size-3.5" />}
                label="Giá thuê / tháng"
                value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  booking.totalPrice / (booking.duration || 1),
                )}
                highlight
              />
            </div>
          </>
        )}
      </div>

      {contract.terms && (
        <div>
          <p className="text-[11px] font-semibold text-[#6a6a6a] uppercase tracking-wide mb-1.5">
            Điều khoản hợp đồng
          </p>
          <div className="bg-[#f7f7f7] rounded-xl p-3 max-h-36 overflow-y-auto">
            <p className="text-xs text-[#6a6a6a] leading-relaxed whitespace-pre-wrap">{contract.terms}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon, label, value, highlight,
}: {
  icon: React.ReactElement;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn('p-2.5 rounded-xl', highlight ? 'bg-amber-50' : 'bg-[#f7f7f7]')}>
      <div className={cn('flex items-center gap-1 mb-0.5', highlight ? 'text-amber-600' : 'text-[#929292]')}>
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <p className={cn('text-sm font-semibold truncate', highlight ? 'text-amber-700' : 'text-[#222222]')}>
        {value}
      </p>
    </div>
  );
}

// ─── step 2: agreement ────────────────────────────────────────────────────────

function StepAgree({ agreed, onChange }: { agreed: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center gap-2 py-2">
        <div className="size-12 bg-amber-50 rounded-full flex items-center justify-center">
          <PenLine className="size-6 text-amber-600" />
        </div>
        <h4 className="text-[15px] font-semibold text-[#222222]">Xác nhận đồng ý</h4>
        <p className="text-sm text-[#6a6a6a] max-w-xs leading-relaxed">
          Trước khi ký, hãy xác nhận bạn đã đọc và hiểu toàn bộ nội dung hợp đồng.
        </p>
      </div>

      <button
        onClick={() => onChange(!agreed)}
        className={cn(
          'w-full flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left',
          agreed ? 'border-[#222222] bg-[#f7f7f7]' : 'border-[#dddddd] bg-white hover:border-[#b0b0b0]',
        )}
      >
        <div className={cn(
          'size-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors',
          agreed ? 'bg-[#222222]' : 'bg-white border-2 border-[#dddddd]',
        )}>
          {agreed && <CheckCircle2 className="size-3.5 text-white" />}
        </div>
        <p className="text-sm text-[#222222] leading-relaxed">
          Tôi đã đọc và đồng ý với tất cả điều khoản trong hợp đồng. Chữ ký điện tử này có
          giá trị pháp lý tương đương chữ ký tay.
        </p>
      </button>

      {agreed && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">Bạn đã đồng ý với các điều khoản.</p>
        </div>
      )}
    </div>
  );
}

// ─── step 3: identity — google ────────────────────────────────────────────────

function StepIdentityGoogle({
  onTrigger,
  busy,
  error,
}: {
  onTrigger: () => void;
  busy: boolean;
  error: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center gap-2 py-2">
        <div className="size-12 bg-blue-50 rounded-full flex items-center justify-center">
          <ShieldCheck className="size-6 text-blue-600" />
        </div>
        <h4 className="text-[15px] font-semibold text-[#222222]">Xác minh danh tính</h4>
        <p className="text-sm text-[#6a6a6a] max-w-xs leading-relaxed">
          Để bảo vệ chữ ký điện tử của bạn, hãy xác nhận lại danh tính qua Google.
        </p>
      </div>

      <button
        onClick={onTrigger}
        disabled={busy}
        className="w-full h-12 flex items-center justify-center gap-3 text-sm font-semibold text-[#222222] bg-white border-2 border-[#dddddd] rounded-xl hover:border-[#222222] hover:bg-[#f7f7f7] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {busy ? (
          <>
            <Loader2 className="size-4 animate-spin text-[#929292]" />
            Đang xác thực...
          </>
        ) : (
          <>
            <GoogleIcon />
            Tiếp tục với Google
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="size-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <p className="text-xs text-[#929292] text-center leading-relaxed">
        Một cửa sổ Google sẽ mở ra. Chọn đúng tài khoản đang đăng nhập để xác minh.
      </p>
    </div>
  );
}

// ─── step 3: identity — password ─────────────────────────────────────────────

function StepIdentityPassword({
  password,
  onPasswordChange,
  showPw,
  onTogglePw,
  pwError,
  disabled,
}: {
  password: string;
  onPasswordChange: (v: string) => void;
  showPw: boolean;
  onTogglePw: () => void;
  pwError: string;
  disabled: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center gap-2 py-2">
        <div className="size-12 bg-blue-50 rounded-full flex items-center justify-center">
          <ShieldCheck className="size-6 text-blue-600" />
        </div>
        <h4 className="text-[15px] font-semibold text-[#222222]">Xác minh danh tính</h4>
        <p className="text-sm text-[#6a6a6a] max-w-xs leading-relaxed">
          Nhập mật khẩu tài khoản để xác nhận chữ ký điện tử.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#222222] mb-2">
          Mật khẩu tài khoản
        </label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Nhập mật khẩu của bạn"
            disabled={disabled}
            className={cn(
              'w-full h-11 px-3 pr-10 text-sm text-[#222222] placeholder:text-[#929292] bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#222222]/10 transition-colors disabled:bg-[#f7f7f7] disabled:cursor-not-allowed',
              pwError ? 'border-red-400 focus:border-red-400' : 'border-[#dddddd] focus:border-[#222222]',
            )}
          />
          <button
            type="button"
            onClick={onTogglePw}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#929292] hover:text-[#222222]"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {pwError && <p className="mt-1.5 text-xs text-red-500">{pwError}</p>}
      </div>
    </div>
  );
}

// ─── step 4: success ──────────────────────────────────────────────────────────

function StepSuccess({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-6">
      <div className="size-16 bg-emerald-50 rounded-full flex items-center justify-center">
        <CheckCircle2 className="size-9 text-emerald-500" />
      </div>
      <div>
        <h4 className="text-lg font-semibold text-[#222222] mb-1">Ký hợp đồng thành công!</h4>
        <p className="text-sm text-[#6a6a6a] leading-relaxed max-w-xs">
          Chữ ký điện tử của bạn đã được ghi nhận. Hợp đồng sẽ có hiệu lực khi tất cả các bên đã ký.
        </p>
      </div>
      <button
        onClick={onClose}
        className="mt-2 px-8 py-2.5 text-sm font-semibold text-white bg-[#222222] hover:bg-[#111111] rounded-xl transition-colors"
      >
        Đóng
      </button>
    </div>
  );
}

// ─── main modal ───────────────────────────────────────────────────────────────

export function SignModal({
  contract,
  onConfirm,
  onClose,
  isPending,
}: {
  contract: Contract;
  onConfirm: (onSuccess: () => void) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [success, setSuccess] = useState(false);

  const isGoogleUser = useAuthStore((s) => s.user?.authProvider === 'google');
  const busy = isVerifying || isPending;

  // Google re-auth: triggered only on step 3 for Google users
  const triggerGoogleReauth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsVerifying(true);
      setGoogleError('');
      try {
        await verifyGoogleApi(tokenResponse.access_token);
        setIsVerifying(false);
        onConfirm(() => setSuccess(true));
      } catch {
        setGoogleError('Xác thực Google thất bại. Vui lòng thử lại.');
        setIsVerifying(false);
      }
    },
    onError: () => {
      setGoogleError('Không thể kết nối Google. Vui lòng thử lại.');
    },
  });

  const canAdvanceLocal = step === 1 || (step === 2 && agreed) || (step === 3 && password.length > 0);

  const handleNext = async () => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    // step 3 local password path
    setPwError('');
    setIsVerifying(true);
    try {
      await api.post('/auth/verify-password', { password });
      setIsVerifying(false);
      onConfirm(() => setSuccess(true));
    } catch {
      setPwError('Mật khẩu không đúng. Vui lòng thử lại.');
      setIsVerifying(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
          <StepSuccess onClose={onClose} />
        </div>
      </div>
    );
  }

  const isStep3Google = step === 3 && isGoogleUser;
  const isStep3Local = step === 3 && !isGoogleUser;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={busy ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90dvh] overflow-y-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[17px] font-semibold text-[#222222]">Ký hợp đồng điện tử</h3>
          {!busy && (
            <button
              onClick={onClose}
              className="size-8 flex items-center justify-center rounded-full bg-[#f7f7f7] hover:bg-[#dddddd] transition-colors"
            >
              <X className="size-4 text-[#222222]" />
            </button>
          )}
        </div>

        {/* step indicator */}
        <StepIndicator current={step} />

        {/* step content */}
        <div>
          {step === 1 && <StepReview contract={contract} />}
          {step === 2 && <StepAgree agreed={agreed} onChange={setAgreed} />}
          {isStep3Google && (
            <StepIdentityGoogle
              onTrigger={() => triggerGoogleReauth()}
              busy={busy}
              error={googleError}
            />
          )}
          {isStep3Local && (
            <StepIdentityPassword
              password={password}
              onPasswordChange={(v) => { setPassword(v); setPwError(''); }}
              showPw={showPw}
              onTogglePw={() => setShowPw((v) => !v)}
              pwError={pwError}
              disabled={busy}
            />
          )}
        </div>

        {/* footer */}
        <div className="flex gap-3 mt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={busy}
              className="flex items-center gap-1 px-4 py-2.5 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-xl hover:bg-[#f7f7f7] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="size-4" />
              Quay lại
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-[#222222] border border-[#dddddd] rounded-xl hover:bg-[#f7f7f7] transition-colors"
            >
              Huỷ
            </button>
          )}

          {/* Google users on step 3 use the Google button inside StepIdentityGoogle — no confirm button here */}
          {!isStep3Google && (
            <button
              onClick={handleNext}
              disabled={!canAdvanceLocal || busy}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                isStep3Local ? 'bg-[#ff385c] hover:bg-[#e00b41]' : 'bg-[#222222] hover:bg-[#111111]',
              )}
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isVerifying ? 'Đang xác thực...' : 'Đang ký...'}
                </>
              ) : isStep3Local ? (
                <>
                  <PenLine className="size-4" />
                  Xác nhận ký
                </>
              ) : (
                <>
                  Tiếp theo
                  <ChevronRight className="size-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
