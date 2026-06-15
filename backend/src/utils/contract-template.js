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

const fmtDob = (date) => {
  if (!date) return '---';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const fmtFull = (date) => {
  if (!date) return '---';
  const d = new Date(date);
  return `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
};

const money = (amount) =>
  amount ? amount.toLocaleString('vi-VN') + ' đồng' : '---';

export const buildContractHtml = (data) => {
  const {
    booking, tenant, landlord, property, terms,
    electricityPrice, waterPrice, paymentMethod,
    signedByTenant, signedByLandlord, contractId,
  } = data;

  const fontRegular = toBase64Font('Roboto-Regular.ttf');
  const fontBold    = toBase64Font('Roboto-Bold.ttf');

  const propertyAddress = property.address?.fullAddress
    || [property.address?.street, property.address?.ward, property.address?.district, property.address?.city]
        .filter(Boolean).join(', ')
    || '---';

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
    margin-bottom: 20px;
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

  /* ── Doc title ── */
  .doc-title {
    text-align: center;
    margin: 16px 0 4px;
    font-size: 17px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .doc-date {
    text-align: center;
    font-size: 12px;
    font-style: italic;
    color: #333;
    margin-bottom: 6px;
  }
  .doc-number {
    text-align: center;
    font-size: 12px;
    font-style: italic;
    color: #555;
    margin-bottom: 20px;
  }

  .divider {
    border: none;
    border-top: 1px solid #000;
    margin: 16px 0;
  }
  .divider-thin {
    border: none;
    border-top: 1px dashed #ccc;
    margin: 12px 0;
  }

  /* ── Opening paragraph ── */
  .opening {
    font-size: 12.5px;
    line-height: 1.9;
    margin-bottom: 16px;
    text-align: justify;
  }

  /* ── Party block ── */
  .party-header {
    font-size: 13px;
    font-weight: 700;
    margin: 14px 0 6px;
  }
  .party-row {
    font-size: 12.5px;
    line-height: 1.9;
    padding-left: 8px;
  }
  .party-row .label { color: #333; }
  .party-row .val   { font-weight: 700; }

  /* ── Main terms table ── */
  .terms-block {
    margin: 18px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }
  .terms-row {
    display: flex;
    border-bottom: 1px solid #eee;
    font-size: 12.5px;
  }
  .terms-row:last-child { border-bottom: none; }
  .terms-key {
    width: 45%;
    padding: 7px 12px;
    color: #333;
    border-right: 1px solid #eee;
    background: #fafafa;
  }
  .terms-val {
    flex: 1;
    padding: 7px 12px;
    font-weight: 700;
  }

  /* ── Section heading ── */
  .section-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    margin: 20px 0 8px;
    border-left: 3px solid #000;
    padding-left: 8px;
    letter-spacing: 0.5px;
  }
  .sub-title {
    font-size: 12.5px;
    font-weight: 700;
    margin: 10px 0 4px;
  }

  /* ── Clause list ── */
  .clause-list {
    list-style: none;
    padding-left: 0;
    margin-bottom: 8px;
  }
  .clause-list li {
    font-size: 12.5px;
    line-height: 1.85;
    padding: 3px 0 3px 16px;
    position: relative;
  }
  .clause-list li::before {
    content: '–';
    position: absolute;
    left: 2px;
    color: #333;
  }

  /* ── Extra terms ── */
  .extra-terms {
    font-size: 12.5px;
    line-height: 1.8;
    padding: 10px 14px;
    border-left: 3px solid #aaa;
    color: #333;
    background: #fafafa;
    margin-top: 8px;
  }

  /* ── Signature section ── */
  .sig-section { margin-top: 36px; }
  .sig-intro {
    font-size: 12px;
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
    <div class="motto">Độc lập – Tự do – Hạnh phúc</div>
  </div>

  <hr class="divider"/>

  <!-- DOCUMENT TITLE -->
  <div class="doc-title">Hợp đồng thuê nhà</div>
  <div class="doc-date">
    Hôm nay ${fmtFull(now)}; tại địa chỉ: ${propertyAddress}
  </div>
  <div class="doc-number">Số hợp đồng: SR-${contractId.toString().slice(-8).toUpperCase()}</div>

  <!-- OPENING -->
  <div class="opening">
    Chúng tôi gồm:
  </div>

  <!-- BÊN A -->
  <div class="party-header">1. Đại diện bên cho thuê phòng trọ (Bên A):</div>
  <div class="party-row">
    <span class="label">Ông/bà: </span><span class="val">${landlord.name}</span>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <span class="label">Sinh ngày: </span><span class="val">${fmtDob(landlord.dateOfBirth)}</span>
  </div>
  <div class="party-row">
    <span class="label">Nơi đăng ký HK: </span><span class="val">${landlord.address || '---'}</span>
  </div>
  <div class="party-row">
    <span class="label">CMND/CCCD số: </span><span class="val">${landlord.nationalId?.number || '---'}</span>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <span class="label">cấp ngày: </span><span class="val">${fmtDob(landlord.nationalId?.issuedDate)}</span>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <span class="label">nơi cấp: </span><span class="val">${landlord.nationalId?.issuedPlace || '---'}</span>
  </div>
  <div class="party-row">
    <span class="label">Số điện thoại: </span><span class="val">${landlord.phone || '---'}</span>
  </div>

  <hr class="divider-thin"/>

  <!-- BÊN B -->
  <div class="party-header">2. Bên thuê phòng trọ (Bên B):</div>
  <div class="party-row">
    <span class="label">Ông/bà: </span><span class="val">${tenant.name}</span>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <span class="label">Sinh ngày: </span><span class="val">${fmtDob(tenant.dateOfBirth)}</span>
  </div>
  <div class="party-row">
    <span class="label">Nơi đăng ký HK thường trú: </span><span class="val">${tenant.address || '---'}</span>
  </div>
  <div class="party-row">
    <span class="label">CMND/CCCD số: </span><span class="val">${tenant.nationalId?.number || '---'}</span>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <span class="label">cấp ngày: </span><span class="val">${fmtDob(tenant.nationalId?.issuedDate)}</span>
    &nbsp;&nbsp;&nbsp;&nbsp;
    <span class="label">nơi cấp: </span><span class="val">${tenant.nationalId?.issuedPlace || '---'}</span>
  </div>
  <div class="party-row">
    <span class="label">Số điện thoại: </span><span class="val">${tenant.phone || '---'}</span>
  </div>

  <hr class="divider"/>

  <!-- AGREEMENT PARAGRAPH -->
  <div class="opening">
    Sau khi bàn bạc trên tinh thần tự nguyện, hai bên cùng có lợi, cùng thống nhất như sau:
  </div>

  <!-- MAIN TERMS TABLE -->
  <div class="terms-block">
    <div class="terms-row">
      <div class="terms-key">Bên A đồng ý cho bên B thuê nhà ở tại địa chỉ</div>
      <div class="terms-val">${propertyAddress}</div>
    </div>
    <div class="terms-row">
      <div class="terms-key">Giá thuê nhà</div>
      <div class="terms-val">${money(property.price)} / tháng</div>
    </div>
    <div class="terms-row">
      <div class="terms-key">Hình thức thanh toán</div>
      <div class="terms-val">${paymentMethod || 'Tiền mặt hoặc chuyển khoản ngân hàng'}</div>
    </div>
    <div class="terms-row">
      <div class="terms-key">Tiền điện</div>
      <div class="terms-val">${electricityPrice ? electricityPrice.toLocaleString('vi-VN') + ' đ/kwh' : '---'} &nbsp;(tính theo chỉ số công tơ, thanh toán vào cuối các tháng)</div>
    </div>
    <div class="terms-row">
      <div class="terms-key">Tiền nước</div>
      <div class="terms-val">${waterPrice ? waterPrice.toLocaleString('vi-VN') + ' đ/người' : '---'} &nbsp;(thanh toán vào đầu các tháng)</div>
    </div>
    <div class="terms-row">
      <div class="terms-key">Tiền đặt cọc nhà</div>
      <div class="terms-val">${money(booking.depositAmount)}</div>
    </div>
    <div class="terms-row">
      <div class="terms-key">Hợp đồng có giá trị kể từ ngày</div>
      <div class="terms-val">${fmt(booking.startDate)} &nbsp;đến ngày&nbsp; ${fmt(booking.endDate)} &nbsp;(${booking.duration} tháng)</div>
    </div>
    <div class="terms-row">
      <div class="terms-key">Tổng giá trị hợp đồng</div>
      <div class="terms-val" style="font-size:13px;">${money(booking.totalPrice)}</div>
    </div>
  </div>

  <!-- RESPONSIBILITIES -->
  <div class="section-title">Trách nhiệm của các bên</div>

  <div class="sub-title">* Trách nhiệm của bên A:</div>
  <ul class="clause-list">
    <li>Tạo mọi điều kiện thuận lợi để bên B thực hiện theo hợp đồng.</li>
    <li>Đảm bảo cung cấp nguồn điện, nước, wifi cho bên B sử dụng.</li>
  </ul>

  <div class="sub-title">* Trách nhiệm của bên B:</div>
  <ul class="clause-list">
    <li>Thanh toán đầy đủ các khoản tiền theo đúng thỏa thuận.</li>
    <li>Bảo quản các trang thiết bị và cơ sở vật chất của bên A trang bị cho ban đầu (làm hỏng phải sửa, mất phải đền).</li>
    <li>Không được tự ý sửa chữa, cải tạo cơ sở vật chất khi chưa được sự đồng ý của bên A.</li>
    <li>Giữ gìn vệ sinh trong và ngoài khuôn viên chung.</li>
    <li>Bên B phải chấp hành mọi quy định của pháp luật Nhà nước và quy định của địa phương.</li>
    <li>Nếu bên B cho khách ở qua đêm thì phải thông báo và được sự đồng ý của bên A đồng thời phải chịu trách nhiệm về các hành vi vi phạm pháp luật của khách trong thời gian ở lại.</li>
  </ul>

  <!-- COMMON RESPONSIBILITIES -->
  <div class="section-title">Trách nhiệm chung</div>
  <ul class="clause-list">
    <li>Hai bên phải tạo điều kiện cho nhau thực hiện đúng hợp đồng.</li>
    <li>Trong thời gian hợp đồng còn hiệu lực nếu bên nào vi phạm các điều khoản đã thỏa thuận thì bên còn lại có quyền đơn phương chấm dứt hợp đồng; nếu sự vi phạm hợp đồng đó gây tổn thất cho bên bị vi phạm hợp đồng thì bên vi phạm hợp đồng phải bồi thường thiệt hại.</li>
    <li>Một trong hai bên muốn chấm dứt hợp đồng trước thời hạn thì phải báo trước cho bên kia ít nhất 30 ngày và hai bên phải có sự thống nhất.</li>
    <li>Bên A phải trả lại tiền đặt cọc cho bên B.</li>
    <li>Bên nào vi phạm điều khoản chung thì phải chịu trách nhiệm trước pháp luật.</li>
    <li>Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ một bản (bản điện tử trên hệ thống SmartRental có giá trị tương đương).</li>
  </ul>

  ${terms ? `
  <!-- ADDITIONAL TERMS -->
  <div class="section-title">Điều khoản bổ sung</div>
  <div class="extra-terms">${terms}</div>
  ` : ''}

  <!-- SIGNATURE -->
  <div class="sig-section">
    <div class="sig-intro">
      Hai bên đã đọc, hiểu rõ và đồng ý toàn bộ nội dung hợp đồng này.<br/>
      Ký tên xác nhận dưới đây có giá trị pháp lý tương đương chữ ký tay.
    </div>

    <div class="sig-grid">
      <!-- TENANT (left) -->
      <div class="sig-col">
        <div class="sig-role">Đại diện bên B</div>
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

      <!-- LANDLORD (right) -->
      <div class="sig-col">
        <div class="sig-role">Đại diện bên A</div>
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
