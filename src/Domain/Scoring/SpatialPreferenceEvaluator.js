function requireFiniteRatio(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`SpatialPreferenceEvaluator ${label} must be between 0 and 1`);
  }
  return value;
}

function requireDensityProfiles(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('SpatialPreferenceEvaluator densityProfiles must be an object');
  }
  const result = {};
  for (const [density, profile] of Object.entries(value)) {
    if (!profile || typeof profile !== 'object') {
      throw new Error(`SpatialPreferenceEvaluator density profile must be an object: ${density}`);
    }
    result[density] = Object.freeze({
      targetFreeAreaRatio: requireFiniteRatio(profile.targetFreeAreaRatio, `${density} targetFreeAreaRatio`),
      tolerance: requireFiniteRatio(profile.tolerance, `${density} tolerance`)
    });
  }
  return Object.freeze(result);
}

function rounded(value) {
  return Number(value.toFixed(12));
}

function boundedRangeSatisfaction(actual, minimum, maximum) {
  if (actual < minimum) return minimum === 0 ? 1 : Math.max(0, actual / minimum);
  if (actual > maximum) return maximum === 1 ? 1 : Math.max(0, 1 - (actual - maximum) / (1 - maximum));
  return 1;
}

export class SpatialPreferenceEvaluator {
  constructor({ densityProfiles } = {}) {
    this._densityProfiles = requireDensityProfiles(densityProfiles);
    Object.freeze(this);
  }

  evaluate({ occupancyProfile, spatialPreferences } = {}) {
    const actualFreeAreaRatio = requireFiniteRatio(occupancyProfile?.freeAreaRatio, 'actual freeAreaRatio');
    const density = spatialPreferences?.density;
    const densityProfile = this._densityProfiles[density];
    if (!densityProfile) throw new Error(`SpatialPreferenceEvaluator unsupported density: ${density}`);
    const emptyPreference = spatialPreferences?.emptySpacePreference;
    if (!emptyPreference || typeof emptyPreference !== 'object') {
      throw new Error('SpatialPreferenceEvaluator emptySpacePreference must be an object');
    }
    const mode = emptyPreference.mode;
    const target = requireFiniteRatio(emptyPreference.targetFreeAreaRatio, 'emptySpacePreference targetFreeAreaRatio');
    const densityMinimum = Math.max(0, densityProfile.targetFreeAreaRatio - densityProfile.tolerance);
    const densityMaximum = Math.min(1, densityProfile.targetFreeAreaRatio + densityProfile.tolerance);

    let minimumFreeAreaRatio = densityMinimum;
    let maximumFreeAreaRatio = densityMaximum;
    if (mode === 'discourage-excess') {
      maximumFreeAreaRatio = Math.min(densityMaximum, target);
    } else if (mode === 'require-open') {
      minimumFreeAreaRatio = Math.max(densityMinimum, target);
    } else if (mode !== 'allow') {
      throw new Error(`SpatialPreferenceEvaluator emptySpacePreference mode is not supported: ${mode}`);
    }

    return Object.freeze({
      satisfaction: rounded(boundedRangeSatisfaction(actualFreeAreaRatio, minimumFreeAreaRatio, maximumFreeAreaRatio)),
      actualFreeAreaRatio: rounded(actualFreeAreaRatio),
      minimumFreeAreaRatio: rounded(minimumFreeAreaRatio),
      maximumFreeAreaRatio: rounded(maximumFreeAreaRatio)
    });
  }
}

export default SpatialPreferenceEvaluator;
