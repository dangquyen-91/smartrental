import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-[6rem] font-bold text-[#dddddd] leading-none">404</p>
        <h1 className="text-2xl font-bold text-[#222222] mt-4">Không tìm thấy trang</h1>
        <p className="text-sm font-medium text-[#6a6a6a] mt-2">
          Trang bạn đang tìm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#ff385c] hover:bg-[#e00b41] rounded-[8px] transition-all active:scale-95"
          >
            Về trang chủ
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 text-sm font-medium text-[#222222] border border-[#dddddd] hover:bg-white rounded-[8px] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
