'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';
import { cn } from '@/lib/utils';
import { gsap } from 'gsap';

const STEPS = [
  {
    number: '01',
    title: 'Tạo tài khoản',
    desc: 'Đăng ký tài khoản miễn phí bằng email hoặc số điện thoại. Xác minh tài khoản qua email để bắt đầu.',
    icon: 'person_add',
  },
  {
    number: '02',
    title: 'Tìm kiếm phòng trọ',
    desc: 'Sử dụng thanh tìm kiếm để lọc theo khu vực, mức giá, loại phòng phù hợp. Xem chi tiết tin đăng, hình ảnh thực tế và thông tin liên hệ chủ nhà.',
    icon: 'search',
  },
  {
    number: '03',
    title: 'Gửi yêu cầu đặt phòng',
    desc: 'Chọn phòng ưng ý và gửi yêu cầu đặt phòng. Chủ nhà sẽ xác nhận trong vòng 24 giờ. Bạn sẽ nhận thông báo ngay khi có phản hồi.',
    icon: 'send',
  },
  {
    number: '04',
    title: 'Thanh toán đặt cọc',
    desc: 'Sau khi chủ nhà xác nhận, bạn tiến hành thanh toán tiền đặt cọc an toàn qua nền tảng. Tiền sẽ được giữ khóa cho đến khi hai bên hoàn tất.',
    icon: 'payments',
  },
  {
    number: '05',
    title: 'Ký hợp đồng điện tử',
    desc: 'Hợp đồng thuê nhà được soạn sẵn theo mẫu pháp lý. Cả hai bên ký trực tuyến bằng chữ ký điện tử, có giá trị pháp lý tương đương hợp đồng giấy.',
    icon: 'draw',
  },
  {
    number: '06',
    title: 'Nhận phòng và sinh sống',
    desc: 'Hợp đồng có hiệu lực, bạn nhận phòng theo thỏa thuận. Theo dõi lịch thanh toán, thông báo và mọi thông tin liên quan ngay trên SmartRental.',
    icon: 'home',
  },
];

const FAQ = [
  {
    q: 'Thuê phòng qua SmartRental có mất phí không?',
    a: 'Đăng ký và tìm kiếm phòng hoàn toàn miễn phí. Chủ nhà đăng tin có thể chọn gói dịch vụ nâng cao, nhưng không bắt buộc.',
  },
  {
    q: 'Hợp đồng điện tử có giá trị pháp lý không?',
    a: 'Có. Theo Nghị định 13/2023/NĐ-CP về định danh và xác thực điện tử, hợp đồng điện tử có giá trị pháp lý tương đương hợp đồng bằng văn bản.',
  },
  {
    q: 'Tiền đặt cọc được xử lý như thế nào?',
    a: 'Tiền đặt cọc được giữ khóa trên hệ thống. Nếu chủ nhà hủy đặt phòng, tiền sẽ được hoàn lại đầy đủ. Khi hai bên hoàn tất ký hợp đồng, tiền sẽ được chuyển cho chủ nhà.',
  },
  {
    q: 'Làm sao để xác minh chủ nhà đáng tin cậy?',
    a: 'SmartRental yêu cầu chủ nhà xác minh danh tính qua CCCD và số điện thoại. Các chủ nhà đã xác minh sẽ có badge "Đã xác minh" trên hồ sơ.',
  },
  {
    q: 'Tôi có thể hủy yêu cầu đặt phòng không?',
    a: 'Có. Trước khi chủ nhà xác nhận, bạn có thể hủy yêu cầu bất kỳ lúc nào mà không mất phí. Sau khi xác nhận, vui lòng liên hệ hỗ trợ để được hướng dẫn.',
  },
  {
    q: 'Thanh toán bằng những phương thức nào?',
    a: 'Hiện tại SmartRental hỗ trợ chuyển khoản ngân hàng. Các phương thức thanh toán khác (ví điện tử, thẻ) đang được triển khai.',
  },
];

