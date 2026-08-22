import { createDiagnosticId } from '../Diagnostics/DiagnosticIdentity.js';

function requirementViolation({ id, messageKey, threshold, actualValue, severity, weight = 1, description }) {
  return Object.freeze({
    diagnosticId: createDiagnosticId(id),
    constraintId: id,
    featureName: 'composition',
    operator: 'required',
    threshold,
    actualValue,
    severity: Math.max(0, Math.min(1, severity)),
    messageKey,
    constraint: Object.freeze({ id, weight, description })
  });
}

function requiredAffordancesFor(rules) {
  const value = rules.requiredAffordances ?? [];
  if (!Array.isArray(value) || !value.every(affordance => typeof affordance === 'string' && affordance.trim() !== '')) {
    throw new Error('Composition requiredAffordances must be an array of non-empty strings');
  }
  if (new Set(value).size !== value.length) {
    throw new Error('Composition requiredAffordances must be unique');
  }
  return value;
}

function authoredAffordancesFor(item) {
  const profile = item?.item?.interactionProfile ?? item?.interactionProfile;
  if (!profile || !Array.isArray(profile.affordances)) {
    throw new Error('Composition items must provide an authored InteractionProfile');
  }
  return profile.affordances;
}

/**
 * Evaluates whether a room contains the explicit authored capabilities required
 * by a client brief. Display type and visual category are intentionally ignored.
 */
export function evaluateComposition(items = [], rules = {}) {
  if (!Array.isArray(items)) throw new Error('Composition items must be an array');

  const minItems = Number.isInteger(rules.minItems) && rules.minItems > 0 ? rules.minItems : 0;
  const requiredAffordances = requiredAffordancesFor(rules);
  const affordances = new Set(items.flatMap(authoredAffordancesFor));
  const violations = [];

  if (items.length < minItems) {
    violations.push(requirementViolation({
      id: 'composition-min-items',
      messageKey: 'composition-too-few-items',
      threshold: minItems,
      actualValue: items.length,
      severity: (minItems - items.length) / minItems,
      weight: 1,
      description: `composition item count >= ${minItems}`
    }));
  }

  for (const affordance of requiredAffordances) {
    if (affordances.has(affordance)) continue;
    const id = `composition-affordance-${affordance}`;
    violations.push(requirementViolation({
      id,
      messageKey: `composition-missing-${affordance}`,
      threshold: 1,
      actualValue: 0,
      severity: 0.2,
      weight: 1,
      description: `composition affordance '${affordance}' is required`
    }));
  }

  const penalty = Math.min(1, violations.reduce((sum, violation) => (
    sum + violation.severity * violation.constraint.weight
  ), 0));

  return Object.freeze({
    complete: violations.length === 0,
    penalty,
    affordances: Object.freeze([...affordances].sort()),
    violations: Object.freeze(violations)
  });
}

export default evaluateComposition;
