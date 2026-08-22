import { createDiagnosticId } from '../Diagnostics/DiagnosticIdentity.js';

const ROLE_BY_TYPE = Object.freeze({
  sofa: 'seating',
  chair: 'seating',
  table: 'surface',
  lighting: 'lighting',
  storage: 'storage',
  decor: 'decor'
});

function requirementViolation({ id, messageKey, threshold, actualValue, severity, weight = 1, description }) {
  return {
    diagnosticId: createDiagnosticId(id),
    constraintId: id,
    featureName: 'composition',
    operator: 'required',
    threshold,
    actualValue,
    severity: Math.max(0, Math.min(1, severity)),
    messageKey,
    constraint: {
      id,
      weight,
      description
    }
  };
}

/**
 * Evaluates whether a room contains enough varied furniture to be considered
 * a designed composition. This is intentionally separate from style vectors:
 * a single stylish object may match the palette without solving the brief.
 */
export function evaluateComposition(items = [], rules = {}) {
  if (!Array.isArray(items)) throw new Error('Composition items must be an array');

  const minItems = Number.isInteger(rules.minItems) && rules.minItems > 0 ? rules.minItems : 0;
  const requiredRoles = Array.isArray(rules.requiredRoles) ? rules.requiredRoles : [];
  const roles = new Set(items.map(item => ROLE_BY_TYPE[item?.type ?? item?.item?.type]).filter(Boolean));
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

  for (const role of requiredRoles) {
    if (roles.has(role)) continue;
    violations.push(requirementViolation({
      id: `composition-role-${role}`,
      messageKey: `composition-missing-${role}`,
      threshold: 1,
      actualValue: 0,
      severity: 0.2,
      weight: 1,
      description: `composition role '${role}' is required`
    }));
  }

  const penalty = Math.min(1, violations.reduce((sum, violation) => (
    sum + violation.severity * violation.constraint.weight
  ), 0));

  return Object.freeze({
    complete: violations.length === 0,
    penalty,
    roles: [...roles],
    violations
  });
}

export { ROLE_BY_TYPE };
export default evaluateComposition;
