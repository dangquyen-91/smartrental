'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';
import { gsap } from 'gsap';

const TEAM = [
  {
    name: 'Nguyễn Văn Minh',
    role: 'Founder & CEO',
    desc: '10 năm kinh nghiệm trong lĩnh vực công nghệ bất động sản.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=minh',
  },
  {
    name: 'Trần Thị Lan',
    role: 'Head of Product',
    desc: 'Chuyên gia UX/UI với hơn 8 năm xây dựng sản phẩm số.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lan',
  },
  {
    name: 'Lê Hoàng Nam',
    role: 'Lead Engineer',
    desc: 'Full-stack developer, tối ưu hệ thống cho hàng triệu người dùng.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nam',
  },
  {
    name: 'Phạm Thu Hà',
    role: 'Head of Operations',
    desc: 'Quản lý vận hành và hỗ trợ khách hàng trên toàn quốc.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ha',
  },
];

const VALUES = [
  {
    icon: 'verified_user',
    title: 'Minh bạch',
    desc: 'Mọi thông tin được xác minh, từ hồ sơ chủ nhà đến điều khoản hợp đồng.',
  },
  {
    icon: 'lock',
    title: 'Bảo mật',
    desc: 'Dữ liệu cá nhân được mã hóa, giao dịch được bảo vệ theo tiêu chuẩn quốc tế.',
  },
  {
    icon: 'support_agent',
    title: 'Hỗ trợ 24/7',
    desc: 'Đội ngũ hỗ trợ luôn sẵn sàng giải đáp mọi thắc mắc của bạn.',
  },
  {
    icon: 'rocket_launch',
    title: 'Đổi mới',
    desc: 'Không ngừng cập nhật công nghệ mới để trải nghiệm ngày càng tốt hơn.',
  },
];

export default function AboutPage() {
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
      <PublicNavbar activeLink="about" />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-white py-20 px-4 md:px-10">
          <div className="mx-auto text-center" style={{ maxWidth: '768px' }}>
            <span className="inline-block px-4 py-1.5 bg-[#ffef3d] text-[#676000] text-xs font-bold rounded-full mb-6 uppercase tracking-wider">
              Về SmartRental
            </span>
            <h1 ref={headingRef} className="text-3xl md:text-5xl font-bold text-[#191c1d] mb-6 leading-tight opacity-0">
              Nền tảng thuê nhà thông minh<br />cho thị trường Việt Nam
            </h1>
            <p className="text-[#4a4733] text-lg leading-relaxed max-w-2xl mx-auto">
              SmartRental ra đời với sứ mệnh đơn giản hóa quy trình thuê nhà —
              từ tìm kiếm, đặt phòng đến ký kết hợp đồng điện tử — giúp hàng triệu
              người Việt tiết kiệm thời gian và yên tâm hơn khi thuê trọ.
            </p>
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="py-20 px-4 md:px-10 bg-[#f3f4f5]">
          <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center" style={{ maxWidth: '1080px' }}>
            <div>
              <span className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-4 block">Sứ mệnh</span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#191c1d] mb-6 leading-snug">
                Kết nối người thuê và chủ nhà<br />một cách minh bạch, nhanh chóng
              </h2>
              <p className="text-[#4a4733] leading-relaxed mb-4">
                Thị trường cho thuê nhà tại Việt Nam hiện nay còn nhiều khó khăn:
                thông tin không rõ ràng, hợp đồng thiếu pháp lý, thanh toán rủi ro.
              </p>
              <p className="text-[#4a4733] leading-relaxed">
                SmartRental giải quyết những vấn đề đó bằng cách số hóa toàn bộ quy
                trình: từ đăng tin, xác minh chủ nhà, đặt phòng, đến hợp đồng điện
                tử có giá trị pháp lý. Tất cả trong một nền tảng duy nhất.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '10.000+', label: 'Tin đăng', sub: 'Toàn quốc' },
                { value: '2.500+', label: 'Chủ nhà', sub: 'Đã xác minh' },
                { value: '8.000+', label: 'Người thuê', sub: 'Hài lòng' },
                { value: '4.8/5', label: 'Đánh giá', sub: 'Trung bình' },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                  <p className="text-3xl font-bold text-[#676000] mb-1">{s.value}</p>
                  <p className="text-sm font-semibold text-[#191c1d]">{s.label}</p>
                  <p className="text-xs text-[#4a4733]">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="py-20 px-4 md:px-10 bg-white">
          <div className="mx-auto" style={{ maxWidth: '1080px' }}>
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-4 block">
                Giá trị cốt lõi
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#191c1d]">
                Những điều chúng tôi tin tưởng
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {VALUES.map((v) => (
                <div key={v.title} className="bg-[#f3f4f5] rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-[#ffef3d] rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-[#676000] text-2xl">
                      {v.icon}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#191c1d] mb-2">{v.title}</h3>
                  <p className="text-sm text-[#4a4733] leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="py-20 px-4 md:px-10 bg-[#f3f4f5]">
          <div className="mx-auto" style={{ maxWidth: '1080px' }}>
            <div className="text-center mb-14">
              <span className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-4 block">
                Đội ngũ
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#191c1d]">
                Những người xây dựng SmartRental
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {TEAM.map((m) => (
                <div key={m.name} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-20 h-20 rounded-full bg-[#f3f4f5] mx-auto mb-4 overflow-hidden">
                    <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-base font-bold text-[#191c1d] mb-0.5">{m.name}</h3>
                  <p className="text-xs font-semibold text-[#676000] mb-2">{m.role}</p>
                  <p className="text-sm text-[#4a4733] leading-snug">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-4 md:px-10 bg-white">
          <div className="mx-auto text-center" style={{ maxWidth: '640px' }}>
            <h2 className="text-2xl md:text-3xl font-bold text-[#191c1d] mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-[#4a4733] mb-8 leading-relaxed">
              Tham gia cùng hàng nghìn người đã tìm được chỗ ở ưng ý qua SmartRental.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="px-8 py-3 bg-[#ffef3d] text-[#1f1c00] text-sm font-semibold rounded-full hover:shadow-lg transition-all"
              >
                Tìm phòng ngay
              </Link>
              <Link
                href="/guide"
                className="px-8 py-3 border border-[#7b7861] text-[#191c1d] text-sm font-semibold rounded-full hover:bg-[#f3f4f5] transition-all"
              >
                Xem hướng dẫn
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
