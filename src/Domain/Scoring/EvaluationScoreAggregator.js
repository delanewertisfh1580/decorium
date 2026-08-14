function validateWeight(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`EvaluationScoreAggregator ${name} weight must be a non-negative number`);
  }
  return value;
}

function validateScore(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`EvaluationScoreAggregator ${name} must be between 0 and 1`);
  }
  return value;
}

export class EvaluationScoreAggregator {
  constructor({ styleWeight, ergonomicsWeight }) {
    this._styleWeight = validateWeight(styleWeight, 'style');
    this._ergonomicsWeight = validateWeight(ergonomicsWeight, 'ergonomics');
    const totalWeight = this._styleWeight + this._ergonomicsWeight;
    if (totalWeight <= 0) throw new Error('EvaluationScoreAggregator requires at least one positive weight');
    this._normalizedStyleWeight = this._styleWeight / totalWeight;
    this._normalizedErgonomicsWeight = this._ergonomicsWeight / totalWeight;
    Object.freeze(this);
  }

  aggregate({ styleScore, ergonomicsScore }) {
    const validStyleScore = validateScore(styleScore, 'styleScore');
    const validErgonomicsScore = validateScore(ergonomicsScore, 'ergonomicsScore');
    const totalScore = validStyleScore * this._normalizedStyleWeight + validErgonomicsScore * this._normalizedErgonomicsWeight;

    return Object.freeze({
      totalScore: Number(totalScore.toFixed(12)),
      styleWeight: this._normalizedStyleWeight,
      ergonomicsWeight: this._normalizedErgonomicsWeight
    });
  }
}

export default EvaluationScoreAggregator;
