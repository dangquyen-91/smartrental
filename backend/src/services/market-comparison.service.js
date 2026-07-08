import { predictPriceBatch } from './price-prediction.service.js';

// In-memory cache: key = "propertyId:updatedAtMs", value = { value, expiresAt }
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const cache = new Map();

const buildPredictInput = (p) => {
  if (!p.area || !p.address?.city || !p.address?.district) return null;
  const furniture = p.amenities?.includes('Nội thất đầy đủ') ? 'full' : 'unknown';
  return {
    area: p.area,
    city: p.address.city,
    district: p.address.district,
    ...(p.bedrooms !== undefined && p.bedrooms !== null && { bedrooms: p.bedrooms }),
    furniture,
    condition: 'unknown',
    amenities: p.amenities ?? [],
  };
};

const labelFor = (listedPrice, predictedPrice) => {
  const diffPercent = Math.round(((listedPrice - predictedPrice) / predictedPrice) * 100);
  const label = diffPercent <= -10 ? 'below_market' : diffPercent >= 10 ? 'above_market' : 'fair';
  return { label, diffPercent };
};

// Gắn `marketComparison` vào từng property — non-blocking, không throw nếu ML service lỗi
const attachMarketComparison = async (properties) => {
  const toFetch = [];
  const results = new Map();

  for (const p of properties) {
    const updatedAtMs = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
    const key = `${p.id}:${updatedAtMs}`;
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      results.set(p.id, cached.value);
      continue;
    }
    const input = buildPredictInput(p);
    if (!input) { results.set(p.id, null); continue; }
    toFetch.push({ id: p.id, key, price: p.price, input });
  }

  if (toFetch.length) {
    try {
      const predictions = await predictPriceBatch(toFetch.map((t) => t.input));
      toFetch.forEach((t, i) => {
        const pred = predictions[i];
        const value = pred
          ? { predictedPrice: pred.predictedPrice, ...labelFor(t.price, pred.predictedPrice) }
          : null;
        results.set(t.id, value);
        cache.set(t.key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
      });
    } catch (err) {
      console.warn('[market-comparison] batch predict skipped:', err.message);
      toFetch.forEach((t) => results.set(t.id, null));
    }
  }

  return properties.map((p) => ({ ...p, marketComparison: results.get(p.id) ?? null }));
};

export { attachMarketComparison };
