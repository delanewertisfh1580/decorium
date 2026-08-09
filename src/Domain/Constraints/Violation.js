/**
 * Violation - Value Object representing a constraint violation.
 * Immutable after creation.
 */
export class Violation {
  /**
   * @param {import('./LinearConstraint.js').LinearConstraint} constraint
   * @param {number} actualValue
   * @param {number} severity - How severe the violation is (0-1)
   */
  constructor(constraint, actualValue, severity) {
    if (!constraint) {
      throw new Error('Violation requires a constraint');
    }
    if (typeof actualValue !== 'number') {
      throw new Error('Violation requires a numeric actualValue');
    }
    if (typeof severity !== 'number' || severity < 0 || severity > 1) {
      throw new Error('Severity must be a number between 0 and 1');
    }

    this._constraint = constraint;
    this._actualValue = actualValue;
    this._severity = severity;

    // Freeze for immutability
    Object.freeze(this);
  }

  /**
   * @returns {import('./LinearConstraint.js').LinearConstraint}
   */
  get constraint() {
    return this._constraint;
  }

  /**
   * @returns {number}
   */
  get actualValue() {
    return this._actualValue;
  }

  /**
   * @returns {number}
   */
  get severity() {
    return this._severity;
  }

  /**
   * Get the feature name being violated.
   * @returns {string}
   */
  get featureName() {
    return this._constraint.featureKey;
  }

  /**
   * Get the operator of the violated constraint.
   * @returns {string}
   */
  get operator() {
    return this._constraint.operator;
  }

  /**
   * Get the threshold of the violated constraint.
   * @returns {number}
   */
  get threshold() {
    return this._constraint.threshold;
  }

  /**
   * Create a Violation from a constraint and actual value.
   * @param {import('./LinearConstraint.js').LinearConstraint} constraint
   * @param {number} actualValue
   * @returns {Violation|null} null if no violation
   */
  static fromConstraint(constraint, actualValue) {
    const severity = constraint.calculateViolation(actualValue);
    
    // If severity is 0, constraint is satisfied - no violation
    if (severity === 0) {
      return null;
    }

    return new Violation(constraint, actualValue, severity);
  }

  /**
   * Convert to plain object for serialization.
   * @returns {{ featureName: string, operator: string, threshold: number, actualValue: number, severity: number }}
   */
  toJSON() {
    return {
      featureName: this.featureName,
      operator: this.operator,
      threshold: this.threshold,
      actualValue: this.actualValue,
      severity: this.severity,
    };
  }
}
