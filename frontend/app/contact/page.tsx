import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Liên hệ | Smart Rental',
  description:
    'Liên hệ với đội ngũ Smart Rental để được hỗ trợ về cho thuê phòng trọ, căn hộ và các dịch vụ trên nền tảng.',
  openGraph: {
    title: 'Liên hệ | Smart Rental',
    description: 'Liên hệ với đội ngũ Smart Rental để được hỗ trợ nhanh chóng.',
    url: 'https://www.smartrental.io.vn/contact',
  },
};

const CONTACT_CHANNELS = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Email hỗ trợ',
    value: 'uyenuyenmitoyo@gmail.com',
    href: 'mailto:uyenuyenmitoyo@gmail.com',
    note: 'Phản hồi trong 24 giờ làm việc',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    label: 'Hotline trực tuyến',
    value: '090 9562 004',
    href: 'tel:0909562004',
    note: 'Thứ 2 – Thứ 6, 8:00 – 17:30',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    label: 'Người phụ trách',
    value: 'Nguyễn Vũ Thu Uyên',
    href: null,
    note: 'Quản lý vận hành & hỗ trợ khách hàng',
  },
];

const RESPONSE_TIMES = [
  { channel: 'Email', time: '≤ 24 giờ làm việc' },
  { channel: 'Hotline', time: 'Ngay lập tức (giờ hành chính)' },
  { channel: 'Khiếu nại', time: '03–05 ngày làm việc' },
];

const QUICK_LINKS = [
  { href: '/guide', label: 'Trung tâm trợ giúp', desc: 'Hướng dẫn sử dụng từng bước' },
  { href: '/terms', label: 'Điều khoản sử dụng', desc: 'Quy chế hoạt động nền tảng' },
  { href: '/policy', label: 'Chính sách kiểm duyệt', desc: 'Tiêu chuẩn tin đăng & thanh toán' },
  { href: '/privacy', label: 'Chính sách bảo mật', desc: 'Bảo vệ dữ liệu cá nhân' },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-white py-16 px-4 md:px-10 border-b border-[#ebebeb]">
          <div className="mx-auto text-center" style={{ maxWidth: '640px' }}>
            <span className="inline-block px-3 py-1 bg-[#ffef3d] text-[#676000] text-xs font-bold rounded-full mb-5 uppercase tracking-wider">
              Hỗ trợ
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-[#191c1d] leading-tight mb-4">
              Chúng tôi luôn sẵn sàng<br />lắng nghe bạn
            </h1>
            <p className="text-sm text-[#4a4733] leading-relaxed">
              Đội ngũ Smart Rental hỗ trợ bạn về tìm phòng, đăng tin, thanh toán
              và mọi vấn đề phát sinh trong quá trình sử dụng nền tảng.
            </p>
          </div>
        </section>

        <div className="mx-auto px-4 md:px-10 py-12" style={{ maxWidth: '1080px' }}>

          {/* ── Contact channels ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {CONTACT_CHANNELS.map((ch) => (
              <div
                key={ch.label}
                className="bg-white rounded-2xl border border-[#ebebeb] p-6 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-[#ffef3d] flex items-center justify-center text-[#676000]">
                  {ch.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#676000] uppercase tracking-wide mb-1">{ch.label}</p>
                  {ch.href ? (
                    <a
                      href={ch.href}
                      className="text-base font-semibold text-[#191c1d] hover:text-[#933a12] transition-colors break-all"
                    >
                      {ch.value}
                    </a>
                  ) : (
                    <p className="text-base font-semibold text-[#191c1d]">{ch.value}</p>
                  )}
                  <p className="text-xs text-[#4a4733] mt-1">{ch.note}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Response time ── */}
            <div className="bg-[#ffef3d] rounded-2xl p-6 md:p-8">
              <p className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-5">
                Thời gian phản hồi
              </p>
              <div className="flex flex-col gap-4">
                {RESPONSE_TIMES.map((r) => (
                  <div key={r.channel} className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-[#1f1c00]">{r.channel}</span>
                    <span className="text-xs font-semibold text-[#676000] bg-white/70 px-3 py-1.5 rounded-full text-right">
                      {r.time}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-black/10">
                <p className="text-xs text-[#676000] leading-relaxed">
                  Với các khiếu nại liên quan đến thanh toán hoặc tranh chấp hợp đồng,
                  vui lòng cung cấp <strong>mã giao dịch</strong> và <strong>ảnh chụp
                  biên lai</strong> để chúng tôi đối soát nhanh hơn.
                </p>
              </div>
            </div>

            {/* ── Quick links ── */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] p-6 md:p-8">
              <p className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-5">
                Tài liệu hữu ích
              </p>
              <div className="flex flex-col gap-1">
                {QUICK_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f3f4f5] transition-colors group"
                  >
                    <svg
                      className="w-4 h-4 text-[#676000] shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-[#191c1d] group-hover:text-[#933a12] transition-colors leading-tight">
                        {l.label}
                      </p>
                      <p className="text-xs text-[#4a4733] mt-0.5">{l.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
