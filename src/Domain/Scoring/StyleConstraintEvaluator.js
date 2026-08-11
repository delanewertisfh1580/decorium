import { LinearConstraint } from '../Constraints/LinearConstraint.js';
import { Violation } from '../Constraints/Violation.js';

function toConstraint(data) {
  if (data instanceof LinearConstraint) return data;
  const operator = data.operator === '>=' ? 'gte' : data.operator === '<=' ? 'lte' : data.operator;
  return new LinearConstraint(data.featureKey ?? data.feature, operator, data.threshold, data.id, data.weight, data.messageKey);
}

export class StyleConstraintEvaluator {
  constructor(constraints) {
    if (!Array.isArray(constraints)) throw new Error('Constraints must be an array');
    this._constraints = Object.freeze(constraints.map(toConstraint));
  }

  get constraints() { return this._constraints; }

  evaluate(roomVector) {
    if (!roomVector || typeof roomVector !== 'object') throw new Error('Room vector must be a valid object');
    const violations = [];
    for (const constraint of this._constraints) {
      if (!(constraint.featureKey in roomVector)) continue;
      const violation = Violation.fromConstraint(constraint, roomVector[constraint.featureKey]);
      if (violation) violations.push(violation);
    }
    return Object.freeze(violations);
  }

  isSatisfied(roomVector) { return this.evaluate(roomVector).length === 0; }

  getSummary(roomVector) {
    const violations = this.evaluate(roomVector);
    return Object.freeze({
      total: this._constraints.length,
      satisfied: this._constraints.length - violations.length,
      violated: violations.length,
      isPerfect: violations.length === 0
    });
  }
}
