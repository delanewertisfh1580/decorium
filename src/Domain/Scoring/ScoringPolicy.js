function requireBoundedNumber(value, label, { min = 0, max = 1, exclusiveMin = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)
    || (exclusiveMin ? value <= min : value < min) || value > max) {
    throw new Error(`ScoringPolicy: ${label} must be between ${min} and ${max}`);
  }
  return value;
}

function validateSharedParameters(params) {
  if (!Number.isInteger(params.criticalStarCap) || params.criticalStarCap < 0 || params.criticalStarCap > 4) {
    throw new Error('ScoringPolicy: criticalStarCap must be an integer between 0 and 4');
  }
  if (typeof params.scoreEpsilon !== 'number' || !Number.isFinite(params.scoreEpsilon)
    || params.scoreEpsilon < 0 || params.scoreEpsilon > 0.01) {
    throw new Error('ScoringPolicy: scoreEpsilon must be between 0 and 0.01');
  }
  const thresholds = params.starRatingThresholds;
  if (!thresholds || typeof thresholds !== 'object' || Array.isArray(thresholds)) {
    throw new Error('ScoringPolicy: missing starRatingThresholds');
  }
  for (const key of ['0', '1', '2', '3', '4', '5']) {
    if (typeof thresholds[key] !== 'number') {
      throw new Error(`ScoringPolicy: missing threshold for ${key} stars`);
    }
  }
  if (typeof params.maxPenalty !== 'number' || params.maxPenalty <= 0) {
    throw new Error('ScoringPolicy: maxPenalty must be a positive number');
  }
  return Object.freeze({
    starRatingThresholds: Object.freeze({ ...thresholds }),
    maxPenalty: params.maxPenalty,
    defaultWeight: typeof params.defaultWeight === 'number' ? params.defaultWeight : 1,
    criticalStarCap: params.criticalStarCap,
    scoreEpsilon: params.scoreEpsilon
  });
}

function normalizeWeights(value, label, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`ScoringPolicy: ${label} must be an object`);
  }
  const normalized = {};
  for (const key of keys) normalized[key] = requireBoundedNumber(value[key], `${label}.${key}`);
  const total = Object.values(normalized).reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(total - 1) > 0.000001) {
    throw new Error(`ScoringPolicy: ${label} weights must sum to 1`);
  }
  return Object.freeze(normalized);
}

function normalizeOccupancy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schemaVersion !== 1) {
    throw new Error('ScoringPolicy: occupancy schemaVersion must be 1');
  }
  return Object.freeze({
    schemaVersion: 1,
    cellSizeMeters: requireBoundedNumber(value.cellSizeMeters, 'occupancy.cellSizeMeters', { min: 0, max: 1, exclusiveMin: true })
  });
}

function normalizeDensityProfiles(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('ScoringPolicy: densityProfiles must be an object');
  }
  const profiles = {};
  for (const density of ['intimate', 'balanced', 'open']) {
    const profile = value[density];
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      throw new Error(`ScoringPolicy: densityProfiles.${density} must be an object`);
    }
    profiles[density] = Object.freeze({
      targetFreeAreaRatio: requireBoundedNumber(profile.targetFreeAreaRatio, `densityProfiles.${density}.targetFreeAreaRatio`),
      tolerance: requireBoundedNumber(profile.tolerance, `densityProfiles.${density}.tolerance`)
    });
  }
  return Object.freeze(profiles);
}

export class ScoringPolicy {
  constructor(params) {
    if (!params || typeof params !== 'object' || Array.isArray(params)) {
      throw new Error('ScoringPolicy: params must be a valid object');
    }
    if (params.schemaVersion !== 2) {
      throw new Error('ScoringPolicy: schemaVersion must be 2');
    }

    const shared = validateSharedParameters(params);
    this._schemaVersion = 2;
    this._starRatingThresholds = shared.starRatingThresholds;
    this._maxPenalty = shared.maxPenalty;
    this._defaultWeight = shared.defaultWeight;
    this._criticalStarCap = shared.criticalStarCap;
    this._scoreEpsilon = shared.scoreEpsilon;
    this._channelWeights = normalizeWeights(params.channelWeights, 'channelWeights', ['style', 'clientPriorities', 'ergonomics']);
    this._styleBlend = normalizeWeights(params.styleBlend, 'styleBlend', ['targetFit', 'composition']);
    this._occupancy = normalizeOccupancy(params.occupancy);
    this._densityProfiles = normalizeDensityProfiles(params.densityProfiles);
    Object.freeze(this);
  }

  get schemaVersion() { return this._schemaVersion; }
  get starRatingThresholds() { return this._starRatingThresholds; }
  get maxPenalty() { return this._maxPenalty; }
  get defaultWeight() { return this._defaultWeight; }
  get criticalStarCap() { return this._criticalStarCap; }
  get scoreEpsilon() { return this._scoreEpsilon; }
  get channelWeights() { return this._channelWeights; }
  get styleBlend() { return this._styleBlend; }
  get occupancy() { return this._occupancy; }
  get densityProfiles() { return this._densityProfiles; }
}

export default ScoringPolicy;
