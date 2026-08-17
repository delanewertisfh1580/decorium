function validateWeight(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`ThreeChannelScoreAggregator ${name} weight must be a non-negative number`);
  }
  return value;
}

function validateScore(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`ThreeChannelScoreAggregator ${name} must be between 0 and 1`);
  }
  return value;
}

export class ThreeChannelScoreAggregator {
  constructor({ styleWeight, clientPriorityWeight, ergonomicsWeight } = {}) {
    const style = validateWeight(styleWeight, 'style');
    const clientPriority = validateWeight(clientPriorityWeight, 'clientPriority');
    const ergonomics = validateWeight(ergonomicsWeight, 'ergonomics');
    const total = style + clientPriority + ergonomics;
    if (total <= 0) throw new Error('ThreeChannelScoreAggregator requires at least one positive weight');
    this._styleWeight = style / total;
    this._clientPriorityWeight = clientPriority / total;
    this._ergonomicsWeight = ergonomics / total;
    Object.freeze(this);
  }

  aggregate({ styleScore, clientPriorityScore, ergonomicsScore } = {}) {
    const style = validateScore(styleScore, 'styleScore');
    const clientPriority = validateScore(clientPriorityScore, 'clientPriorityScore');
    const ergonomics = validateScore(ergonomicsScore, 'ergonomicsScore');
    return Object.freeze({
      totalScore: Number((
        style * this._styleWeight + clientPriority * this._clientPriorityWeight + ergonomics * this._ergonomicsWeight
      ).toFixed(12)),
      styleWeight: this._styleWeight,
      clientPriorityWeight: this._clientPriorityWeight,
      ergonomicsWeight: this._ergonomicsWeight
    });
  }
}

export default ThreeChannelScoreAggregator;
