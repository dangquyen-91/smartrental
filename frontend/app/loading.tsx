export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#ff385c] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-[#6a6a6a]">Đang tải...</p>
      </div>
    </div>
  );
}