export default function GuidePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;
    gsap.fromTo(
      headingRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <PublicNavbar activeLink="guide" />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-white py-20 px-4 md:px-10">
          <div className="mx-auto text-center" style={{ maxWidth: '768px' }}>
            <span className="inline-block px-4 py-1.5 bg-[#ffef3d] text-[#676000] text-xs font-bold rounded-full mb-6 uppercase tracking-wider">
              Hướng dẫn
            </span>
            <h1 ref={headingRef} className="text-3xl md:text-5xl font-bold text-[#191c1d] mb-6 leading-tight opacity-0">
              Thuê nhà dễ dàng,<br />từ tìm kiếm đến ký hợp đồng
            </h1>
            <p className="text-[#4a4733] text-lg leading-relaxed max-w-2xl mx-auto">
              6 bước đơn giản giúp bạn tìm được chỗ ở ưng ý với hợp đồng điện tử
              có giá trị pháp lý, hoàn toàn trực tuyến.
            </p>
          </div>
        </section>

        {/* ── Steps ── */}
        <section className="py-20 px-4 md:px-10">
          <div className="mx-auto" style={{ maxWidth: '1080px' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {STEPS.map((step, i) => (
                <div
                  key={step.number}
                  className="bg-white rounded-2xl p-8 flex gap-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-[#ffef3d] flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-[#676000] text-2xl">
                        {step.icon}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 w-px bg-[#e0dfd5] hidden md:block" style={{ minHeight: '40px' }} />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#676000] mb-2 block">{step.number}</span>
                    <h3 className="text-lg font-bold text-[#191c1d] mb-3">{step.title}</h3>
                    <p className="text-sm text-[#4a4733] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── For landlords ── */}
        <section className="py-20 px-4 md:px-10 bg-[#f3f4f5]">
          <div className="mx-auto" style={{ maxWidth: '1080px' }}>
            <div className="bg-white rounded-3xl p-10 md:p-14 shadow-sm">
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="shrink-0">
                  <div className="w-16 h-16 bg-[#ffef3d] rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[#676000] text-3xl">home_work</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-[#191c1d] mb-3">Dành cho chủ nhà</h2>
                  <p className="text-[#4a4733] leading-relaxed mb-6">
                    Bạn có phòng trọ, căn hộ cho thuê? Đăng tin miễn phí trên SmartRental
                    để tiếp cận hàng nghìn người thuê tiềm năng. Quản lý đặt phòng, tạo
                    hợp đồng điện tử và nhận thanh toán — tất cả trong một dashboard.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/hosting/listings/new"
                      className="px-6 py-2.5 bg-[#ffef3d] text-[#1f1c00] text-sm font-semibold rounded-full hover:shadow-lg transition-all"
                    >
                      Đăng tin ngay
                    </Link>
                    <Link
                      href="/about"
                      className="px-6 py-2.5 border border-[#7b7861] text-[#191c1d] text-sm font-semibold rounded-full hover:bg-[#f3f4f5] transition-colors"
                    >
                      Tìm hiểu thêm
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 px-4 md:px-10 bg-white">
          <div className="mx-auto" style={{ maxWidth: '768px' }}>
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-4 block">
                FAQ
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#191c1d]">
                Câu hỏi thường gặp
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {FAQ.map((item, i) => (
                <div
                  key={i}
                  className="bg-[#f3f4f5] rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex items-center justify-between w-full px-6 py-5 text-left gap-4"
                  >
                    <span className="text-sm font-semibold text-[#191c1d]">{item.q}</span>
                    <span className="material-symbols-outlined text-[#4a4733] text-xl shrink-0 transition-transform" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}>
                      expand_more
                    </span>
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all',
                      openFaq === i ? 'max-h-96' : 'max-h-0',
                    )}
                  >
                    <p className="px-6 pb-5 text-sm text-[#4a4733] leading-relaxed">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 md:px-10 bg-[#f3f4f5]">
          <div className="mx-auto text-center" style={{ maxWidth: '640px' }}>
            <h2 className="text-2xl md:text-3xl font-bold text-[#191c1d] mb-4">
              Cần hỗ trợ thêm?
            </h2>
            <p className="text-[#4a4733] mb-8 leading-relaxed">
              Đội ngũ hỗ trợ của SmartRental luôn sẵn sàng giúp đỡ bạn 24/7 qua
              chat trực tuyến hoặc email.
            </p>
            <Link
              href="/"
              className="px-8 py-3 bg-[#ffef3d] text-[#1f1c00] text-sm font-semibold rounded-full hover:shadow-lg transition-all inline-block"
            >
              Bắt đầu tìm phòng
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
