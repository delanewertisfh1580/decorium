/**
 * StyleScorer - Domain Service for calculating style score from violations.
 * 
 * Formula:
 *   penalty = sum(violation.severity * weight)
 *   score = max(0, 1 - penalty)
 * 
 * @implements {import('./IStyleScorer.js').IStyleScorer}
 */
export class StyleScorer {
  /**
   * @param {{ defaultWeight: number, maxPenalty: number }} scoringParams
   */
  constructor(scoringParams) {
    if (!scoringParams || typeof scoringParams.defaultWeight !== 'number' || typeof scoringParams.maxPenalty !== 'number') {
      throw new Error('StyleScorer requires scoringParams with defaultWeight and maxPenalty');
    }

    this._defaultWeight = scoringParams.defaultWeight;
    this._maxPenalty = scoringParams.maxPenalty;

    // Freeze instance for immutability
    Object.freeze(this);
  }

  /**
   * Calculate total penalty from violations.
   * @param {import('../Constraints/Violation.js').Violation[]} violations
   * @returns {number} penalty capped at maxPenalty
   */
  calculatePenalty(violations) {
    if (!Array.isArray(violations)) {
      throw new Error('Violations must be an array');
    }

    if (violations.length === 0) {
      return 0;
    }

    const totalPenalty = violations.reduce((sum, violation) => {
      if (!violation || typeof violation.severity !== 'number') {
        throw new Error('Each violation must have a numeric severity');
      }
      return sum + (violation.severity * this._defaultWeight);
    }, 0);

    return Math.min(totalPenalty, this._maxPenalty);
  }

  /**
   * Calculate style score from penalty.
   * @param {number} penalty
   * @returns {number} score in range [0, 1]
   */
  calculateScore(penalty) {
    if (typeof penalty !== 'number' || penalty < 0) {
      throw new Error('Penalty must be a non-negative number');
    }

    const score = 1 - penalty;
    return Math.max(0, score);
  }

  /**
   * Evaluate violations and return complete scoring result.
   * @param {import('../Constraints/Violation.js').Violation[]} violations
   * @returns {{ penalty: number, score: number, violations: import('../Constraints/Violation.js').Violation[] }}
   */
  evaluate(violations) {
    const penalty = this.calculatePenalty(violations);
    const score = this.calculateScore(penalty);

    return Object.freeze({
      penalty,
      score,
      violations: [...violations],
    });
  }
}
