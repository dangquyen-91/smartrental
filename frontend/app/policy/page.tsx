import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Chính sách kiểm duyệt & Thanh toán | Smart Rental',
  description:
    'Chính sách kiểm duyệt nội dung, chính sách thanh toán và hoàn tiền của nền tảng Smart Rental.',
  openGraph: {
    title: 'Chính sách kiểm duyệt & Thanh toán | Smart Rental',
    description:
      'Chính sách kiểm duyệt nội dung, chính sách thanh toán và hoàn tiền của nền tảng Smart Rental.',
    url: 'https://www.smartrental.io.vn/policy',
  },
};

const TOC = [
  { id: 'phan-i', label: '1. Chính sách kiểm duyệt nội dung' },
  { id: 'dieu-1', label: 'Điều 1. Tiêu chuẩn tin đăng hợp lệ', indent: true },
  { id: 'dieu-2', label: 'Điều 2. Nội dung bị từ chối / gỡ bỏ', indent: true },
  { id: 'dieu-3', label: 'Điều 3. Xử lý vi phạm tài khoản', indent: true },
  { id: 'phan-ii', label: '2. Chính sách thanh toán & hoàn tiền' },
  { id: 'dieu-4', label: 'Điều 4. Hình thức & phạm vi thanh toán', indent: true },
  { id: 'dieu-5', label: 'Điều 5. Xử lý sự cố giao dịch', indent: true },
  { id: 'dieu-6', label: 'Điều 6. Chính sách hoàn tiền', indent: true },
  { id: 'lien-he', label: 'Thông tin liên hệ' },
];

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-base font-bold text-[#191c1d] mt-10 mb-3 pt-2 scroll-mt-24 uppercase tracking-wide"
    >
      {children}
    </h2>
  );
}

function ArticleTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3 id={id} className="text-sm font-bold text-[#191c1d] mt-8 mb-2 scroll-mt-24">
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#4a4733] leading-relaxed mb-2">{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-sm text-[#4a4733] leading-relaxed flex gap-2">
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#933a12] shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function ViolationCard({
  level,
  color,
  title,
  children,
}: {
  level: string;
  color: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border-l-4 ${color} bg-[#f8f9fa] px-5 py-4 mb-3`}>
      <p className="text-xs font-bold uppercase tracking-wide text-[#191c1d] mb-1">{level}</p>
      <p className="text-xs font-semibold text-[#4a4733] mb-2">{title}</p>
      <p className="text-sm text-[#4a4733] leading-relaxed">{children}</p>
    </div>
  );
}

