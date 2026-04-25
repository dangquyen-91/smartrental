import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel — Ink Black, photography-inspired dark surface */}
      <div className="hidden lg:flex flex-col bg-[#222222] p-12 relative overflow-hidden">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 z-10">
          <span className="font-bold text-xl tracking-tight">
            <span className="text-white">Smart</span>
            <span className="text-[#ff385c]">Rental</span>
          </span>
        </Link>

        {/* Main content — anchored to bottom */}
        <div className="mt-auto z-10 space-y-8">
          <div className="space-y-3">
            <p className="text-[2rem] font-bold leading-tight text-white">
              Tìm nhà trọ phù hợp,
              <br />
              dễ dàng và nhanh chóng.
            </p>
            <p className="text-base font-medium text-[#929292]">
              Hàng nghìn phòng trọ, căn hộ, nhà nguyên căn đang chờ bạn khám phá.
            </p>
          </div>

          <div className="space-y-3">
            {[
              '10.000+ tin đăng đã xác minh',
              'Chủ nhà được xét duyệt kỹ lưỡng',
              'Hợp đồng điện tử tiện lợi',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff385c] shrink-0" />
                <p className="text-sm font-medium text-[#c1c1c1]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle decorative circles — very low opacity */}
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-white/3 pointer-events-none" />
        <div className="absolute top-1/3 -left-20 w-56 h-56 rounded-full bg-white/3 pointer-events-none" />
      </div>

      {/* Right panel — white form area */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile-only logo */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="font-bold text-xl tracking-tight">
              <span className="text-[#222222]">Smart</span>
              <span className="text-[#ff385c]">Rental</span>
            </span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
