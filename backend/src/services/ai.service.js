import { GoogleGenerativeAI } from '@google/generative-ai';
import AppError from '../utils/app-error.js';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[ai] GEMINI_API_KEY not set — AI explain will be unavailable');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// In-memory cache: key = "profileId1:profileId2", value = { text, expiresAt }
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const explainCache = new Map();

const SYSTEM_PROMPT = `Bạn là trợ lý phân tích sự tương thích giữa hai người tìm bạn cùng phòng trên nền tảng SmartRental.

Nhiệm vụ: Dựa vào thông tin profile của hai người dùng và điểm tương thích (0–100), hãy viết một đoạn văn ngắn (3–5 câu) bằng tiếng Việt để giải thích tại sao họ phù hợp (hoặc không phù hợp) với nhau.

Quy tắc:
- Luôn dùng tên của hai người trong lời giải thích
- Đề cập cụ thể các yếu tố khớp: ngân sách, lịch sinh hoạt, lối sống, thú cưng, hút thuốc
- Nếu có yếu tố không khớp, nêu nhẹ nhàng và mang tính xây dựng
- Giọng văn thân thiện, tự nhiên, không máy móc
- Chỉ trả về đoạn văn giải thích, không kèm tiêu đề hay nhãn`;

const formatProfile = (profile) => {
  const user = profile.user || {};
  return {
    name: user.name || 'Người dùng',
    gender: profile.gender,
    budget: profile.budget,
    schedule: profile.schedule,
    lifestyle: profile.lifestyle,
    pets: profile.pets,
    smoking: profile.smoking,
    bio: profile.bio || null,
  };
};


const explainRoommateMatch = async (myProfile, candidateProfile, score) => {
  const cacheKey = `${myProfile._id}:${candidateProfile._id}`;
  const cached = explainCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.text;
  }

  const me = formatProfile(myProfile);
  const them = formatProfile(candidateProfile);

  const prompt = `${SYSTEM_PROMPT}

Điểm tương thích: ${score}/100

Profile của ${me.name}:
- Giới tính: ${me.gender}
- Ngân sách: ${me.budget.min.toLocaleString('vi-VN')}đ – ${me.budget.max.toLocaleString('vi-VN')}đ/tháng
- Lịch sinh hoạt: ${me.schedule}
- Lối sống: ${me.lifestyle}
- Thú cưng: ${me.pets}
- Hút thuốc: ${me.smoking}
${me.bio ? `- Bio: ${me.bio}` : ''}

Profile của ${them.name}:
- Giới tính: ${them.gender}
- Ngân sách: ${them.budget.min.toLocaleString('vi-VN')}đ – ${them.budget.max.toLocaleString('vi-VN')}đ/tháng
- Lịch sinh hoạt: ${them.schedule}
- Lối sống: ${them.lifestyle}
- Thú cưng: ${them.pets}
- Hút thuốc: ${them.smoking}
${them.bio ? `- Bio: ${them.bio}` : ''}

Hãy giải thích sự tương thích giữa ${me.name} và ${them.name}.`;

  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service not configured — GEMINI_API_KEY missing', 503);
  }

  let text;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (err) {
    console.error('[ai] Gemini error:', err?.status, err?.message ?? err);
    if (err?.status === 429) {
      throw new AppError('Dịch vụ AI tạm thời quá tải, vui lòng thử lại sau ít phút.', 503);
    }
    throw new AppError('AI service unavailable, please try again later', 503);
  }
  explainCache.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS });
  return text;
};

// ─── Property Recommendations ────────────────────────────────────────────────

const recommendCache = new Map();

const explainPropertyRecommendations = async (userId, userContext, properties) => {
  const hourKey = Math.floor(Date.now() / CACHE_TTL_MS);
  const cacheKey = `rec:${userId}:${hourKey}`;
  const cached = recommendCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.text;

  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI service not configured — GEMINI_API_KEY missing', 503);
  }

  const typeMap = { room: 'phòng trọ', apartment: 'căn hộ', house: 'nhà nguyên căn', studio: 'studio' };
  const contextLines = [];
  if (userContext.budget?.max) {
    const min = (userContext.budget.min ?? 0).toLocaleString('vi-VN');
    const max = userContext.budget.max.toLocaleString('vi-VN');
    contextLines.push(`Ngân sách: ${min}đ – ${max}đ/tháng`);
  }
  if (userContext.preferredTypes?.length) {
    contextLines.push(`Loại phòng mong muốn: ${userContext.preferredTypes.map(t => typeMap[t] ?? t).join(', ')}`);
  }
  if (userContext.preferredCity) {
    contextLines.push(`Khu vực: ${[userContext.preferredCity, userContext.preferredDistrict].filter(Boolean).join(', ')}`);
  }
  if (userContext.requiredAmenities?.length) {
    contextLines.push(`Tiện nghi cần có: ${userContext.requiredAmenities.join(', ')}`);
  }

  const propsText = properties
    .map((p, i) => {
      const addr = p.address ?? {};
      const score = p.matchScore ?? '?';
      return `${i + 1}. "${p.title}" — ${typeMap[p.type] ?? p.type}, ${[addr.district, addr.city].filter(Boolean).join(', ')} — ${p.price.toLocaleString('vi-VN')}đ/tháng — phù hợp ${score}%`;
    })
    .join('\n');

  const prompt = `Bạn là trợ lý thông minh của SmartRental — nền tảng thuê nhà tại Việt Nam.

Nhiệm vụ: Dựa vào hồ sơ tìm phòng và tỉ lệ phù hợp, hãy viết 2–3 câu ngắn gọn bằng tiếng Việt giải thích tại sao những phòng này được gợi ý cho người dùng.

Hồ sơ tìm phòng:
${contextLines.length ? contextLines.join('\n') : 'Hồ sơ chưa đầy đủ thông tin'}

Danh sách phòng gợi ý:
${propsText}

Quy tắc:
- Giọng văn thân thiện, tự nhiên
- Đề cập 1–2 tiêu chí nổi bật khớp với hồ sơ (ngân sách, vị trí, tiện nghi)
- Chỉ trả về đoạn văn, không kèm tiêu đề hay nhãn
- Tối đa 3 câu`;

  let text;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (err) {
    console.error('[ai] Gemini recommendation error:', err?.status, err?.message ?? err);
    if (err?.status === 429) {
      throw new AppError('Dịch vụ AI tạm thời quá tải, vui lòng thử lại sau ít phút.', 503);
    }
    throw new AppError('AI service unavailable, please try again later', 503);
  }

  recommendCache.set(cacheKey, { text, expiresAt: Date.now() + CACHE_TTL_MS });
  return text;
};

export { explainRoommateMatch, explainPropertyRecommendations };
