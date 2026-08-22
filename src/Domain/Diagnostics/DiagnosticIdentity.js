function requiredSegment(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`DiagnosticIdentity ${label} must be a non-empty string`);
  }
  if (value.includes(':')) {
    throw new Error(`DiagnosticIdentity ${label} must not contain ':'`);
  }
  return value.trim();
}

/**
 * Creates a stable, rule-scoped identity for one concrete diagnostic.
 * The rule ID remains available separately as `constraintId`.
 */
export function createDiagnosticId(ruleId, scopeIds = []) {
  if (typeof ruleId !== 'string' || ruleId.trim() === '') {
    throw new Error('DiagnosticIdentity ruleId must be a non-empty string');
  }
  const normalizedRuleId = ruleId.trim();
  if (!Array.isArray(scopeIds)) {
    throw new Error('DiagnosticIdentity scopeIds must be an array');
  }
  const normalizedScope = scopeIds.map((scopeId, index) => requiredSegment(scopeId, `scopeIds[${index}]`));
  return Object.freeze([normalizedRuleId, ...normalizedScope].join(':'));
}

export function requireDiagnosticId(violation) {
  const diagnosticId = violation?.diagnosticId;
  if (typeof diagnosticId !== 'string' || diagnosticId.trim() === '') {
    throw new Error('DiagnosticIdentity violation.diagnosticId must be a non-empty string');
  }
  return diagnosticId;
}
