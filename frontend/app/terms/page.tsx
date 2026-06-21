import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng & Quy chế hoạt động | Smart Rental',
  description:
    'Điều khoản sử dụng và Quy chế hoạt động của nền tảng Smart Rental — nền tảng thuê nhà thông minh cho thị trường Việt Nam.',
  openGraph: {
    title: 'Điều khoản sử dụng & Quy chế hoạt động | Smart Rental',
    description:
      'Điều khoản sử dụng và Quy chế hoạt động của nền tảng Smart Rental — nền tảng thuê nhà thông minh cho thị trường Việt Nam.',
    url: 'https://www.smartrental.io.vn/terms',
  },
};

const TOC = [
  { id: 'phan-i', label: 'I. Điều khoản sử dụng' },
  { id: 'dieu-1', label: 'Điều 1. Chấp nhận điều khoản', indent: true },
  { id: 'dieu-2', label: 'Điều 2. Đăng ký và quản lý tài khoản', indent: true },
  { id: 'dieu-3', label: 'Điều 3. Quyền và trách nhiệm', indent: true },
  { id: 'dieu-4', label: 'Điều 4. Hành vi bị nghiêm cấm', indent: true },
  { id: 'dieu-5', label: 'Điều 5. Giới hạn trách nhiệm', indent: true },
  { id: 'phan-ii', label: 'II. Quy chế hoạt động' },
  { id: 'dieu-6', label: 'Điều 6. Nguyên tắc hoạt động', indent: true },
  { id: 'dieu-7', label: 'Điều 7. Quy trình giao dịch', indent: true },
  { id: 'dieu-8', label: 'Điều 8. Chính sách thanh toán', indent: true },
  { id: 'dieu-9', label: 'Điều 9. Hợp đồng điện tử', indent: true },
  { id: 'dieu-10', label: 'Điều 10. Giải quyết tranh chấp', indent: true },
  { id: 'dieu-11', label: 'Điều 11. Điều chỉnh quy chế', indent: true },
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

export default function TermsPage() {
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
              Điều khoản sử dụng &amp; Quy chế hoạt động
            </h1>
            <p className="text-sm text-[#4a4733]">
              Cập nhật lần cuối: Tháng 6 năm 2026 · Áp dụng cho toàn bộ người dùng nền tảng Smart Rental.
            </p>
          </div>
        </section>

        {/* ── Body ── */}
        <div className="mx-auto px-4 md:px-10 py-12 flex gap-12" style={{ maxWidth: '1080px' }}>

          {/* Sidebar TOC — desktop only */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl border border-[#ebebeb] p-5">
              <p className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-4">Mục lục</p>
              <TocNav />
            </div>
          </aside>

          {/* Content */}
          <article className="flex-1 min-w-0 bg-white rounded-2xl border border-[#ebebeb] px-6 md:px-10 py-8">

            {/* Mobile TOC — visible only below lg */}
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

            {/* ── PHẦN I ── */}
            <SectionTitle id="phan-i">I. Điều khoản sử dụng</SectionTitle>

            <ArticleTitle id="dieu-1">Điều 1. Chấp nhận điều khoản</ArticleTitle>
            <P>
              Bằng việc truy cập, đăng ký hoặc sử dụng bất kỳ tính năng nào trên nền tảng Smart Rental
              (bao gồm website và ứng dụng di động), Người dùng (bao gồm Chủ trọ và Người thuê) xác nhận
              đã đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản, quy chế và chính sách được công bố
              trên hệ thống.
            </P>
            <P>
              Người dùng tham gia giao dịch trên cơ sở tự nguyện, thiện chí, bình đẳng và tự chịu trách
              nhiệm đối với nội dung thông tin, cam kết, thỏa thuận và giao dịch dân sự do mình xác lập
              theo quy định của pháp luật Việt Nam.
            </P>

            <ArticleTitle id="dieu-2">Điều 2. Đăng ký và quản lý tài khoản</ArticleTitle>
            <ul className="flex flex-col gap-2 mb-4">
              <Li>Người dùng có trách nhiệm cung cấp đầy đủ, chính xác và trung thực các thông tin cần thiết khi đăng ký tài khoản.</Li>
              <Li>Thông tin bắt buộc khi đăng ký bao gồm: Họ và tên, Số điện thoại, Địa chỉ Email.</Li>
              <Li>
                Thông tin bổ sung chỉ được yêu cầu trong các trường hợp cần thiết nhằm xác minh danh tính,
                kích hoạt tính năng hợp đồng điện tử, xử lý tranh chấp hoặc theo yêu cầu của cơ quan có thẩm
                quyền, bao gồm: CCCD/CMND/Hộ chiếu (phục vụ KYC) và thông tin tài khoản thanh toán/ngân hàng.
              </Li>
              <Li>Người dùng chịu trách nhiệm cập nhật thông tin khi có thay đổi nhằm đảm bảo tính chính xác và hợp lệ của dữ liệu.</Li>
              <Li>Người dùng có trách nhiệm bảo mật mật khẩu, mã xác thực OTP và chịu trách nhiệm đối với mọi hoạt động phát sinh từ tài khoản của mình.</Li>
              <Li>
                Người dùng có quyền yêu cầu xóa tài khoản. Tuy nhiên Smart Rental có thể trì hoãn hoặc từ chối
                yêu cầu xóa trong các trường hợp: dữ liệu đang phục vụ giải quyết tranh chấp; có dấu hiệu gian
                lận; có yêu cầu từ cơ quan Nhà nước có thẩm quyền hoặc pháp luật yêu cầu tiếp tục lưu trữ dữ liệu.
              </Li>
            </ul>

            <ArticleTitle id="dieu-3">Điều 3. Quyền và trách nhiệm của Người dùng</ArticleTitle>
            <p className="text-xs font-semibold text-[#676000] uppercase tracking-wide mb-2">Đối với Chủ trọ</p>
            <ul className="flex flex-col gap-2 mb-4">
              <Li>Có quyền đăng tải thông tin, hình ảnh và nội dung cho thuê; sử dụng các gói dịch vụ nâng cao trên hệ thống.</Li>
              <Li>Chịu trách nhiệm hoàn toàn về tính chính xác của thông tin đăng tải và quyền sở hữu hoặc quyền cho thuê hợp pháp đối với bất động sản đó.</Li>
            </ul>
            <p className="text-xs font-semibold text-[#676000] uppercase tracking-wide mb-2">Đối với Người thuê</p>
            <ul className="flex flex-col gap-2 mb-4">
              <Li>Có quyền tìm kiếm, lọc và liên hệ với Chủ trọ.</Li>
              <Li>Có trách nhiệm đọc và xác nhận đầy đủ nội dung giao dịch trước khi thực hiện ký kết hoặc thanh toán trực tuyến, tự chịu trách nhiệm đối với quyết định giao dịch của mình.</Li>
            </ul>

            <ArticleTitle id="dieu-4">Điều 4. Hành vi bị nghiêm cấm</ArticleTitle>
            <P>Người dùng tuyệt đối không được thực hiện các hành vi sau trên nền tảng:</P>
            <ul className="flex flex-col gap-2 mb-4">
              <Li>Đăng tải thông tin sai lệch, giả mạo, đăng giá ảo hoặc vị trí bất động sản không chính xác.</Li>
              <Li>Giả mạo tổ chức hoặc cá nhân khác; tạo giao dịch bợm bãi, giả lập nhằm mục đích chiếm đoạt tài sản.</Li>
              <Li>Spam tin đăng, sử dụng công cụ tự động đẩy tin của bên thứ ba hoặc tạo các tương tác không hợp lệ gây quá tải hệ thống.</Li>
              <Li>Truy cập trái phép, can thiệp hoặc tấn công vào cấu trúc dữ liệu của Smart Rental.</Li>
              <Li>Đăng tải nội dung vi phạm pháp luật, đả kích chính trị, tôn giáo hoặc đi ngược lại thuần phong mỹ tục Việt Nam.</Li>
            </ul>

            <ArticleTitle id="dieu-5">Điều 5. Giới hạn trách nhiệm của nền tảng</ArticleTitle>
            <P>
              Smart Rental là nền tảng trung gian công nghệ kết nối Chủ trọ và Người thuê; không phải là
              chủ sở hữu, đơn vị quản lý hoặc bên trực tiếp tham gia vào quan hệ thuê bất động sản thực
              tế giữa các bên.
            </P>
            <P>
              Smart Rental không chịu trách nhiệm đối với các nội dung cam kết, thỏa thuận riêng hoặc
              nghĩa vụ dân sự phát sinh ngoài phạm vi vận hành kỹ thuật của hệ thống.
            </P>
            <P>Tuy nhiên, Smart Rental có trách nhiệm:</P>
            <ul className="flex flex-col gap-2 mb-4">
              <Li>Tiếp nhận phản ánh và khiếu nại từ người dùng.</Li>
              <Li>Kiểm tra và rà soát nội dung trên hệ thống.</Li>
              <Li>Hỗ trợ đối soát lịch sử giao dịch phần mềm.</Li>
              <Li>Áp dụng biện pháp công nghệ phù hợp nhằm hạn chế gian lận.</Li>
              <Li>Hỗ trợ cung cấp dữ liệu cho cơ quan Nhà nước khi có yêu cầu hợp pháp.</Li>
            </ul>

            <div className="my-10 border-t border-dashed border-[#e0e0e0]" />

            {/* ── PHẦN II ── */}
            <SectionTitle id="phan-ii">II. Quy chế hoạt động</SectionTitle>

            <ArticleTitle id="dieu-6">Điều 6. Nguyên tắc hoạt động</ArticleTitle>
            <P>
              Smart Rental hoạt động trên cơ sở minh bạch thông tin, bình đẳng, bảo vệ quyền lợi hợp pháp
              của người dùng, bảo đảm an toàn giao dịch điện tử và tuân thủ nghiêm ngặt hệ thống pháp luật
              Việt Nam.
            </P>

            <ArticleTitle id="dieu-7">Điều 7. Quy trình giao dịch trực tuyến tiêu chuẩn</ArticleTitle>
            <ol className="flex flex-col gap-3 mb-4">
              {[
                'Người dùng tạo tài khoản và cung cấp các thông tin cơ bản.',
                'Chủ trọ soạn thảo nội dung, cập nhật hình ảnh thực tế của phòng trọ và gửi kiểm duyệt.',
                'Hệ thống kiểm tra và phê duyệt hiển thị tin đăng công khai.',
                'Người thuê tìm kiếm, lọc dữ liệu và chủ động trao đổi với Chủ trọ qua hệ thống chat/số điện thoại.',
                'Hai bên xác nhận nội dung thỏa thuận giao dịch trực tuyến.',
                'Người thuê tiến hành rà soát thông tin, xác nhận nội dung và thực hiện xác thực điện tử thông qua OTP hoặc phương thức xác thực điện tử hợp pháp khác để hoàn tất giao dịch.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#4a4733] leading-relaxed">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-[#ffef3d] text-[#676000] text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <ArticleTitle id="dieu-8">Điều 8. Chính sách thanh toán trực tuyến</ArticleTitle>
            <P>
              Các khoản thanh toán phát sinh trên nền tảng (tiền đặt cọc, tiền thuê nhà) được xử lý hoàn
              toàn thông qua đối tác trung gian thanh toán tích hợp hợp pháp. Smart Rental không trực tiếp
              lưu trữ, nắm giữ hoặc quản lý tiền của Người dùng.
            </P>
            <P>
              Việc xử lý trạng thái thanh toán, hoàn tiền hoặc chuyển tiền phụ thuộc hoàn toàn vào chính
              sách của đối tác thanh toán, trạng thái giao dịch thực tế trên hệ thống và thỏa thuận hợp
              pháp giữa các bên.
            </P>

            <ArticleTitle id="dieu-9">Điều 9. Hợp đồng điện tử</ArticleTitle>
            <P>
              Hợp đồng điện tử được tạo lập, xác nhận và lưu trữ thông qua cơ chế xác thực điện tử của
              Smart Rental (như mã OTP hoặc phương thức điện tử hợp pháp khác) được sử dụng làm bằng chứng
              giao dịch chính thức giữa các bên theo quy định pháp luật hiện hành về Giao dịch điện tử.
            </P>

            <ArticleTitle id="dieu-10">Điều 10. Tiếp nhận và giải quyết tranh chấp</ArticleTitle>
            <P>
              Mọi tranh chấp, khiếu nại phát sinh từ giao dịch trên hệ thống trước hết sẽ được tiếp nhận
              qua các kênh hỗ trợ chính thức của Smart Rental và ưu tiên giải quyết thông qua thương lượng,
              hòa giải giữa các bên.
            </P>
            <P>
              Trường hợp các bên không đạt được thỏa thuận đồng thuận, tranh chấp sẽ được đưa ra giải
              quyết tại cơ quan Nhà nước hoặc Tòa án có thẩm quyền theo quy định pháp luật Việt Nam.
              Smart Rental sẽ hỗ trợ cung cấp lịch sử đối soát hệ thống phục vụ quá trình này.
            </P>

            <ArticleTitle id="dieu-11">Điều 11. Điều chỉnh quy chế</ArticleTitle>
            <P>
              Smart Rental có quyền điều chỉnh, bổ sung hoặc cập nhật quy chế hoạt động này để phù hợp
              với tình hình thực tế hoặc sự thay đổi của pháp luật. Mọi nội dung thay đổi sẽ được thông
              báo hiển thị trên hệ thống ít nhất <strong>05 ngày</strong> trước thời điểm chính thức áp dụng.
            </P>

            <div className="my-10 border-t border-dashed border-[#e0e0e0]" />

            {/* ── Contact ── */}
            <div id="lien-he" className="scroll-mt-24 rounded-2xl bg-[#f3f4f5] p-6 md:p-8">
              <p className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-4">
                Thông tin liên hệ đơn vị vận hành
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
                  <p className="font-semibold text-[#191c1d] mb-0.5">Người chịu trách nhiệm quản lý</p>
                  <p>Nguyễn Vũ Thu Uyên</p>
                </div>
                <div>
                  <p className="font-semibold text-[#191c1d] mb-0.5">Email hỗ trợ</p>
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
                href="/privacy"
                className="text-xs font-semibold text-[#933a12] underline underline-offset-2 hover:text-[#7a2f0e] transition-colors"
              >
                Chính sách bảo mật →
              </Link>
              <Link
                href="/policy"
                className="text-xs font-semibold text-[#933a12] underline underline-offset-2 hover:text-[#7a2f0e] transition-colors"
              >
                Chính sách kiểm duyệt →
              </Link>
            </div>
          </article>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
