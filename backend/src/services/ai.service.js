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

export { explainRoommateMatch };
