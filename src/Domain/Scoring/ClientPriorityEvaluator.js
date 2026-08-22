import { createDiagnosticId } from '../Diagnostics/DiagnosticIdentity.js';

function requireMethod(value, name, method) {
  if (!value || typeof value[method] !== 'function') {
    throw new Error(`ClientPriorityEvaluator ${name} must provide ${method}()`);
  }
  return value;
}

function rounded(value) {
  return Number(value.toFixed(12));
}

function requirePriorities(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('ClientPriorityEvaluator priorities must be a non-empty array');
  }
  return value;
}

function matchingItems(roomState, affordance) {
  return roomState.getItems().filter(placed => placed.item?.interactionProfile?.hasAffordance(affordance));
}

function priorityViolation({ priority, satisfaction, actualValue, itemIds, featureName }) {
  const constraintId = `client-priority:${priority.id}`;
  return Object.freeze({
    diagnosticId: createDiagnosticId(constraintId),
    constraintId,
    constraint: Object.freeze({
      id: `client-priority:${priority.id}`,
      weight: priority.weight,
      description: priority.label
    }),
    severity: rounded(1 - satisfaction),
    featureName,
    operator: 'gte',
    threshold: 1,
    actualValue,
    messageKey: priority.rule.messageKey,
    itemIds: Object.freeze([...itemIds].sort()),
    critical: false
  });
}

export class ClientPriorityEvaluator {
  constructor({ spatialPreferenceEvaluator } = {}) {
    this._spatialPreferenceEvaluator = requireMethod(spatialPreferenceEvaluator, 'spatialPreferenceEvaluator', 'evaluate');
    Object.freeze(this);
  }

  evaluate({ priorities, scenarios, roomState, occupancyProfile, spatialPreferences } = {}) {
    const validPriorities = requirePriorities(priorities);
    if (!Array.isArray(scenarios)) throw new Error('ClientPriorityEvaluator scenarios must be an array');
    if (!roomState || typeof roomState.getItems !== 'function') {
      throw new Error('ClientPriorityEvaluator roomState must provide getItems()');
    }
    const scenariosById = new Map(scenarios.map(scenario => [scenario.id, scenario]));
    const results = validPriorities.map(priority => {
      if (priority?.rule?.kind === 'functional-scenario') {
        const scenario = scenariosById.get(priority.rule.scenarioId);
        if (!scenario) throw new Error(`ClientPriorityEvaluator unknown scenario: ${priority.rule.scenarioId}`);
        const roleMatches = scenario.requiredRoles.map(role => ({
          role,
          items: matchingItems(roomState, role.affordance)
        }));
        const satisfaction = roleMatches.every(match => match.items.length >= match.role.minCount) ? 1 : 0;
        const itemIds = roleMatches.flatMap(match => match.items.map(item => item.id));
        return Object.freeze({
          id: priority.id,
          label: priority.label,
          weight: priority.weight,
          ruleKind: priority.rule.kind,
          satisfaction,
          satisfied: satisfaction === 1,
          actualValue: satisfaction,
          itemIds: Object.freeze(itemIds.sort()),
          violation: satisfaction === 1 ? null : priorityViolation({
            priority,
            satisfaction,
            actualValue: satisfaction,
            itemIds,
            featureName: 'functionalScenarioPriority'
          })
        });
      }
      if (priority?.rule?.kind === 'spatial-preferences') {
        const spatial = this._spatialPreferenceEvaluator.evaluate({ occupancyProfile, spatialPreferences });
        const satisfaction = spatial.satisfaction;
        return Object.freeze({
          id: priority.id,
          label: priority.label,
          weight: priority.weight,
          ruleKind: priority.rule.kind,
          satisfaction,
          satisfied: satisfaction === 1,
          actualValue: satisfaction,
          itemIds: Object.freeze([]),
          spatial,
          violation: satisfaction === 1 ? null : priorityViolation({
            priority,
            satisfaction,
            actualValue: satisfaction,
            itemIds: [],
            featureName: 'spatialPreferencePriority'
          })
        });
      }
      throw new Error(`ClientPriorityEvaluator unsupported priority rule: ${priority?.rule?.kind}`);
    });
    const totalWeight = results.reduce((total, priority) => total + priority.weight, 0);
    const score = rounded(results.reduce((total, priority) => total + priority.weight * priority.satisfaction, 0) / totalWeight);

    return Object.freeze({
      score,
      results: Object.freeze(results),
      violations: Object.freeze(results.flatMap(result => result.violation ? [result.violation] : []))
    });
  }
}

export default ClientPriorityEvaluator;
