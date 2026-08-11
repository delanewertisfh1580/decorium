/**
 * ConstraintEvaluationResult - Value Object representing the result of evaluating a constraint
 */
import { Violation } from './Violation.js';

export class ConstraintEvaluationResult {
  constructor(constraint, isSatisfied, violation) {
    this._constraint = constraint;
    this._isSatisfied = isSatisfied;
    this._violation = violation;

    Object.freeze(this);
  }

  get constraint() {
    return this._constraint;
  }

  get isSatisfied() {
    return this._isSatisfied;
  }

  get violation() {
    return this._violation;
  }
}

/**
 * ConstraintEvaluator - Domain Service for evaluating constraints against values
 */
export class ConstraintEvaluator {
  /**
   * Evaluate a single constraint against a value
   * @param {LinearConstraint} constraint - The constraint to evaluate
   * @param {number} value - The actual value to check
   * @returns {ConstraintEvaluationResult} The evaluation result
   */
  evaluate(constraint, value) {
    const isSatisfied = constraint.isSatisfied(value);
    const violation = Violation.fromConstraint(constraint, value);

    return new ConstraintEvaluationResult(constraint, isSatisfied, violation);
  }

  /**
   * Evaluate multiple constraints against a set of feature values
   * @param {LinearConstraint[]} constraints - Array of constraints to evaluate
   * @param {Object.<string, number>} featureValues - Map of feature names to values
   * @returns {ConstraintEvaluationResult[]} Array of evaluation results
   */
  evaluateAll(constraints, featureValues) {
    return constraints.map(constraint => {
      const value = featureValues[constraint.featureKey];
      if (value === undefined) {
        throw new Error(`Missing feature value for '${constraint.featureKey}'`);
      }
      return this.evaluate(constraint, value);
    });
  }
}
