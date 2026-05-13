import AppError from '../utils/app-error.js';

/**
 * Send OTP via ESMS (esms.vn)
 * Docs: https://esms.vn/tai-lieu-esms-api
 *
 * If ESMS_API_KEY is not set (dev/test), chỉ log ra console.
 */
const sendOtp = async (phone, otp) => {
  const apiKey = process.env.ESMS_API_KEY;
  const secretKey = process.env.ESMS_SECRET_KEY;
  const brandname = process.env.ESMS_BRANDNAME || 'Verify';

  if (!apiKey || !secretKey) {
    console.log(`[SMS - DEV] OTP for ${phone}: ${otp}`);
    return;
  }

  const content = `[SmartRental] Ma xac thuc cua ban la: ${otp}. Co hieu luc trong 5 phut. Khong chia se ma nay cho bat ky ai.`;

  const url =
    `https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get` +
    `?ApiKey=${encodeURIComponent(apiKey)}` +
    `&SecretKey=${encodeURIComponent(secretKey)}` +
    `&Phone=${encodeURIComponent(phone)}` +
    `&Content=${encodeURIComponent(content)}` +
    `&SmsType=2` +
    `&Brandname=${encodeURIComponent(brandname)}`;

  let data;
  try {
    const res = await fetch(url);
    data = await res.json();
  } catch (err) {
    throw new AppError('SMS service unavailable', 503);
  }

  if (data.CodeResult !== '100') {
    throw new AppError(`Failed to send OTP (${data.CodeResult}): ${data.ErrorMessage}`, 502);
  }
};

export { sendOtp };
