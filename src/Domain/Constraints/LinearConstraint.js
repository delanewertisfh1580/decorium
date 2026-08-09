/**
 * LinearConstraint - Value Object representing a style constraint rule
 * 
 * A constraint defines a requirement for a specific feature in the room vector.
 * Supported operators: 'gte' (>=), 'lte' (<=)
 */
export class LinearConstraint {
  /**
   * @param {string} featureKey - The feature name to constrain (e.g., 'wood_share')
   * @param {'gte'|'lte'} operator - The comparison operator
   * @param {number} threshold - The threshold value [0, 1]
   */
  constructor(featureKey, operator, threshold) {
    if (!featureKey || typeof featureKey !== 'string' || featureKey.trim() === '') {
      throw new Error('Feature key is required');
    }

    if (!['gte', 'lte'].includes(operator)) {
      throw new Error(`Invalid operator '${operator}'. Must be 'gte' or 'lte'`);
    }

    if (typeof threshold !== 'number' || isNaN(threshold)) {
      throw new Error('Threshold must be a number');
    }

    this._featureKey = featureKey;
    this._operator = operator;
    this._threshold = threshold;

    Object.freeze(this);
  }

  get featureKey() {
    return this._featureKey;
  }

  get operator() {
    return this._operator;
  }

  get threshold() {
    return this._threshold;
  }

  /**
   * Check if a value satisfies this constraint
   * @param {number} value - The actual value to check
   * @returns {boolean} True if constraint is satisfied
   */
  isSatisfied(value) {
    if (this._operator === 'gte') {
      return value >= this._threshold;
    }
    if (this._operator === 'lte') {
      return value <= this._threshold;
    }
    return false;
  }

  /**
   * Calculate violation amount (0 if satisfied, positive if violated)
   * @param {number} value - The actual value
   * @returns {number} Violation amount (0 or positive)
   */
  calculateViolation(value) {
    if (this.isSatisfied(value)) {
      return 0;
    }
    
    if (this._operator === 'gte') {
      return this._threshold - value;
    }
    if (this._operator === 'lte') {
      return value - this._threshold;
    }
    return 0;
  }
}
