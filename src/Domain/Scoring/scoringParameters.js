let _scoringParameters = null;

function requireBoundedNumber(value, label, { min = 0, max = 1, exclusiveMin = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)
    || (exclusiveMin ? value <= min : value < min) || value > max) {
    throw new Error(`scoringParameters: ${label} must be between ${min} and ${max}`);
  }
  return value;
}

function validateSharedParameters(params) {
  if (!Number.isInteger(params.criticalStarCap) || params.criticalStarCap < 0 || params.criticalStarCap > 4) {
    throw new Error('scoringParameters: criticalStarCap must be an integer between 0 and 4');
  }
  if (typeof params.scoreEpsilon !== 'number' || !Number.isFinite(params.scoreEpsilon)
    || params.scoreEpsilon < 0 || params.scoreEpsilon > 0.01) {
    throw new Error('scoringParameters: scoreEpsilon must be between 0 and 0.01');
  }
  const thresholds = params.starRatingThresholds ?? params.starThresholds;
  if (!thresholds || typeof thresholds !== 'object' || Array.isArray(thresholds)) {
    throw new Error('scoringParameters: missing starRatingThresholds');
  }
  for (const key of ['0', '1', '2', '3', '4', '5']) {
    if (typeof thresholds[key] !== 'number') {
      throw new Error(`scoringParameters: missing threshold for ${key} stars`);
    }
  }
  if (typeof params.maxPenalty !== 'number' || params.maxPenalty <= 0) {
    throw new Error('scoringParameters: maxPenalty must be a positive number');
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
    throw new Error(`scoringParameters: ${label} must be an object`);
  }
  const normalized = {};
  for (const key of keys) normalized[key] = requireBoundedNumber(value[key], `${label}.${key}`);
  const total = Object.values(normalized).reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(total - 1) > 0.000001) {
    throw new Error(`scoringParameters: ${label} weights must sum to 1`);
  }
  return Object.freeze(normalized);
}

function normalizeOccupancy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schemaVersion !== 1) {
    throw new Error('scoringParameters: occupancy schemaVersion must be 1');
  }
  return Object.freeze({
    schemaVersion: 1,
    cellSizeMeters: requireBoundedNumber(value.cellSizeMeters, 'occupancy.cellSizeMeters', { min: 0, max: 1, exclusiveMin: true })
  });
}

function normalizeDensityProfiles(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('scoringParameters: densityProfiles must be an object');
  }
  const profiles = {};
  for (const density of ['intimate', 'balanced', 'open']) {
    const profile = value[density];
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      throw new Error(`scoringParameters: densityProfiles.${density} must be an object`);
    }
    profiles[density] = Object.freeze({
      targetFreeAreaRatio: requireBoundedNumber(profile.targetFreeAreaRatio, `densityProfiles.${density}.targetFreeAreaRatio`),
      tolerance: requireBoundedNumber(profile.tolerance, `densityProfiles.${density}.tolerance`)
    });
  }
  return Object.freeze(profiles);
}

export function initializeScoringParameters(params) {
  if (!params || typeof params !== 'object') {
    throw new Error('scoringParameters: params must be a valid object');
  }
  if (params.schemaVersion !== 1 && params.schemaVersion !== 2) {
    throw new Error('scoringParameters: schemaVersion must be 1 or 2');
  }
  const shared = validateSharedParameters(params);
  if (params.schemaVersion === 1) {
    const styleWeight = typeof params.styleWeight === 'number' ? params.styleWeight : 1;
    const ergonomicsWeight = typeof params.ergonomicsWeight === 'number' ? params.ergonomicsWeight : 0;
    _scoringParameters = Object.freeze({ schemaVersion: 1, ...shared, styleWeight, ergonomicsWeight });
    return;
  }

  const channelWeights = normalizeWeights(params.channelWeights, 'channelWeights', ['style', 'clientPriorities', 'ergonomics']);
  const styleBlend = normalizeWeights(params.styleBlend, 'styleBlend', ['targetFit', 'composition']);
  const occupancy = normalizeOccupancy(params.occupancy);
  const densityProfiles = normalizeDensityProfiles(params.densityProfiles);
  _scoringParameters = Object.freeze({
    schemaVersion: 2,
    ...shared,
    channelWeights,
    styleBlend,
    occupancy,
    densityProfiles,
    // Explicit legacy projections keep pre-PROD-023 consumers read-compatible during migration.
    styleWeight: channelWeights.style,
    ergonomicsWeight: channelWeights.ergonomics
  });
}

export function getScoringParameters() {
  if (!_scoringParameters) {
    throw new Error('scoringParameters: not initialized. Call initializeScoringParameters first.');
  }
  return _scoringParameters;
}

export function resetScoringParameters() {
  _scoringParameters = null;
}
