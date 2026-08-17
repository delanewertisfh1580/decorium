function validateScore(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`StyleChannelPolicy ${label} must be between 0 and 1`);
  }
  return value;
}

function validateWeight(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`StyleChannelPolicy ${label} weight must be between 0 and 1`);
  }
  return value;
}

export class StyleChannelPolicy {
  constructor({ targetFitWeight, compositionWeight } = {}) {
    const targetFit = validateWeight(targetFitWeight, 'targetFit');
    const composition = validateWeight(compositionWeight, 'composition');
    if (Math.abs(targetFit + composition - 1) > 0.000001) {
      throw new Error('StyleChannelPolicy weights must sum to 1');
    }
    this._targetFitWeight = targetFit;
    this._compositionWeight = composition;
    Object.freeze(this);
  }

  evaluate({ weightedTargetFit, compositionScore } = {}) {
    const targetFit = validateScore(weightedTargetFit, 'weightedTargetFit');
    const composition = validateScore(compositionScore, 'compositionScore');
    return Object.freeze({
      score: Number((targetFit * this._targetFitWeight + composition * this._compositionWeight).toFixed(12)),
      targetFitWeight: this._targetFitWeight,
      compositionWeight: this._compositionWeight
    });
  }
}

export default StyleChannelPolicy;
