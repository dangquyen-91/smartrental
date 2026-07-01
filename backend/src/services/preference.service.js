import TenantPreference from '../models/preference.model.js';

const getMyPreference = async (userId) => {
  return TenantPreference.findOne({ user: userId }).lean();
};

const upsertPreference = async (userId, data) => {
  const { budget, preferredTypes, preferredCity, preferredDistrict, requiredAmenities, minArea, maxArea } = data;
  return TenantPreference.findOneAndUpdate(
    { user: userId },
    { budget, preferredTypes, preferredCity, preferredDistrict, requiredAmenities, minArea, maxArea },
    { upsert: true, new: true, runValidators: true },
  );
};

const deletePreference = async (userId) => {
  await TenantPreference.deleteOne({ user: userId });
};

// ─── Scoring ─────────────────────────────────────────────────────────────────
// Returns 0–100. Unset criteria give full marks (no constraint = satisfied).

const scorePropertyAgainstPreference = (property, preference) => {
  let score = 0;

  // Budget: 35 pts
  if (preference.budget?.max) {
    const price = property.price;
    if (price <= preference.budget.max) score += 35;
    else if (price <= preference.budget.max * 1.2) score += 18;
    // else 0 — over budget by >20%
  } else {
    score += 35;
  }

  // Type: 20 pts
  if (preference.preferredTypes?.length > 0) {
    if (preference.preferredTypes.includes(property.type)) score += 20;
  } else {
    score += 20;
  }

  // City: 15 pts
  if (preference.preferredCity) {
    const city = property.address?.city ?? '';
    if (city.toLowerCase().includes(preference.preferredCity.toLowerCase())) score += 15;
  } else {
    score += 15;
  }

  // District: 10 pts (only meaningful when city also given)
  if (preference.preferredDistrict) {
    const district = property.address?.district ?? '';
    if (district.toLowerCase().includes(preference.preferredDistrict.toLowerCase())) score += 10;
  } else {
    score += 10;
  }

  // Amenities: 15 pts
  if (preference.requiredAmenities?.length > 0) {
    const overlap = preference.requiredAmenities.filter((a) =>
      property.amenities?.includes(a),
    ).length;
    score += Math.round((overlap / preference.requiredAmenities.length) * 15);
  } else {
    score += 15;
  }

  // Area: 5 pts
  if (preference.minArea || preference.maxArea) {
    const inRange =
      (!preference.minArea || property.area >= preference.minArea) &&
      (!preference.maxArea || property.area <= preference.maxArea);
    if (inRange) score += 5;
  } else {
    score += 5;
  }

  return Math.min(100, score);
};

export { getMyPreference, upsertPreference, deletePreference, scorePropertyAgainstPreference };