function TocNav() {
  return (
    <nav className="flex flex-col gap-1">
      {TOC.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={[
            'text-xs leading-snug py-1 hover:text-[#933a12] transition-colors',
            item.indent
              ? 'pl-3 text-[#4a4733] border-l border-[#e0e0e0]'
              : 'font-semibold text-[#191c1d]',
          ].join(' ')}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-white py-16 px-4 md:px-10 border-b border-[#ebebeb]">
          <div className="mx-auto" style={{ maxWidth: '768px' }}>
            <span className="inline-block px-3 py-1 bg-[#ffef3d] text-[#676000] text-xs font-bold rounded-full mb-5 uppercase tracking-wider">
              Pháp lý
            </span>
            <h1 className="text-2xl md:text-4xl font-bold text-[#191c1d] leading-tight mb-4">
              Chính sách kiểm duyệt &amp; Thanh toán
            </h1>
            <p className="text-sm text-[#4a4733]">
              Cập nhật lần cuối: Tháng 6 năm 2026 · Áp dụng cho toàn bộ người dùng nền tảng Smart Rental.
            </p>
          </div>
        </section>

        {/* ── Body ── */}
        <div className="mx-auto px-4 md:px-10 py-12 flex gap-12" style={{ maxWidth: '1080px' }}>

          {/* Sidebar TOC — desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-[#ebebeb] p-5">
              <p className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-4">Mục lục</p>
              <TocNav />
            </div>
          </aside>

          {/* Content */}
          <article className="flex-1 min-w-0 bg-white rounded-2xl border border-[#ebebeb] px-6 md:px-10 py-8">

            {/* Mobile TOC */}
            <details className="lg:hidden mb-8 rounded-xl border border-[#ebebeb] bg-[#f8f9fa] group">
              <summary className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#191c1d] cursor-pointer list-none select-none">
                Mục lục
                <svg
                  className="w-4 h-4 text-[#4a4733] transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1">
                <TocNav />
              </div>
            </details>

            {/* ── PHẦN 1 ── */}
            <SectionTitle id="phan-i">1. Chính sách kiểm duyệt nội dung</SectionTitle>

            <ArticleTitle id="dieu-1">Điều 1. Tiêu chuẩn tin đăng hợp lệ</ArticleTitle>
            <P>Tin đăng bất động sản trên Smart Rental phải đáp ứng đầy đủ các điều kiện bắt buộc sau:</P>
            <ul className="flex flex-col gap-2 mb-4">
              <Li>
                Sử dụng ngôn ngữ Tiếng Việt có dấu, nội dung phù hợp, rõ ràng, không chứa các từ ngữ thô tục,
                vi phạm pháp luật hoặc trái thuần phong mỹ tục Việt Nam.
              </Li>
              <Li>
                Thông tin địa chỉ, vị trí địa lý phải trùng khớp với định vị trên bản đồ hệ thống; các mô tả
                đặc tính phải phù hợp với hiện trạng thực tế của bất động sản.
              </Li>
              <Li>
                Hình ảnh tải lên phải là hình ảnh thực tế liên quan trực tiếp đến phòng trọ/căn hộ đang cho
                thuê tại thời điểm đăng tin. Không sử dụng hình ảnh giả mạo, hình ảnh có bản quyền hoặc vi
                phạm quyền sở hữu trí tuệ.
              </Li>
              <Li>
                Nội dung đăng tải phải phản ánh trung thực về tình trạng phòng, diện tích, giá thuê, chi phí
                dịch vụ đi kèm (điện, nước, internet...) và các điều kiện ràng buộc liên quan.
              </Li>
            </ul>

            <ArticleTitle id="dieu-2">Điều 2. Nội dung bị từ chối hiển thị hoặc gỡ bỏ</ArticleTitle>
            <P>
              Smart Rental có toàn quyền từ chối phê duyệt hiển thị hoặc chủ động gỡ bỏ nội dung bất kỳ lúc
              nào nếu phát hiện một trong các dấu hiệu sau:
            </P>

            <div className="flex flex-col gap-3 mb-4">
              <div className="rounded-xl bg-[#fffbeb] border border-[#fde68a] p-4">
                <p className="text-xs font-bold text-[#92400e] uppercase tracking-wide mb-1.5">Thông tin sai lệch thực tế</p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    'Đăng giá thuê không đúng thực tế nhằm thu hút khách.',
                    'Cố tình giữ tin đã hết hiệu lực hoặc phòng đã cho thuê xong.',
                    'Cung cấp sai vị trí, sai khu vực hoặc sai thông tin mô tả.',
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-[#78350f]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#d97706] shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-[#fff7ed] border border-[#fed7aa] p-4">
                <p className="text-xs font-bold text-[#9a3412] uppercase tracking-wide mb-1.5">Hình ảnh sai phạm</p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    'Sử dụng hình ảnh lấy từ nguồn không liên quan đến bất động sản.',
                    'Sử dụng hình ảnh mô phỏng hoặc thiết kế 3D gây hiểu nhầm về hiện trạng.',
                    'Chỉnh sửa hình ảnh quá mức làm thay đổi đáng kể hiện trạng thực tế.',
                    'Hình ảnh bị chèn nội dung quảng cáo hoặc thông tin rác.',
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-[#7c2d12]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#ea580c] shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-[#fef2f2] border border-[#fecaca] p-4">
                <p className="text-xs font-bold text-[#991b1b] uppercase tracking-wide mb-1.5">Nội dung vi phạm pháp luật</p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    'Tin đăng mang tính chất lừa đảo.',
                    'Chứa nội dung xúc phạm danh dự, nhân phẩm của cá nhân/tổ chức.',
                    'Vi phạm quyền sở hữu trí tuệ hoặc đi ngược lại các quy định pháp luật Việt Nam.',
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-[#7f1d1d]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#dc2626] shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <ArticleTitle id="dieu-3">Điều 3. Chính sách xử lý vi phạm tài khoản</ArticleTitle>
            <P>Tùy thuộc vào bản chất và mức độ của hành vi, hệ thống áp dụng các biện pháp chế tài sau:</P>

            <ViolationCard
              level="Mức 1 — Lỗi hành chính"
              color="border-[#fbbf24]"
              title="Sai danh mục, sai định dạng, viết hoa toàn bộ tiêu đề..."
            >
              <strong>Lần thứ nhất:</strong> Từ chối duyệt nội dung và gửi thông báo yêu cầu chỉnh sửa trên
              app. <strong>Lần thứ hai:</strong> Tạm hoãn quyền đăng tin tối đa <strong>07 ngày</strong> nếu
              cố tình tái phạm.
            </ViolationCard>

            <ViolationCard
              level="Mức 2 — Cố tình gian lận thông tin"
              color="border-[#f97316]"
              title="Spam tin trùng lặp, đăng thông tin giả, đăng giá/vị trí ảo"
            >
              Khóa quyền sử dụng tài khoản từ <strong>15–30 ngày</strong>, đồng thời tạm ẩn toàn bộ các tin
              đăng liên quan hiện tại trên hệ thống.
            </ViolationCard>

            <ViolationCard
              level="Mức 3 — Vi phạm nghiêm trọng"
              color="border-[#ef4444]"
              title="Lừa đảo chiếm đoạt tài sản, giả mạo giấy tờ/danh tính, vi phạm hình sự"
            >
              Khóa tài khoản <strong>vĩnh viễn</strong>, từ chối tiếp tục cung cấp dịch vụ, đưa thông tin
              định danh vào danh sách đen (Blacklist) nội bộ và phối hợp cung cấp dữ liệu cho cơ quan Nhà
              nước có thẩm quyền khi có yêu cầu hợp pháp.
            </ViolationCard>

            <div className="my-10 border-t border-dashed border-[#e0e0e0]" />

            {/* ── PHẦN 2 ── */}
            <SectionTitle id="phan-ii">2. Chính sách thanh toán &amp; hoàn tiền</SectionTitle>

            <ArticleTitle id="dieu-4">Điều 4. Hình thức và phạm vi xử lý thanh toán</ArticleTitle>
            <P>
              <strong>Hình thức:</strong> Smart Rental hỗ trợ đối soát thông tin thanh toán thông qua các
              phương thức tích hợp hợp pháp trên hệ thống bao gồm: Chuyển khoản ngân hàng tự động (Mã QR
              động), Ví điện tử liên kết, hoặc các phương thức thanh toán điện tử được hệ thống hỗ trợ tại
              từng thời điểm.
            </P>
            <P><strong>Phạm vi:</strong> Dòng tiền xử lý trên hệ thống được phân định rõ ràng thành:</P>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] p-4">
                <p className="text-xs font-bold text-[#166534] uppercase tracking-wide mb-2">Dịch vụ hệ thống</p>
                <p className="text-sm text-[#14532d] leading-relaxed">
                  Chi phí sử dụng gói tin đăng nổi bật (VIP), dịch vụ đẩy bài tự động, phí xác thực tin đăng
                  (Verified Listing) và các dịch vụ giá trị gia tăng khác trả cho Smart Rental.
                </p>
              </div>
              <div className="rounded-xl bg-[#eff6ff] border border-[#bfdbfe] p-4">
                <p className="text-xs font-bold text-[#1e40af] uppercase tracking-wide mb-2">Giao dịch Chủ trọ — Người thuê</p>
                <p className="text-sm text-[#1e3a8a] leading-relaxed">
                  Tiền đặt cọc, tiền thuê nhà hoặc các chi phí phát sinh theo thỏa thuận dân sự của hai bên
                  trong Hợp đồng điện tử.
                </p>
              </div>
            </div>

            <P>
              <strong>Bản chất dòng tiền:</strong> Các khoản thanh toán này được xử lý hoàn toàn thông qua
              đối tác trung gian thanh toán tích hợp hợp pháp trên nền tảng. Smart Rental không trực tiếp lưu
              trữ, quản lý hoặc nắm giữ tiền của Người dùng nhằm đảm bảo an toàn tài chính.
            </P>

            <ArticleTitle id="dieu-5">Điều 5. Xử lý sự cố giao dịch kỹ thuật</ArticleTitle>
            <P>
              Trường hợp tài khoản Người dùng đã bị trừ tiền thành công nhưng hệ thống chưa ghi nhận dịch vụ
              hoặc chưa cập nhật trạng thái giao dịch hợp đồng, Người dùng có trách nhiệm cung cấp{' '}
              <strong>Biên lai giao dịch</strong> (ảnh chụp bill) hiển thị rõ <strong>Mã tham chiếu/Mã giao
              dịch ngân hàng</strong> cho bộ phận CSKH để làm cơ sở đối soát.
            </P>
            <P>
              Smart Rental sẽ nhanh chóng phối hợp với đối tác cổng thanh toán/ngân hàng để xác minh. Thời
              gian xử lý sự cố kỹ thuật dự kiến từ <strong>03–05 ngày làm việc</strong> tùy thuộc vào tốc độ
              đối soát thực tế giữa các hệ thống ngân hàng.
            </P>

            <ArticleTitle id="dieu-6">Điều 6. Chính sách hoàn tiền</ArticleTitle>

            <div className="flex flex-col gap-3 mb-4">
              <div className="rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] p-4">
                <p className="text-xs font-bold text-[#166534] uppercase tracking-wide mb-2">
                  Trường hợp được duyệt hoàn tiền
                </p>
                <p className="text-sm text-[#14532d] leading-relaxed">
                  Xảy ra lỗi kỹ thuật kéo dài từ hệ thống của nền tảng khiến Người dùng hoàn toàn không thể
                  sử dụng dịch vụ công nghệ đã thanh toán, hoặc giao dịch bị ghi nhận sai giá trị hoàn toàn
                  do lỗi hệ thống cốt lõi. Việc hoàn tiền được thực hiện theo quy trình xác minh nội bộ và
                  chính sách của đối tác thanh toán liên kết.
                </p>
              </div>

              <div className="rounded-xl bg-[#fef2f2] border border-[#fecaca] p-4">
                <p className="text-xs font-bold text-[#991b1b] uppercase tracking-wide mb-2">
                  Trường hợp từ chối hoàn tiền dịch vụ hệ thống
                </p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    'Người dùng vi phạm Điều khoản sử dụng hoặc Quy chế hoạt động.',
                    'Dịch vụ đã được hệ thống cung cấp đầy đủ theo mô tả hiển thị.',
                    'Bài đăng bị gỡ bỏ hoặc tài khoản bị khóa do vi phạm chính sách nội dung tại Điều 2.',
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-[#7f1d1d]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#dc2626] shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-[#eff6ff] border border-[#bfdbfe] p-4">
                <p className="text-xs font-bold text-[#1e40af] uppercase tracking-wide mb-2">
                  Hoàn trả tiền giao dịch thuê trọ (tiền cọc / tiền thuê nhà)
                </p>
                <p className="text-sm text-[#1e3a8a] leading-relaxed mb-2">
                  Đối với dòng tiền phát sinh giữa Chủ trọ và Người thuê xử lý qua đối tác trung gian thanh
                  toán, việc hoàn trả hoặc giải ngân khi phát sinh tranh chấp hủy hợp đồng trước khi nhận
                  phòng sẽ căn cứ vào:
                </p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    'Biên bản thỏa thuận trực tuyến có xác nhận của cả hai bên trên ứng dụng.',
                    'Kết quả phân xử đối soát chứng cứ vi phạm hợp đồng của bộ phận giải quyết khiếu nại thuộc Smart Rental.',
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-[#1e3a8a]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3b82f6] shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="my-10 border-t border-dashed border-[#e0e0e0]" />

            {/* ── Contact ── */}
            <div id="lien-he" className="scroll-mt-24 rounded-2xl bg-[#f3f4f5] p-6 md:p-8">
              <p className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-4">
                Thông tin đơn vị vận hành &amp; đối soát
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#4a4733]">
                <div>
                  <p className="font-semibold text-[#191c1d] mb-0.5">Đơn vị vận hành</p>
                  <p>Smart Rental Project Team</p>
                </div>
                <div>
                  <p className="font-semibold text-[#191c1d] mb-0.5">Hotline trực tuyến</p>
                  <a href="tel:0909562004" className="hover:text-[#933a12] transition-colors">
                    090 9562 004
                  </a>
                </div>
                <div>
                  <p className="font-semibold text-[#191c1d] mb-0.5">Người chịu trách nhiệm</p>
                  <p>Nguyễn Vũ Thu Uyên</p>
                </div>
                <div>
                  <p className="font-semibold text-[#191c1d] mb-0.5">Email hỗ trợ đối soát</p>
                  <a
                    href="mailto:uyenuyenmitoyo@gmail.com"
                    className="hover:text-[#933a12] transition-colors break-all"
                  >
                    uyenuyenmitoyo@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* ── Nav links ── */}
            <div className="mt-8 pt-6 border-t border-[#ebebeb] flex flex-wrap gap-3">
              <Link
                href="/terms"
                className="text-xs font-semibold text-[#933a12] underline underline-offset-2 hover:text-[#7a2f0e] transition-colors"
              >
                Điều khoản sử dụng →
              </Link>
              <Link
                href="/privacy"
                className="text-xs font-semibold text-[#933a12] underline underline-offset-2 hover:text-[#7a2f0e] transition-colors"
              >
                Chính sách bảo mật →
              </Link>
            </div>
          </article>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
