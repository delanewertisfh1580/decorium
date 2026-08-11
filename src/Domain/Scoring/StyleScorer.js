export class StyleScorer {
  constructor(scoringParams = {}) {
    this._defaultWeight = typeof scoringParams.defaultWeight === 'number' ? scoringParams.defaultWeight : 1;
    this._maxPenalty = typeof scoringParams.maxPenalty === 'number' ? scoringParams.maxPenalty : 1;
    Object.freeze(this);
  }

  calculatePenalty(violations) {
    if (!Array.isArray(violations)) throw new Error('Violations must be an array');
    const totalPenalty = violations.reduce((sum, violation) => {
      if (!violation || typeof violation.severity !== 'number') throw new Error('Each violation must have a numeric severity');
      const weight = typeof violation.constraint?.weight === 'number' ? violation.constraint.weight : this._defaultWeight;
      return sum + violation.severity * weight;
    }, 0);
    return Math.min(this._maxPenalty, totalPenalty);
  }

  calculateScore(penalty) {
    if (typeof penalty !== 'number' || penalty < 0) throw new Error('Penalty must be a non-negative number');
    return Math.max(0, Math.min(1, 1 - penalty));
  }

  evaluate(violations) {
    const penalty = this.calculatePenalty(violations);
    return Object.freeze({ penalty, score: this.calculateScore(penalty), violations: [...violations] });
  }
}
