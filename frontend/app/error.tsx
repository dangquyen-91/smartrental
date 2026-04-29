'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#fff0f3] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-[#222222]">Có lỗi xảy ra</h1>
        <p className="text-sm font-medium text-[#6a6a6a] mt-2">
          Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.
        </p>
        {error.digest && (
          <p className="text-xs text-[#929292] mt-2 font-mono">Mã lỗi: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={unstable_retry}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-[8px] transition-all active:scale-95"
          >
            Thử lại
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-medium text-[#222222] border border-[#dddddd] hover:bg-white rounded-[8px] transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
