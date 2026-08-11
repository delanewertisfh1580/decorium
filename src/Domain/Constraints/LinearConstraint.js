/**
 * Value object describing a single style constraint.
 */
export class LinearConstraint {
  constructor(featureKey, operator, threshold, id = null, weight = 1, messageKey = null) {
    if (!featureKey || typeof featureKey !== 'string') throw new Error('Feature key is required');
    if (!['gte', 'lte'].includes(operator)) {
      throw new Error(`Invalid operator '${operator}'. Must be 'gte' or 'lte'`);
    }
    if (typeof threshold !== 'number' || Number.isNaN(threshold)) {
      throw new Error('Threshold must be a number');
    }

    // Preserve the legacy constructor form where the fourth argument was a numeric weight.
    if (typeof id === 'number') {
      weight = id;
      id = null;
    }

    this._featureKey = featureKey;
    this._operator = operator;
    this._threshold = threshold;
    this._id = id;
    this._weight = typeof weight === 'number' ? weight : 1;
    this._messageKey = messageKey;
    Object.freeze(this);
  }

  get featureKey() { return this._featureKey; }
  get feature() { return this._featureKey; }
  get operator() { return this._operator; }
  get threshold() { return this._threshold; }
  get id() { return this._id; }
  get weight() { return this._weight; }
  get messageKey() { return this._messageKey; }
  get description() { return `${this._featureKey} ${this._operator} ${this._threshold}`; }

  isSatisfied(value) {
    return this._operator === 'gte' ? value >= this._threshold : value <= this._threshold;
  }

  calculateViolation(value) {
    if (this.isSatisfied(value)) return 0;
    return this._operator === 'gte'
      ? this._threshold - value
      : value - this._threshold;
  }
}
