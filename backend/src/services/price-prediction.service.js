import AppError from '../utils/app-error.js';

if (!process.env.ML_SERVICE_URL) {
  console.warn('[price-prediction] ML_SERVICE_URL not set — price prediction will be unavailable');
}

const callMlService = async (path, body) => {
  if (!process.env.ML_SERVICE_URL) {
    throw new AppError('Dịch vụ dự đoán giá chưa được cấu hình', 503);
  }

  const timeoutMs = Number(process.env.ML_SERVICE_TIMEOUT_MS) || 5000;

  let response;
  try {
    response = await fetch(`${process.env.ML_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    console.error('[price-prediction] request error:', err?.name, err?.message ?? err);
    throw new AppError('Dịch vụ dự đoán giá tạm thời không khả dụng, vui lòng thử lại sau.', 503);
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    console.error('[price-prediction] ml-service error:', response.status, detail);
    throw new AppError('Dịch vụ dự đoán giá tạm thời không khả dụng, vui lòng thử lại sau.', 503);
  }

  return response.json();
};

const predictPrice = (input) => callMlService('/predict', input);

const predictPriceBatch = async (items) => {
  if (!items.length) return [];
  const { results } = await callMlService('/predict/batch', { items });
  return results;
};

export { predictPrice, predictPriceBatch };
