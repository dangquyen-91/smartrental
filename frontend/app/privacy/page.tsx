import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicNavbar, PublicFooter } from '@/components/layout/public-navbar';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật thông tin & Dữ liệu cá nhân | Smart Rental',
  description:
    'Chính sách bảo mật thông tin và dữ liệu cá nhân của Smart Rental — tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân tại Việt Nam.',
  openGraph: {
    title: 'Chính sách bảo mật thông tin & Dữ liệu cá nhân | Smart Rental',
    description:
      'Chính sách bảo mật thông tin và dữ liệu cá nhân của Smart Rental — tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân tại Việt Nam.',
    url: 'https://www.smartrental.io.vn/privacy',
  },
};

const TOC = [
  { id: 'i', label: 'I. Nguyên tắc chung & Sự đồng ý' },
  { id: 'dieu-1', label: 'Điều 1. Chấp nhận và sự đồng ý', indent: true },
  { id: 'ii', label: 'II. Phạm vi thu thập dữ liệu' },
  { id: 'dieu-2', label: 'Điều 2. Phân loại dữ liệu thu thập', indent: true },
  { id: 'iii', label: 'III. Mục đích xử lý dữ liệu' },
  { id: 'dieu-3', label: 'Điều 3. Mục đích & phạm vi sử dụng', indent: true },
  { id: 'iv', label: 'IV. Quyền truy cập thiết bị' },
  { id: 'dieu-4', label: 'Điều 4. Device Permissions', indent: true },
  { id: 'v', label: 'V. Chia sẻ dữ liệu' },
  { id: 'dieu-5', label: 'Điều 5. Phạm vi chia sẻ & bảo mật', indent: true },
  { id: 'vi', label: 'VI. Lưu trữ & xóa dữ liệu' },
  { id: 'dieu-6', label: 'Điều 6. Thời gian lưu trữ', indent: true },
  { id: 'dieu-7', label: 'Điều 7. Xóa tài khoản trong app', indent: true },
  { id: 'vii', label: 'VII. Quyền của người dùng' },
  { id: 'dieu-8', label: 'Điều 8. Quyền chủ thể dữ liệu', indent: true },
  { id: 'dieu-9', label: 'Điều 9. Biểu mẫu yêu cầu', indent: true },
  { id: 'viii', label: 'VIII. Bảo mật & sự cố dữ liệu' },
  { id: 'dieu-10', label: 'Điều 10. Cam kết an toàn', indent: true },
  { id: 'dieu-11', label: 'Điều 11. Cookie & công cụ theo dõi', indent: true },
  { id: 'ix', label: 'IX. Thông tin liên hệ' },
  { id: 'x', label: 'X. Sửa đổi & cập nhật chính sách' },
  { id: 'xi', label: 'XI. Luật điều chỉnh & tranh chấp' },
];

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-base font-bold text-[#191c1d] mt-10 mb-3 pt-2 scroll-mt-24 uppercase tracking-wide">
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

const DEVICE_PERMISSIONS = [
  {
    icon: '📍',
    title: 'Vị trí (GPS)',
    desc: 'Tìm kiếm phòng trọ gần vị trí người dùng và xác định định vị bất động sản trên bản đồ.',
  },
  {
    icon: '📷',
    title: 'Camera & Thư viện ảnh',
    desc: 'Chụp ảnh hiện trạng phòng trọ, tải ảnh lên tin đăng hoặc quét giấy tờ định danh khi cần thiết.',
  },
  {
    icon: '💾',
    title: 'Bộ nhớ / Lưu trữ',
    desc: 'Lưu trữ, hiển thị hoặc tải các tệp văn bản tài liệu, dữ liệu điện tử dạng .PDF.',
  },
  {
    icon: '🔔',
    title: 'Thông báo (Push)',
    desc: 'Gửi cập nhật trạng thái giao dịch, trạng thái tin đăng và thông báo an toàn tài khoản.',
  },
  {
    icon: '📱',
    title: 'Xác minh SMS OTP',
    desc: 'Xác thực tài khoản và bảo mật đăng nhập.',
  },
];

const USER_RIGHTS = [
  'Quyền được biết về hoạt động xử lý dữ liệu',
  'Quyền đồng ý hoặc từ chối',
  'Quyền truy cập dữ liệu',
  'Quyền chỉnh sửa hoặc cập nhật dữ liệu',
  'Quyền rút lại sự đồng ý',
  'Quyền yêu cầu xóa dữ liệu',
  'Quyền phản đối xử lý dữ liệu',
  'Quyền khiếu nại hoặc yêu cầu bồi thường',
];

export default function PrivacyPage() {
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
            <h1 className="text-2xl md:text-4xl font-bold text-[#191c1d] leading-tight mb-3">
              Chính sách bảo mật thông tin &amp; Dữ liệu cá nhân
            </h1>
            <p className="text-xs text-[#676000] font-medium mb-3">
              Tuân thủ Nghị định số 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân tại Việt Nam
            </p>
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
                <svg className="w-4 h-4 text-[#4a4733] transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1"><TocNav /></div>
            </details>

            {/* ── I ── */}
            <SectionTitle id="i">I. Nguyên tắc chung &amp; Sự đồng ý</SectionTitle>

            <ArticleTitle id="dieu-1">Điều 1. Chấp nhận và sự đồng ý xử lý dữ liệu</ArticleTitle>
            <P>
              Khi đăng ký tài khoản, truy cập hoặc sử dụng các tính năng trên nền tảng Smart Rental, Người
              dùng xác nhận đã đọc, hiểu rõ và đồng ý cho phép Smart Rental tiến hành thu thập, lưu trữ, sử
              dụng và xử lý dữ liệu cá nhân của mình theo đúng các điều khoản quy định tại Chính sách này.
              Người dùng ý thức rõ ràng về loại dữ liệu được thu thập, mục đích sử dụng, các bên liên quan
              và quyền/nghĩa vụ cá nhân.
            </P>
            <P>
              Đối với các dữ liệu cá nhân nhạy cảm, Smart Rental bắt buộc phải hiển thị giao diện thông báo
              riêng biệt để yêu cầu sự đồng ý rõ ràng, độc lập và riêng biệt của Người dùng trước khi tiến
              hành thu thập hoặc xử lý dữ liệu hệ thống.
            </P>

            <div className="my-8 border-t border-dashed border-[#e0e0e0]" />

            {/* ── II ── */}
            <SectionTitle id="ii">II. Phạm vi thu thập dữ liệu cá nhân</SectionTitle>

            <ArticleTitle id="dieu-2">Điều 2. Phân loại dữ liệu cá nhân thu thập</ArticleTitle>
            <P>
              Smart Rental chỉ thu thập các trường dữ liệu tối thiểu nhằm mục đích phục vụ vận hành nền
              tảng, xác thực người dùng, hỗ trợ giao dịch và thực hiện nghĩa vụ pháp lý theo quy định hiện hành:
            </P>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-[#eff6ff] border border-[#bfdbfe] p-4">
                <p className="text-xs font-bold text-[#1e40af] uppercase tracking-wide mb-2">Dữ liệu cá nhân cơ bản</p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    'Họ và tên',
                    'Địa chỉ Email',
                    'Số điện thoại liên hệ',
                    'Địa chỉ liên hệ',
                    'Ảnh đại diện tài khoản',
                    'Lịch sử trao đổi tin nhắn trên hệ thống',
                    'Thông tin và hình ảnh bất động sản đăng tải',
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-[#1e3a8a]">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3b82f6] shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-[#fff7ed] border border-[#fed7aa] p-4">
                <p className="text-xs font-bold text-[#9a3412] uppercase tracking-wide mb-2">Dữ liệu cá nhân nhạy cảm</p>
                <ul className="flex flex-col gap-3">
                  <li className="text-sm text-[#7c2d12] leading-relaxed">
                    <span className="font-semibold block mb-0.5">Vị trí địa lý (GPS)</span>
                    Hỗ trợ tính năng tìm kiếm phòng theo khu vực; chỉ thu thập khi Người dùng kích hoạt tính năng hoặc cấp quyền tương ứng.
                  </li>
                  <li className="text-sm text-[#7c2d12] leading-relaxed">
                    <span className="font-semibold block mb-0.5">Thông tin định danh (KYC)</span>
                    Ảnh chụp CCCD/CMND/Hộ chiếu phục vụ xác thực danh tính hoặc khởi tạo Hợp đồng điện tử.
                  </li>
                  <li className="text-sm text-[#7c2d12] leading-relaxed">
                    <span className="font-semibold block mb-0.5">Thông tin thanh toán cần thiết</span>
                    Phục vụ đối soát giao dịch với đối tác trung gian. Smart Rental không lưu trữ thông tin thẻ hoặc xác thực tài khoản ngân hàng.
                  </li>
                </ul>
              </div>
            </div>

            <div className="my-8 border-t border-dashed border-[#e0e0e0]" />

            {/* ── III ── */}
            <SectionTitle id="iii">III. Mục đích xử lý và sử dụng dữ liệu</SectionTitle>

            <ArticleTitle id="dieu-3">Điều 3. Mục đích và phạm vi sử dụng thông tin</ArticleTitle>
            <P>Thông tin dữ liệu cá nhân của Người dùng được sử dụng nội bộ nhằm mục đích:</P>
            <ul className="flex flex-col gap-2 mb-4">
              <Li>Tạo, quản lý tài khoản, xác thực danh tính và phân quyền sử dụng hệ thống.</Li>
              <Li>Hỗ trợ kết nối thông tin giữa Chủ trọ và Người thuê; hỗ trợ trích xuất dữ liệu tự động cho các biểu mẫu thỏa thuận thuê trực tuyến khi có yêu cầu từ các bên.</Li>
              <Li>Gửi thông báo trạng thái từ hệ thống, hỗ trợ kỹ thuật và tiếp nhận giải quyết khiếu nại.</Li>
              <Li>Xử lý dữ liệu tự động: sử dụng thuật toán phân tích hành vi tìm kiếm và vị trí địa lý nhằm cải thiện trải nghiệm và gợi ý phòng trọ phù hợp nhất.</Li>
              <Li>Thực hiện các nghĩa vụ đối soát kỹ thuật dòng tiền và nghĩa vụ pháp lý theo quy định của cơ quan Nhà nước có thẩm quyền.</Li>
            </ul>

            <div className="my-8 border-t border-dashed border-[#e0e0e0]" />

            {/* ── IV ── */}
            <SectionTitle id="iv">IV. Quy trình truy cập thiết bị (Device Permissions)</SectionTitle>

            <ArticleTitle id="dieu-4">Điều 4. Quyền truy cập phần cứng và bộ nhớ hệ thống</ArticleTitle>
            <P>Để hỗ trợ vận hành các chức năng kỹ thuật trên ứng dụng di động, Smart Rental có thể yêu cầu Người dùng cấp các quyền truy cập sau:</P>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {DEVICE_PERMISSIONS.map((p) => (
                <div key={p.title} className="flex gap-3 rounded-xl bg-[#f3f4f5] p-4">
                  <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-[#191c1d] mb-1">{p.title}</p>
                    <p className="text-sm text-[#4a4733] leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] p-4 mb-4">
              <p className="text-xs font-bold text-[#166534] uppercase tracking-wide mb-1.5">Quyền từ chối</p>
              <p className="text-sm text-[#14532d] leading-relaxed">
                Người dùng hoàn toàn có quyền từ chối cấp quyền truy cập bất cứ lúc nào trong mục cài đặt
                của thiết bị. Tuy nhiên, một số chức năng có thể bị hạn chế nếu quyền truy cập thiết yếu
                không được cấp. Quyền truy cập chỉ được yêu cầu tại thời điểm Người dùng sử dụng chức năng
                tương ứng và có thể được thay đổi hoặc thu hồi thông qua cài đặt thiết bị.
              </p>
            </div>

            <div className="my-8 border-t border-dashed border-[#e0e0e0]" />

            {/* ── V ── */}
            <SectionTitle id="v">V. Cơ chế công khai và chia sẻ dữ liệu</SectionTitle>

            <ArticleTitle id="dieu-5">Điều 5. Phạm vi chia sẻ và bảo mật thông tin hiển thị</ArticleTitle>
            <ul className="flex flex-col gap-2 mb-4">
              <Li>
                <strong>Thông tin công khai trên tin đăng:</strong> Khi đăng tải thông tin cho thuê, Chủ trọ
                đồng ý cho phép Smart Rental hiển thị một phần thông tin liên hệ cần thiết hoặc thông tin
                do Chủ trọ chủ động lựa chọn công khai trên tin đăng.
              </Li>
              <Li>
                <strong>Thông tin phục vụ hợp đồng điện tử:</strong> Các thông tin định danh cần thiết có
                thể được sử dụng để tạo dữ liệu cho Hợp đồng điện tử. Smart Rental áp dụng biện pháp che
                hoặc mã hóa một phần thông tin định danh khi hiển thị trên giao diện hệ thống.
              </Li>
              <Li>
                <strong>Chia sẻ với bên thứ ba:</strong> Smart Rental không chia sẻ hoặc sử dụng dữ liệu
                cá nhân cho mục đích tiếp thị thương mại nếu chưa có sự đồng ý của Người dùng. Dữ liệu
                có thể được chia sẻ theo yêu cầu của cơ quan Nhà nước có thẩm quyền, hoặc với đối tác
                thanh toán/đối tác kỹ thuật phục vụ vận hành, đối soát hệ thống.
              </Li>
            </ul>

            <div className="my-8 border-t border-dashed border-[#e0e0e0]" />

            {/* ── VI ── */}
            <SectionTitle id="vi">VI. Thời gian lưu trữ và xóa dữ liệu</SectionTitle>

            <ArticleTitle id="dieu-6">Điều 6. Thời gian lưu trữ dữ liệu cá nhân</ArticleTitle>
            <P>
              Dữ liệu cá nhân được lưu trữ trong thời gian cần thiết nhằm thực hiện mục đích xử lý dữ liệu
              đã thông báo hoặc theo quy định pháp luật hiện hành.
            </P>
            <P>
              <strong>Quy trình xử lý lệnh xóa dữ liệu:</strong> Khi Người dùng yêu cầu xóa tài khoản,
              Smart Rental sẽ tiếp nhận và xử lý yêu cầu theo quy trình nội bộ. Việc xóa dữ liệu có thể
              không được thực hiện ngay lập tức trong trường hợp dữ liệu cần tiếp tục lưu trữ theo quy
              định pháp luật hoặc đang phục vụ giải quyết tranh chấp, khiếu nại. Smart Rental có thể áp
              dụng biện pháp vô hiệu hóa hoặc ẩn dữ liệu khỏi giao diện người dùng trước khi thực hiện
              xóa hoàn toàn trên hệ thống lưu trữ nội bộ.
            </P>
            <div className="rounded-xl bg-[#fffbeb] border border-[#fde68a] px-4 py-3 mb-4">
              <p className="text-xs font-bold text-[#92400e] uppercase tracking-wide mb-1">Lưu ý bắt buộc lưu trữ</p>
              <p className="text-sm text-[#78350f] leading-relaxed">
                Dữ liệu liên quan đến <strong>Hợp đồng điện tử, lịch sử giao dịch, hóa đơn, hồ sơ khiếu
                nại</strong> được lưu giữ trong thời hạn cần thiết theo quy định pháp luật hoặc phục vụ
                giải quyết tranh chấp, kiểm tra, thanh tra theo yêu cầu của cơ quan Nhà nước có thẩm quyền.
              </p>
            </div>

            <ArticleTitle id="dieu-7">Điều 7. Tính năng xóa tài khoản trực tiếp trong ứng dụng</ArticleTitle>
            <P>
              Smart Rental cung cấp chức năng xóa tài khoản trực tiếp trong ứng dụng. Người dùng có thể
              chủ động gửi yêu cầu xóa thông qua mục <strong>"Cài đặt tài khoản"</strong>. Sau khi xác
              minh danh tính chủ tài khoản, hệ thống sẽ tiến hành xử lý yêu cầu theo đúng quy trình nội
              bộ và các quy định bảo lưu pháp lý tại Điều 6.
            </P>

            <div className="my-8 border-t border-dashed border-[#e0e0e0]" />

            {/* ── VII ── */}
            <SectionTitle id="vii">VII. Quyền của người dùng và quy trình thực hiện</SectionTitle>

            <ArticleTitle id="dieu-8">Điều 8. Quyền của chủ thể dữ liệu đối với thông tin cá nhân</ArticleTitle>
            <P>Người dùng có đầy đủ các quyền hợp pháp đối với dữ liệu cá nhân của mình theo quy định pháp luật:</P>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {USER_RIGHTS.map((right) => (
                <div key={right} className="flex items-center gap-2 rounded-lg bg-[#f3f4f5] px-3 py-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#ffef3d] flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-[#676000]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm text-[#191c1d] font-medium">{right}</span>
                </div>
              ))}
            </div>

            <ArticleTitle id="dieu-9">Điều 9. Biểu mẫu gửi yêu cầu thực thi quyền dữ liệu điện tử</ArticleTitle>
            <P>
              Khi thực hiện các quyền chủ thể dữ liệu, Người dùng gửi Phiếu yêu cầu theo biểu mẫu cấu
              trúc điện tử dưới đây về hòm thư:{' '}
              <a href="mailto:uyenuyenmitoyo@gmail.com" className="font-semibold text-[#933a12] hover:underline">
                uyenuyenmitoyo@gmail.com
              </a>
            </P>

            <div className="rounded-xl border border-[#e0e0e0] bg-[#f8f9fa] p-5 mb-4 text-sm text-[#4a4733]">
              <p className="text-xs font-bold text-[#676000] uppercase tracking-widest mb-4">
                Phiếu yêu cầu thực hiện quyền chủ thể dữ liệu cá nhân
              </p>
              <p className="text-xs text-[#4a4733] mb-4">
                Kính gửi: Ban quản lý bảo mật dữ liệu — Nền tảng Smart Rental
              </p>
              <div className="flex flex-col gap-3 mb-5">
                {[
                  'Họ và tên chủ dữ liệu',
                  'Số điện thoại đăng ký tài khoản hệ thống',
                  'Địa chỉ Email liên kết',
                ].map((label) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-[#191c1d] mb-1">{label}</p>
                    <div className="h-8 rounded-lg border border-dashed border-[#c0c0c0] bg-white" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-[#191c1d] mb-2">Nội dung yêu cầu thực thi:</p>
              <div className="flex flex-col gap-2 mb-4">
                {[
                  'Rút lại sự đồng ý cho phép xử lý dữ liệu cá nhân',
                  'Yêu cầu truy cập / Cung cấp bản sao dữ liệu cá nhân',
                  'Yêu cầu chỉnh sửa / Đính chính thông tin dữ liệu cá nhân',
                  'Yêu cầu xóa bỏ hoàn toàn dữ liệu cá nhân và tài khoản trên hệ thống',
                ].map((opt) => (
                  <label key={opt} className="flex items-start gap-2 cursor-default">
                    <span className="mt-0.5 w-4 h-4 rounded border border-[#c0c0c0] bg-white shrink-0 flex items-center justify-center">
                    </span>
                    <span className="text-sm text-[#4a4733]">{opt}</span>
                  </label>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#191c1d] mb-1">Lý do thực hiện yêu cầu chi tiết</p>
                <div className="h-16 rounded-lg border border-dashed border-[#c0c0c0] bg-white" />
              </div>
              <p className="text-xs text-[#929292] mt-3 italic">
                Người yêu cầu xác nhận thông tin và chịu trách nhiệm về tính chính xác của nội dung cung cấp.
              </p>
            </div>

            <div className="my-8 border-t border-dashed border-[#e0e0e0]" />

            {/* ── VIII ── */}
            <SectionTitle id="viii">VIII. Biện pháp bảo mật và xử lý sự cố dữ liệu</SectionTitle>

            <ArticleTitle id="dieu-10">Điều 10. Cam kết an toàn và quy trình xử lý bảo mật thông tin</ArticleTitle>
            <div className="rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] p-4 mb-4">
              <p className="text-xs font-bold text-[#166534] uppercase tracking-wide mb-2">Cam kết kỹ thuật</p>
              <p className="text-sm text-[#14532d] leading-relaxed">
                Smart Rental áp dụng các biện pháp kỹ thuật và tổ chức phù hợp (bao gồm chuẩn mã hóa{' '}
                <strong>SSL/TLS</strong> cho đường truyền dữ liệu và phân quyền truy cập nghiêm ngặt) nhằm
                bảo vệ dữ liệu cá nhân trước nguy cơ truy cập trái phép, rò rỉ, mất mát hoặc sử dụng sai
                mục đích.
              </p>
            </div>
            <P>
              Trong trường hợp phát hiện sự cố ảnh hưởng đến dữ liệu cá nhân, Smart Rental sẽ tiến hành
              xử lý trong thời gian phù hợp theo mức độ ảnh hưởng của sự cố và thực hiện nghĩa vụ thông
              báo theo quy định pháp luật hiện hành.
            </P>

            <ArticleTitle id="dieu-11">Điều 11. Cookie và công cụ theo dõi</ArticleTitle>
            <P>Smart Rental có thể sử dụng Cookie, SDK hoặc các công cụ phân tích nhằm:</P>
            <ul className="flex flex-col gap-2 mb-4">
              <Li>Ghi nhớ trạng thái đăng nhập.</Li>
              <Li>Cải thiện hiệu suất hệ thống.</Li>
              <Li>Phân tích hành vi sử dụng.</Li>
              <Li>Cá nhân hóa nội dung gợi ý.</Li>
            </ul>
            <P>
              Người dùng có thể quản lý hoặc từ chối Cookie không thiết yếu thông qua cài đặt trình duyệt
              hoặc giao diện quản lý quyền riêng tư của hệ thống. Smart Rental không sử dụng các dữ liệu
              này cho mục đích quảng cáo hoặc chia sẻ cho bên thứ ba nếu chưa có sự đồng ý của Người dùng.
            </P>

            <div className="my-8 border-t border-dashed border-[#e0e0e0]" />

            {/* ── IX — Contact ── */}
            <SectionTitle id="ix">IX. Thông tin liên hệ và đơn vị vận hành</SectionTitle>
            <div className="rounded-2xl bg-[#f3f4f5] p-6 md:p-8 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#4a4733]">
                <div>
                  <p className="font-semibold text-[#191c1d] mb-0.5">Đơn vị vận hành</p>
                  <p>Smart Rental Project Team</p>
                </div>
                <div>
                  <p className="font-semibold text-[#191c1d] mb-0.5">Hotline hỗ trợ</p>
                  <a href="tel:0909562004" className="hover:text-[#933a12] transition-colors">090 9562 004</a>
                </div>
                <div>
                  <p className="font-semibold text-[#191c1d] mb-0.5">Email hỗ trợ chung</p>
                  <a href="mailto:uyenuyenmitoyo@gmail.com" className="hover:text-[#933a12] transition-colors break-all">
                    uyenuyenmitoyo@gmail.com
                  </a>
                </div>
                <div>
                  <p className="font-semibold text-[#191c1d] mb-0.5">Email tiếp nhận yêu cầu bảo mật</p>
                  <a href="mailto:uyenuyenmitoyo@gmail.com" className="hover:text-[#933a12] transition-colors break-all">
                    uyenuyenmitoyo@gmail.com
                  </a>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-semibold text-[#191c1d] mb-0.5">Người phụ trách quản lý dữ liệu cá nhân</p>
                  <p>Nguyễn Vũ Thu Uyên</p>
                </div>
              </div>
            </div>

            {/* ── X ── */}
            <SectionTitle id="x">X. Điều khoản sửa đổi và cập nhật chính sách</SectionTitle>
            <P>
              Smart Rental có quyền sửa đổi, bổ sung hoặc cập nhật Chính sách bảo mật này nhằm phù hợp với
              yêu cầu vận hành hệ thống hoặc quy định pháp luật hiện hành.
            </P>
            <P>
              Mọi thay đổi quan trọng liên quan đến phạm vi thu thập dữ liệu, mục đích xử lý hoặc quyền
              của Người dùng sẽ được thông báo trực quan trên website, ứng dụng hoặc qua địa chỉ Email đã
              đăng ký trước thời điểm chính thức áp dụng.
            </P>
            <P>
              Việc Người dùng tiếp tục sử dụng dịch vụ sau thời điểm chính sách được cập nhật được xem là
              sự xác nhận đồng ý đối với các nội dung điều chỉnh, trừ trường hợp pháp luật có quy định khác.
            </P>

            {/* ── XI ── */}
            <SectionTitle id="xi">XI. Luật điều chỉnh và giải quyết tranh chấp</SectionTitle>
            <P>
              Chính sách bảo mật này được điều chỉnh và giải thích theo pháp luật của nước Cộng hòa Xã hội
              Chủ nghĩa Việt Nam.
            </P>
            <P>
              Mọi tranh chấp phát sinh liên quan đến việc xử lý dữ liệu cá nhân hoặc việc thực hiện quyền
              của chủ thể dữ liệu trước hết sẽ được giải quyết thông qua thương lượng và hòa giải với tinh
              thần thiện chí.
            </P>
            <P>
              Trường hợp không đạt được thỏa thuận, tranh chấp sẽ được đưa ra giải quyết tại cơ quan Nhà
              nước hoặc Tòa án có thẩm quyền theo quy định pháp luật Việt Nam.
            </P>

            {/* ── Nav links ── */}
            <div className="mt-8 pt-6 border-t border-[#ebebeb] flex flex-wrap gap-3">
              <Link href="/terms" className="text-xs font-semibold text-[#933a12] underline underline-offset-2 hover:text-[#7a2f0e] transition-colors">
                Điều khoản sử dụng →
              </Link>
              <Link href="/policy" className="text-xs font-semibold text-[#933a12] underline underline-offset-2 hover:text-[#7a2f0e] transition-colors">
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
