const CRITICAL_RULE_MODES = new Set(['block-completion', 'cap-stars', 'informational']);

function positiveInteger(value, label, { min = 0, max = 5 } = {}) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`ScorecardCalibrationPolicy ${label} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function completionPolicy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('ScorecardCalibrationPolicy completion must be an object');
  }
  const minimumStars = positiveInteger(value.minimumStars, 'completion.minimumStars', { min: 1, max: 5 });
  if (!CRITICAL_RULE_MODES.has(value.criticalRuleMode)) {
    throw new Error('ScorecardCalibrationPolicy completion.criticalRuleMode is not supported');
  }
  return Object.freeze({ minimumStars, criticalRuleMode: value.criticalRuleMode });
}

function criticalViolationIds(violations) {
  if (!Array.isArray(violations)) {
    throw new Error('ScorecardCalibrationPolicy violations must be an array');
  }
  return Object.freeze([...new Set(violations
    .filter(violation => violation?.critical === true)
    .map(violation => violation.constraintId)
    .filter(id => typeof id === 'string' && id.trim() !== ''))].sort());
}

export class ScorecardCalibrationPolicy {
  constructor({ schemaVersion, criticalStarCap } = {}) {
    if (schemaVersion !== 1) throw new Error('ScorecardCalibrationPolicy schemaVersion must be 1');
    this._schemaVersion = schemaVersion;
    this._criticalStarCap = positiveInteger(criticalStarCap, 'criticalStarCap', { min: 0, max: 4 });
    Object.freeze(this);
  }

  get schemaVersion() { return this._schemaVersion; }
  get criticalStarCap() { return this._criticalStarCap; }

  evaluate({ totalScore, ratingPolicy, completion, violations }) {
    if (typeof totalScore !== 'number' || !Number.isFinite(totalScore) || totalScore < 0 || totalScore > 1) {
      throw new Error('ScorecardCalibrationPolicy totalScore must be between 0 and 1');
    }
    if (!ratingPolicy || typeof ratingPolicy.evaluate !== 'function' || !ratingPolicy.thresholds) {
      throw new Error('ScorecardCalibrationPolicy ratingPolicy must provide evaluate and thresholds');
    }

    const completionConfig = completionPolicy(completion);
    const violationIds = criticalViolationIds(violations);
    const rawRating = ratingPolicy.evaluate(totalScore);
    let stars = rawRating.stars;
    let completionBlockReason = null;

    if (violationIds.length > 0) {
      if (completionConfig.criticalRuleMode === 'block-completion') {
        stars = Math.min(stars, completionConfig.minimumStars - 1, this.criticalStarCap);
        completionBlockReason = 'critical-rule';
      } else if (completionConfig.criticalRuleMode === 'cap-stars') {
        stars = Math.min(stars, this.criticalStarCap);
      }
    }

    const completionEligible = completionConfig.criticalRuleMode === 'block-completion' && violationIds.length > 0
      ? false
      : stars >= completionConfig.minimumStars;
    const nextThreshold = stars < 5 ? ratingPolicy.thresholds[String(stars + 1)] : null;

    return Object.freeze({
      rawScore: totalScore,
      rawStars: rawRating.stars,
      stars,
      nextThreshold,
      completionEligible,
      completionBlockReason,
      criticalViolationIds: violationIds
    });
  }
}

export default ScorecardCalibrationPolicy;
