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

function requireFunctionalSatisfactionPolicy(value) {
  if (value?.schemaVersion !== 1 || value.mode !== 'demand-weighted-coverage') {
    throw new Error('ClientPriorityEvaluator functionalSatisfactionPolicy must use a supported mode');
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

function evaluateDemandWeightedCoverage(roomState, scenario) {
  const roleCoverage = scenario.requiredRoles.map(role => {
    const items = matchingItems(roomState, role.affordance);
    const actualCount = items.length;
    const requiredCount = role.minCount;
    const coveredUnits = Math.min(requiredCount, actualCount);
    return Object.freeze({
      affordance: role.affordance,
      requiredCount,
      actualCount,
      missingCount: Math.max(0, requiredCount - actualCount),
      coverage: rounded(coveredUnits / requiredCount),
      itemIds: Object.freeze(items.map(item => item.id).sort())
    });
  });
  const requiredUnits = roleCoverage.reduce((total, role) => total + role.requiredCount, 0);
  const coveredUnits = roleCoverage.reduce((total, role) => total + Math.min(role.requiredCount, role.actualCount), 0);
  const missingUnits = requiredUnits - coveredUnits;
  const satisfaction = rounded(coveredUnits / requiredUnits);
  const itemIds = Object.freeze([...new Set(roleCoverage.flatMap(role => role.itemIds))].sort());

  return Object.freeze({
    satisfaction,
    scenarioComplete: missingUnits === 0,
    missingUnits,
    roleCoverage: Object.freeze(roleCoverage),
    itemIds
  });
}

export class ClientPriorityEvaluator {
  constructor({ spatialPreferenceEvaluator } = {}) {
    this._spatialPreferenceEvaluator = requireMethod(spatialPreferenceEvaluator, 'spatialPreferenceEvaluator', 'evaluate');
    Object.freeze(this);
  }

  evaluate({ priorities, scenarios, roomState, occupancyProfile, spatialPreferences, functionalSatisfactionPolicy } = {}) {
    const validPriorities = requirePriorities(priorities);
    if (!Array.isArray(scenarios)) throw new Error('ClientPriorityEvaluator scenarios must be an array');
    if (!roomState || typeof roomState.getItems !== 'function') {
      throw new Error('ClientPriorityEvaluator roomState must provide getItems()');
    }
    const scenariosById = new Map(scenarios.map(scenario => [scenario.id, scenario]));
    const results = validPriorities.map(priority => {
      if (priority?.rule?.kind === 'functional-scenario') {
        requireFunctionalSatisfactionPolicy(functionalSatisfactionPolicy);
        const scenario = scenariosById.get(priority.rule.scenarioId);
        if (!scenario) throw new Error(`ClientPriorityEvaluator unknown scenario: ${priority.rule.scenarioId}`);
        const coverage = evaluateDemandWeightedCoverage(roomState, scenario);
        return Object.freeze({
          id: priority.id,
          label: priority.label,
          weight: priority.weight,
          ruleKind: priority.rule.kind,
          functionalSatisfactionMode: functionalSatisfactionPolicy.mode,
          satisfaction: coverage.satisfaction,
          satisfied: coverage.scenarioComplete,
          scenarioComplete: coverage.scenarioComplete,
          actualValue: coverage.satisfaction,
          missingUnits: coverage.missingUnits,
          roleCoverage: coverage.roleCoverage,
          itemIds: coverage.itemIds,
          violation: coverage.scenarioComplete ? null : priorityViolation({
            priority,
            satisfaction: coverage.satisfaction,
            actualValue: coverage.satisfaction,
            itemIds: coverage.itemIds,
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
