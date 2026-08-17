function requireMethod(value, name, method) {
  if (!value || typeof value[method] !== 'function') {
    throw new Error(`MultiStyleEvaluator ${name} must provide ${method}()`);
  }
  return value;
}

function requireTargets(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('MultiStyleEvaluator targets must be a non-empty array');
  }
  const ids = new Set();
  let totalWeight = 0;
  for (const target of value) {
    if (!target || typeof target.styleId !== 'string' || target.styleId.trim() === '') {
      throw new Error('MultiStyleEvaluator target styleId must be a non-empty string');
    }
    if (ids.has(target.styleId)) throw new Error(`MultiStyleEvaluator duplicate target styleId: ${target.styleId}`);
    ids.add(target.styleId);
    if (!Array.isArray(target.constraints)) {
      throw new Error(`MultiStyleEvaluator target constraints must be an array: ${target.styleId}`);
    }
    if (typeof target.weight !== 'number' || !Number.isFinite(target.weight) || target.weight <= 0 || target.weight > 1) {
      throw new Error(`MultiStyleEvaluator target weight must be between 0 and 1: ${target.styleId}`);
    }
    totalWeight += target.weight;
  }
  if (Math.abs(totalWeight - 1) > 0.000001) {
    throw new Error('MultiStyleEvaluator target weights must sum to 1');
  }
  return value;
}

function freezeTargetResult(target, scoring) {
  return Object.freeze({
    styleId: target.styleId,
    label: target.label,
    role: target.role,
    weight: target.weight,
    score: scoring.score,
    penalty: scoring.penalty,
    violations: Object.freeze([...scoring.violations])
  });
}

export class MultiStyleEvaluator {
  constructor({ constraintEvaluator, styleScorer } = {}) {
    this._constraintEvaluator = requireMethod(constraintEvaluator, 'constraintEvaluator', 'evaluateAll');
    this._styleScorer = requireMethod(styleScorer, 'styleScorer', 'evaluate');
    Object.freeze(this);
  }

  evaluate({ roomVector, targets } = {}) {
    if (!roomVector || typeof roomVector !== 'object') {
      throw new Error('MultiStyleEvaluator roomVector must be an object');
    }
    const validTargets = requireTargets(targets);
    const targetResults = validTargets.map(target => {
      const evaluations = this._constraintEvaluator.evaluateAll(target.constraints, roomVector);
      const violations = evaluations.filter(evaluation => !evaluation.isSatisfied).map(evaluation => evaluation.violation);
      return freezeTargetResult(target, this._styleScorer.evaluate(violations));
    });
    const weightedTargetFit = Number(targetResults.reduce(
      (total, target) => total + target.weight * target.score,
      0
    ).toFixed(12));

    return Object.freeze({
      weightedTargetFit,
      targets: Object.freeze(targetResults)
    });
  }
}

export default MultiStyleEvaluator;
