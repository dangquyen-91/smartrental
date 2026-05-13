import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, '../assets/fonts');

const toBase64Font = (filename) => {
  const buffer = fs.readFileSync(path.join(FONT_DIR, filename));
  return buffer.toString('base64');
};

const fmt = (date) =>
  date ? new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---';

const fmtFull = (date) => {
  if (!date) return '---';
  const d = new Date(date);
  return `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
};

const money = (amount) =>
  amount ? amount.toLocaleString('vi-VN') + ' đồng' : '---';

const moneyText = (amount) => {
  if (!amount) return '---';
  return amount.toLocaleString('vi-VN') + ' đồng';
};

export const buildContractHtml = (data) => {
  const { booking, tenant, landlord, property, terms, signedByTenant, signedByLandlord, contractId } = data;

  const fontRegular = toBase64Font('Roboto-Regular.ttf');
  const fontBold    = toBase64Font('Roboto-Bold.ttf');

  const propertyAddress = property.address?.fullAddress
    || [property.address?.street, property.address?.ward, property.address?.district, property.address?.city]
        .filter(Boolean).join(', ')
    || '---';

  const typeMap = { room: 'phòng trọ', apartment: 'căn hộ', house: 'nhà nguyên căn', studio: 'studio' };
  const propType = typeMap[property.type] || property.type;

  const now = new Date();

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8"/>
<title>Hợp đồng thuê nhà - ${contractId}</title>
<style>
  @font-face {
    font-family: 'Roboto';
    src: url('data:font/truetype;base64,${fontRegular}') format('truetype');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Roboto';
    src: url('data:font/truetype;base64,${fontBold}') format('truetype');
    font-weight: 700;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Roboto', 'Times New Roman', serif;
    font-size: 13px;
    color: #000;
    background: #fff;
    line-height: 1.8;
  }

  .page {
    max-width: 760px;
    margin: 0 auto;
    padding: 40px 60px 50px;
    position: relative;
  }

  /* ── Watermark ── */
  .watermark {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-size: 80px;
    font-weight: 700;
    color: rgba(0,0,0,0.04);
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
    letter-spacing: 4px;
  }

  /* ── National header ── */
  .national {
    text-align: center;
    margin-bottom: 28px;
  }
  .national .country {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .national .motto {
    font-size: 13px;
    text-decoration: underline;
    margin-top: 2px;
  }
  .national .location {
    font-size: 12px;
    margin-top: 8px;
    font-style: italic;
    color: #333;
  }

  /* ── Doc title ── */
  .doc-title {
    text-align: center;
    margin: 20px 0 4px;
    font-size: 17px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .doc-subtitle {
    text-align: center;
    font-size: 12px;
    color: #333;
    margin-bottom: 6px;
  }
  .doc-number {
    text-align: center;
    font-size: 12px;
    font-style: italic;
    color: #444;
    margin-bottom: 24px;
  }

  .divider {
    border: none;
    border-top: 1px solid #000;
    margin: 18px 0;
  }
  .divider-thin {
    border: none;
    border-top: 1px solid #ccc;
    margin: 14px 0;
  }

  /* ── Basis ── */
  .basis {
    font-size: 12px;
    color: #333;
    margin-bottom: 18px;
    padding-left: 4px;
    line-height: 1.9;
  }
  .basis p { margin-bottom: 4px; }
  .basis p::before { content: '- '; }

  /* ── Article ── */
  .article { margin-bottom: 20px; }
  .article-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 8px;
    display: flex;
    gap: 6px;
    align-items: baseline;
  }
  .article-num {
    font-size: 13px;
    font-weight: 700;
  }

  /* ── Party block ── */
  .party { margin-bottom: 14px; padding-left: 8px; }
  .party-label {
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 6px;
    border-left: 3px solid #000;
    padding-left: 8px;
  }
  .party-row {
    display: flex;
    gap: 0;
    margin-bottom: 3px;
    padding-left: 4px;
  }
  .party-key {
    min-width: 150px;
    font-size: 12px;
    color: #333;
  }
  .party-val {
    font-size: 12px;
    font-weight: 700;
    flex: 1;
  }

  /* ── Info table ── */
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    font-size: 12.5px;
  }
  .info-table tr { border-bottom: 1px solid #e8e8e8; }
  .info-table tr:last-child { border-bottom: none; }
  .info-table td { padding: 7px 10px; vertical-align: top; }
  .info-table td:first-child {
    width: 50%;
    color: #333;
    font-weight: 400;
  }
  .info-table td:last-child { font-weight: 700; }
  .info-table .total-row td { font-size: 13px; border-top: 2px solid #000; }
  .info-table .total-row td:last-child { font-size: 14px; }

  /* ── Clause list ── */
  .clause-list { padding-left: 0; list-style: none; }
  .clause-list li {
    padding: 5px 0 5px 0;
    font-size: 12.5px;
    line-height: 1.8;
    border-bottom: 1px dotted #ddd;
    display: flex;
    gap: 8px;
  }
  .clause-list li:last-child { border-bottom: none; }
  .clause-list .ci { font-weight: 700; min-width: 20px; }

  /* ── Extra terms ── */
  .extra-terms {
    font-size: 12.5px;
    line-height: 1.8;
    padding: 10px 14px;
    border-left: 3px solid #aaa;
    color: #333;
    background: #fafafa;
  }

  /* ── Signature section ── */
  .sig-section { margin-top: 30px; }
  .sig-intro {
    font-size: 12.5px;
    text-align: center;
    margin-bottom: 24px;
    font-style: italic;
    color: #333;
  }
  .sig-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-top: 10px;
  }
  .sig-col { text-align: center; }
  .sig-role {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
  .sig-note {
    font-size: 11px;
    color: #555;
    font-style: italic;
    margin-bottom: 16px;
  }
  .sig-stamp {
    border: 1px solid #bbb;
    border-radius: 4px;
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto 10px;
    width: 90%;
    background: #fafafa;
    font-size: 11px;
    color: #888;
    gap: 6px;
  }
  .sig-stamp.done {
    border-color: #1a56db;
    background: #f0f5ff;
    color: #1a56db;
  }
  .sig-stamp .check { font-size: 22px; }
  .sig-stamp .sig-ts { font-size: 10px; color: #444; }
  .sig-name { font-size: 13px; font-weight: 700; margin-top: 6px; }

  /* ── Footer ── */
  .doc-footer {
    margin-top: 36px;
    padding-top: 12px;
    border-top: 1px solid #ccc;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #888;
  }
  .verify-code {
    font-family: monospace;
    font-size: 10px;
    color: #999;
    margin-top: 2px;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>

<div class="watermark">SMARTRENTAL</div>

<div class="page">

  <!-- NATIONAL HEADER -->
  <div class="national">
    <div class="country">Cộng hòa xã hội chủ nghĩa Việt Nam</div>
    <div class="motto">Độc lập - Tự do - Hạnh phúc</div>
    <div class="location">TP. Hồ Chí Minh, ${fmtFull(now)}</div>
  </div>

  <hr class="divider"/>

  <!-- DOCUMENT TITLE -->
  <div class="doc-title">Hợp đồng thuê nhà ở</div>
  <div class="doc-subtitle">Căn cứ Bộ luật Dân sự số 91/2015/QH13 và các quy định pháp luật hiện hành về cho thuê nhà ở</div>
  <div class="doc-number">Số hợp đồng: SR-${contractId.toString().slice(-8).toUpperCase()}</div>

  <!-- BASIS -->
  <div class="basis">
    <p>Căn cứ nhu cầu và khả năng của hai bên</p>
    <p>Căn cứ nguyên tắc tự nguyện, bình đẳng, thiện chí, hợp tác và trung thực</p>
    <p>Sau khi bàn bạc, hai bên thống nhất ký kết hợp đồng thuê nhà ở với các điều khoản sau</p>
  </div>

  <!-- ARTICLE 1 - PARTIES -->
  <div class="article">
    <div class="article-title">
      <span class="article-num">Điều 1.</span>
      <span>Thông tin các bên</span>
    </div>

    <div class="party">
      <div class="party-label">Bên cho thuê (Bên A)</div>
      <div class="party-row"><span class="party-key">Họ và tên:</span><span class="party-val">${landlord.name}</span></div>
      <div class="party-row"><span class="party-key">Số điện thoại:</span><span class="party-val">${landlord.phone || '---'}</span></div>
      <div class="party-row"><span class="party-key">Email:</span><span class="party-val">${landlord.email}</span></div>
      <div class="party-row"><span class="party-key">Địa chỉ liên hệ:</span><span class="party-val">${landlord.address || '---'}</span></div>
    </div>

    <hr class="divider-thin"/>

    <div class="party">
      <div class="party-label">Bên thuê (Bên B)</div>
      <div class="party-row"><span class="party-key">Họ và tên:</span><span class="party-val">${tenant.name}</span></div>
      <div class="party-row"><span class="party-key">Số điện thoại:</span><span class="party-val">${tenant.phone || '---'}</span></div>
      <div class="party-row"><span class="party-key">Email:</span><span class="party-val">${tenant.email}</span></div>
      <div class="party-row"><span class="party-key">Địa chỉ liên hệ:</span><span class="party-val">${tenant.address || '---'}</span></div>
    </div>
  </div>

  <!-- ARTICLE 2 - PROPERTY -->
  <div class="article">
    <div class="article-title">
      <span class="article-num">Điều 2.</span>
      <span>Đối tượng hợp đồng</span>
    </div>
    <p style="font-size:12.5px; margin-bottom:10px;">
      Bên A đồng ý cho Bên B thuê <strong>${propType}</strong> với thông tin cụ thể như sau:
    </p>
    <table class="info-table">
      <tr><td>Tên bất động sản</td><td>${property.title}</td></tr>
      <tr><td>Loại hình</td><td>${propType.charAt(0).toUpperCase() + propType.slice(1)}</td></tr>
      <tr><td>Địa chỉ</td><td>${propertyAddress}</td></tr>
      <tr><td>Diện tích sử dụng</td><td>${property.area ? property.area + ' m²' : '---'}</td></tr>
      <tr><td>Số phòng ngủ / phòng tắm</td><td>${property.bedrooms ?? '---'} phòng ngủ · ${property.bathrooms ?? '---'} phòng tắm</td></tr>
    </table>
  </div>

  <!-- ARTICLE 3 - TERMS -->
  <div class="article">
    <div class="article-title">
      <span class="article-num">Điều 3.</span>
      <span>Thời hạn và giá thuê</span>
    </div>
    <table class="info-table">
      <tr><td>Thời hạn thuê</td><td>${booking.duration} tháng</td></tr>
      <tr><td>Ngày bắt đầu</td><td>${fmt(booking.startDate)}</td></tr>
      <tr><td>Ngày kết thúc</td><td>${fmt(booking.endDate)}</td></tr>
      <tr><td>Giá thuê hàng tháng</td><td>${money(property.price)}</td></tr>
      <tr class="total-row"><td>Tổng giá trị hợp đồng</td><td>${moneyText(booking.totalPrice)}</td></tr>
    </table>
    <p style="font-size:11.5px; margin-top:10px; color:#444; font-style:italic;">
      * Tiền thuê được thanh toán trước ngày 05 hàng tháng bằng tiền mặt hoặc chuyển khoản ngân hàng.
    </p>
  </div>

  <!-- ARTICLE 4 - OBLIGATIONS -->
  <div class="article">
    <div class="article-title">
      <span class="article-num">Điều 4.</span>
      <span>Quyền và nghĩa vụ các bên</span>
    </div>
    <p style="font-size:12.5px; font-weight:700; margin-bottom:6px;">4.1. Nghĩa vụ của Bên A:</p>
    <ul class="clause-list">
      <li><span class="ci">a.</span><span>Giao nhà đúng thời hạn, đúng hiện trạng và đầy đủ trang thiết bị kèm theo như đã thỏa thuận.</span></li>
      <li><span class="ci">b.</span><span>Bảo đảm cho Bên B sử dụng ổn định trong suốt thời hạn hợp đồng.</span></li>
      <li><span class="ci">c.</span><span>Thông báo trước cho Bên B tối thiểu 30 ngày nếu có thay đổi ảnh hưởng đến việc thuê nhà.</span></li>
    </ul>
    <p style="font-size:12.5px; font-weight:700; margin-top:12px; margin-bottom:6px;">4.2. Nghĩa vụ của Bên B:</p>
    <ul class="clause-list">
      <li><span class="ci">a.</span><span>Thanh toán tiền thuê đầy đủ và đúng hạn theo thỏa thuận.</span></li>
      <li><span class="ci">b.</span><span>Sử dụng nhà đúng mục đích, giữ gìn vệ sinh và bảo quản tài sản. Không tự ý sửa chữa, cải tạo khi chưa được Bên A đồng ý bằng văn bản.</span></li>
      <li><span class="ci">c.</span><span>Không cho thuê lại hoặc chuyển nhượng hợp đồng khi chưa có sự đồng ý của Bên A.</span></li>
      <li><span class="ci">d.</span><span>Thông báo trước tối thiểu 30 ngày nếu muốn chấm dứt hợp đồng trước hạn.</span></li>
    </ul>
  </div>

  ${terms ? `
  <!-- ARTICLE 5 - ADDITIONAL TERMS -->
  <div class="article">
    <div class="article-title">
      <span class="article-num">Điều 5.</span>
      <span>Điều khoản bổ sung</span>
    </div>
    <div class="extra-terms">${terms}</div>
  </div>` : ''}

  <!-- ARTICLE 6 - GENERAL -->
  <div class="article">
    <div class="article-title">
      <span class="article-num">Điều ${terms ? '6' : '5'}.</span>
      <span>Điều khoản chung</span>
    </div>
    <ul class="clause-list">
      <li><span class="ci">1.</span><span>Hợp đồng được lập thành bản điện tử có giá trị pháp lý tương đương bản giấy theo quy định của Luật Giao dịch điện tử.</span></li>
      <li><span class="ci">2.</span><span>Mọi sửa đổi, bổ sung hợp đồng phải được lập thành văn bản và có chữ ký xác nhận của cả hai bên.</span></li>
      <li><span class="ci">3.</span><span>Trong trường hợp có tranh chấp, hai bên ưu tiên giải quyết thông qua thương lượng, hòa giải. Nếu không thành, tranh chấp sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền.</span></li>
      <li><span class="ci">4.</span><span>Hợp đồng có hiệu lực kể từ ngày cả hai bên hoàn tất ký tên điện tử trên hệ thống SmartRental và có giá trị cho đến khi hết thời hạn hoặc được chấm dứt theo quy định.</span></li>
    </ul>
  </div>

  <!-- SIGNATURE -->
  <div class="sig-section">
    <div class="sig-intro">
      Hai bên đã đọc, hiểu rõ và đồng ý toàn bộ nội dung hợp đồng này.<br/>
      Ký tên xác nhận dưới đây có giá trị pháp lý tương đương chữ ký tay.
    </div>

    <div class="sig-grid">
      <!-- LANDLORD -->
      <div class="sig-col">
        <div class="sig-role">Bên cho thuê (Bên A)</div>
        <div class="sig-note">(Ký và ghi rõ họ tên)</div>
        ${signedByLandlord?.signed ? `
        <div class="sig-stamp done">
          <span class="check">✔</span>
          <span style="font-weight:700; font-size:12px; color:#1a56db;">Đã ký điện tử</span>
          <span class="sig-ts">${fmt(signedByLandlord.signedAt)}</span>
        </div>` : `
        <div class="sig-stamp">
          <span style="font-size:18px; color:#ccc;">✎</span>
          <span>Chờ ký điện tử</span>
        </div>`}
        <div class="sig-name">${landlord.name}</div>
      </div>

      <!-- TENANT -->
      <div class="sig-col">
        <div class="sig-role">Bên thuê (Bên B)</div>
        <div class="sig-note">(Ký và ghi rõ họ tên)</div>
        ${signedByTenant?.signed ? `
        <div class="sig-stamp done">
          <span class="check">✔</span>
          <span style="font-weight:700; font-size:12px; color:#1a56db;">Đã ký điện tử</span>
          <span class="sig-ts">${fmt(signedByTenant.signedAt)}</span>
        </div>` : `
        <div class="sig-stamp">
          <span style="font-size:18px; color:#ccc;">✎</span>
          <span>Chờ ký điện tử</span>
        </div>`}
        <div class="sig-name">${tenant.name}</div>
      </div>
    </div>
  </div>

  <!-- DOCUMENT FOOTER -->
  <div class="doc-footer">
    <div>
      <div>SmartRental · Nền tảng cho thuê bất động sản điện tử</div>
      <div class="verify-code">Mã xác thực: SR-${contractId.toString().toUpperCase()}</div>
    </div>
    <div style="text-align:right;">
      <div>Ngày tạo: ${fmt(now)}</div>
      <div>Tài liệu được tạo tự động — có giá trị pháp lý</div>
    </div>
  </div>

</div><!-- /page -->
</body>
</html>`;
};
