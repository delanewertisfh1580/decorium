export class Violation {
  constructor(constraint, actualValue, severity) {
    if (!constraint) throw new Error('Violation requires a constraint');
    if (typeof actualValue !== 'number') throw new Error('Violation requires a numeric actualValue');
    if (typeof severity !== 'number' || severity < 0 || severity > 1) {
      throw new Error('Severity must be a number between 0 and 1');
    }

    this._constraint = constraint;
    this._actualValue = actualValue;
    this._severity = severity;
    Object.freeze(this);
  }

  get constraint() { return this._constraint; }
  get actualValue() { return this._actualValue; }
  get severity() { return this._severity; }
  get featureName() { return this._constraint.featureKey; }
  get constraintId() { return this._constraint.id || this._constraint.featureKey; }
  get operator() { return this._constraint.operator; }
  get threshold() { return this._constraint.threshold; }
  get messageKey() { return this._constraint.messageKey; }

  static fromConstraint(constraint, actualValue) {
    const difference = constraint.calculateViolation(actualValue);
    if (difference <= 0) return null;
    return new Violation(constraint, actualValue, Math.min(1, difference));
  }

  toJSON() {
    return {
      featureName: this.featureName,
      operator: this.operator,
      threshold: this.threshold,
      actualValue: this.actualValue,
      severity: this.severity,
      messageKey: this.messageKey
    };
  }
}
