export class ErgonomicsScorer {
  constructor({ maxPenalty = 1, defaultWeight = 1 } = {}) {
    if (typeof maxPenalty !== 'number' || !Number.isFinite(maxPenalty) || maxPenalty <= 0) {
      throw new Error('ErgonomicsScorer maxPenalty must be a positive number');
    }
    if (typeof defaultWeight !== 'number' || !Number.isFinite(defaultWeight) || defaultWeight <= 0) {
      throw new Error('ErgonomicsScorer defaultWeight must be a positive number');
    }
    this._maxPenalty = maxPenalty;
    this._defaultWeight = defaultWeight;
    Object.freeze(this);
  }

  calculatePenalty(violations) {
    if (!Array.isArray(violations)) throw new Error('Violations must be an array');
    const total = violations.reduce((sum, violation) => {
      if (!violation || typeof violation.severity !== 'number') {
        throw new Error('Each violation must have a numeric severity');
      }
      const weight = typeof violation.constraint?.weight === 'number'
        ? violation.constraint.weight
        : this._defaultWeight;
      return sum + violation.severity * weight;
    }, 0);
    return Math.min(this._maxPenalty, total);
  }

  calculateScore(penalty) {
    if (typeof penalty !== 'number' || !Number.isFinite(penalty) || penalty < 0) {
      throw new Error('Penalty must be a non-negative number');
    }
    return Math.exp(-penalty);
  }

  evaluate(violations) {
    const penalty = this.calculatePenalty(violations);
    return Object.freeze({ penalty, score: this.calculateScore(penalty), violations: [...violations] });
  }
}

export default ErgonomicsScorer;
