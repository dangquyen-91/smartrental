'use client';

import { useEffect } from 'react';

export default function GlobalError({
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
    <html lang="vi">
      <body className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-6 font-sans">
        <div className="max-w-md w-full text-center">
          <p className="text-[5rem] font-bold text-[#dddddd] leading-none">500</p>
          <h1 className="text-2xl font-bold text-[#222222] mt-4">Lỗi hệ thống</h1>
          <p className="text-sm font-medium text-[#6a6a6a] mt-2">
            Đã xảy ra lỗi nghiêm trọng. Chúng tôi đang xử lý.
          </p>
          <button
            onClick={unstable_retry}
            className="mt-8 px-5 py-2.5 text-sm font-medium text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-[8px] transition-all"
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
