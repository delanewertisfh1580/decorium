import { Violation } from './Violation.js';

export class ConstraintEvaluationResult {
  constructor(constraint, isSatisfied, violation = null) {
    this._constraint = constraint;
    this._isSatisfied = isSatisfied;
    this._violation = violation;
    Object.freeze(this);
  }

  get constraint() { return this._constraint; }
  get isSatisfied() { return this._isSatisfied; }
  get violation() { return this._violation; }
}

export class ConstraintEvaluator {
  evaluate(constraint, value) {
    const violation = Violation.fromConstraint(constraint, value);
    return new ConstraintEvaluationResult(constraint, violation === null, violation);
  }

  evaluateAll(constraints, featureVector) {
    return constraints.map(constraint => {
      const value = featureVector?.[constraint.featureKey];
      if (typeof value !== 'number') {
        throw new Error(`Missing feature value for '${constraint.featureKey}'`);
      }
      return this.evaluate(constraint, value);
    });
  }
}
